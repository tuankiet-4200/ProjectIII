import os
from fastapi import APIRouter
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL) if DATABASE_URL else None

@router.get("/{user_id}")
async def get_recommendations(user_id: str):
    """
    Hệ thống gợi ý sản phẩm (Mock-up hoặc Rule-based)
    Trong thực tế, có thể dùng dữ liệu user_interactions để filter hoặc dùng ML.
    Phiên bản hiện tại: Lấy top 5 sản phẩm bán chạy nhất.
    """
    if not engine:
        return {"recommendations": []}

    try:
        with engine.connect() as conn:
            # Thuật toán khởi điểm: Trending (bán chạy nhất) hoặc mới nhất
            query = text("""
                SELECT id, name, price, sales_count, images 
                FROM products 
                ORDER BY sales_count DESC, created_at DESC 
                LIMIT 5
            """)
            result = conn.execute(query).fetchall()

            products = []
            for row in result:
                images = row[4] if row[4] else []
                products.append({
                    "id": str(row[0]),
                    "name": row[1],
                    "price": float(row[2]),
                    "sales_count": row[3],
                    "image": images[0] if len(images) > 0 else None
                })

            return {"recommendations": products}
    except Exception as e:
        print(f"Error fetching recommendations: {e}")
        return {"recommendations": []}
