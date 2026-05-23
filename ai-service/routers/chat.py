import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from services.vector_store import search_products
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class ChatRequest(BaseModel):
    message: str
    session_id: str = None
    history: list = []  # List of dicts [{"role": "user"/"model", "parts": ["text"]}]
    shop_id: str = None
    shop_name: str = None

class ChatResponse(BaseModel):
    reply: str

@router.post("/predict", response_model=ChatResponse)
async def predict_chat(request: ChatRequest):
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        # Fallback dummy logic if no API key
        return ChatResponse(reply="[Dummy] Hệ thống đang thiếu GEMINI_API_KEY. Tuy nhiên, tôi nhận được tin nhắn của bạn: " + request.message)

    try:
        # Bước 1: RAG Retrieval - Tìm kiếm sản phẩm liên quan
        search_query = request.message
        if request.history:
            for msg in reversed(request.history):
                if msg.get('role') == 'user':
                    last_user_msg = msg.get('parts', [''])[0]
                    search_query = f"{last_user_msg} {request.message}"
                    break
                    
        search_results = search_products(search_query, top_k=3, shop_id=request.shop_id)
        
        context_str = "Danh sách sản phẩm tham khảo:\n"
        if search_results and search_results['documents'] and len(search_results['documents'][0]) > 0:
            for idx, doc in enumerate(search_results['documents'][0]):
                context_str += f"- {doc}\n"
        else:
            context_str += "(Không tìm thấy sản phẩm nào liên quan)\n"

        # Bước 2: Chuẩn bị Prompt
        if request.shop_name:
            system_prompt = f"""Bạn là nhân viên Chăm Sóc Khách Hàng chuyên nghiệp của cửa hàng {request.shop_name} trên sàn Thương Mại Điện Tử ProjectIII.
Bạn có nhiệm vụ tư vấn sản phẩm của cửa hàng, trả lời câu hỏi và hỗ trợ khách hàng mua sắm.
Dưới đây là thông tin sản phẩm của cửa hàng tìm thấy trong hệ thống dựa trên yêu cầu của khách:
---
{context_str}
---
Hãy dựa vào các thông tin trên để trả lời khách hàng một cách tự nhiên, thân thiện và ngắn gọn.
Nếu không có thông tin sản phẩm phù hợp, hãy xin lỗi khách.
Không bịa đặt thông tin sản phẩm không có trong danh sách tham khảo.
"""
        else:
            system_prompt = f"""Bạn là trợ lý ảo AI chuyên nghiệp của sàn Thương Mại Điện Tử ProjectIII.
Bạn có nhiệm vụ tư vấn sản phẩm, trả lời câu hỏi về chính sách và hỗ trợ khách hàng mua sắm.
Dưới đây là thông tin sản phẩm tìm thấy trong hệ thống dựa trên yêu cầu của khách:
---
{context_str}
---
Hãy dựa vào các thông tin trên để trả lời khách hàng một cách tự nhiên, lịch sự và ngắn gọn.
Nếu không có thông tin sản phẩm phù hợp, hãy xin lỗi và gợi ý khách tìm kiếm từ khóa khác.
Không bịa đặt thông tin sản phẩm không có trong danh sách tham khảo.
"""
        
        # Cấu hình model
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Build history format cho genai
        # genai history format: [{'role': 'user', 'parts': ['Hello']}, {'role': 'model', 'parts': ['Hi']}]
        gemini_history = []
        for msg in request.history:
            role = 'user' if msg.get('role') == 'user' else 'model'
            gemini_history.append({
                "role": role,
                "parts": msg.get('parts', [""])
            })
            
        # Khởi tạo chat session
        chat_session = model.start_chat(history=gemini_history)
        
        # Gửi tin nhắn kèm system prompt (dùng mẹo nối system prompt vào tin nhắn hiện tại)
        full_message = f"{system_prompt}\n\nTin nhắn của khách hàng: {request.message}"
        response = chat_session.send_message(full_message)

        return ChatResponse(reply=response.text)

    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        raise HTTPException(status_code=500, detail="Internal server error calling AI service")
