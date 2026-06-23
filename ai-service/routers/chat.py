import os
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
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
    products_context: list = []

class ChatResponse(BaseModel):
    reply: str

@router.post("/predict", response_model=ChatResponse)
async def predict_chat(request: ChatRequest):
    if not DEEPSEEK_API_KEY:
        return ChatResponse(reply="[Dummy] Hệ thống đang thiếu DEEPSEEK_API_KEY. Tin nhắn: " + request.message)

    try:
        products_context = format_products_context(request.products_context)
        if request.shop_name:
            system_prompt = f"""Bạn là nhân viên Chăm Sóc Khách Hàng chuyên nghiệp của cửa hàng {request.shop_name} trên sàn Thương Mại Điện Tử ProjectIII.
Bạn có nhiệm vụ tư vấn sản phẩm của cửa hàng, trả lời câu hỏi và hỗ trợ khách hàng mua sắm.
Dưới đây là danh sách sản phẩm liên quan được lấy trực tiếp từ hệ thống:
---
{products_context}
---
Hãy trả lời khách hàng một cách tự nhiên, thân thiện và ngắn gọn.
Chỉ được nêu tên, giá, tồn kho hoặc mô tả sản phẩm có trong danh sách trên.
Nếu danh sách rỗng hoặc không có sản phẩm phù hợp với câu hỏi, hãy nói rằng hiện chưa tìm thấy sản phẩm phù hợp trong shop và gợi ý khách thử từ khóa khác hoặc nhắn shop.
Không bịa đặt giá, tồn kho, khuyến mãi hoặc thông số sản phẩm.
"""
        else:
            system_prompt = f"""Bạn là trợ lý ảo AI chuyên nghiệp của sàn Thương Mại Điện Tử ProjectIII.
Bạn có nhiệm vụ tư vấn sản phẩm, trả lời câu hỏi về chính sách và hỗ trợ khách hàng mua sắm.
Dưới đây là danh sách sản phẩm liên quan được lấy trực tiếp từ hệ thống:
---
{products_context}
---
Hãy trả lời khách hàng một cách tự nhiên, lịch sự và ngắn gọn.
Chỉ được nêu tên, giá, tồn kho hoặc mô tả sản phẩm có trong danh sách trên.
Nếu danh sách rỗng hoặc không có sản phẩm phù hợp với câu hỏi, hãy nói rằng hiện chưa tìm thấy sản phẩm phù hợp và gợi ý khách thử từ khóa khác.
Không bịa đặt giá, tồn kho, khuyến mãi hoặc thông số sản phẩm.
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


def format_products_context(products: list):
    if not products:
        return "(Không tìm thấy sản phẩm phù hợp trong hệ thống)"

    lines = []
    for product in products[:8]:
        name = product.get("name") or "Sản phẩm không tên"
        price = product.get("price")
        stock = product.get("stock_quantity")
        description = (product.get("description") or "").strip()
        slug = product.get("slug")

        parts = [f"Tên: {name}"]
        if price is not None:
            parts.append(f"Giá: {price}")
        if stock is not None:
            parts.append(f"Tồn kho: {stock}")
        if slug:
            parts.append(f"Slug: {slug}")
        if description:
            parts.append(f"Mô tả: {description[:300]}")
        lines.append("- " + "; ".join(parts))

    return "\n".join(lines)
