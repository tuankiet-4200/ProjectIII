import os
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.vector_store import search_products
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-v4-flash")
DEEPSEEK_TIMEOUT_SECONDS = int(os.getenv("DEEPSEEK_TIMEOUT_SECONDS", "30"))

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
    if not DEEPSEEK_API_KEY:
        return ChatResponse(reply="[Dummy] Hệ thống đang thiếu DEEPSEEK_API_KEY. Tin nhắn: " + request.message)

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
        if search_results and 'documents' in search_results and len(search_results['documents']) > 0 and len(search_results['documents'][0]) > 0:
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
        
        # Build history format cho DeepSeek (OpenAI format)
        messages = [{"role": "system", "content": system_prompt}]
        for msg in request.history:
            role = 'user' if msg.get('role') == 'user' else 'assistant'
            messages.append({
                "role": role,
                "content": msg.get('parts', [""])[0]
            })
            
        messages.append({"role": "user", "content": request.message})

        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "model": DEEPSEEK_MODEL,
            "messages": messages,
            "stream": False
        }

        response = requests.post(
            "https://api.deepseek.com/chat/completions",
            headers=headers,
            json=data,
            timeout=DEEPSEEK_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        result = response.json()
        
        reply_text = result['choices'][0]['message']['content']

        return ChatResponse(reply=reply_text)

    except Exception as e:
        print(f"Error calling DeepSeek API: {e}")
        if 'response' in locals() and hasattr(response, 'text'):
            print(f"Response details: {response.text}")
        raise HTTPException(status_code=500, detail="Internal server error calling AI service")
