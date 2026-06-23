import os
from fastapi import APIRouter
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from services.vector_store import search_products

load_dotenv()
router = APIRouter()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL) if DATABASE_URL else None

def get_trending_products(conn, limit=5, exclude_ids=None):
    if exclude_ids is None:
        exclude_ids = []
    
    query_str = """
        SELECT id, name, price, sales_count, images, stock_quantity, slug 
        FROM products 
    """
    if exclude_ids:
        query_str += " WHERE id NOT IN :exclude_ids "
        
    query_str += " ORDER BY sales_count DESC, created_at DESC LIMIT :limit"
    
    params = {"limit": limit}
    if exclude_ids:
        params["exclude_ids"] = tuple(exclude_ids)
        
    result = conn.execute(text(query_str), params).fetchall()
    return format_products(result)

def format_products(result_rows):
    products = []
    for row in result_rows:
        images = row[4] if row[4] else []
        products.append({
            "id": str(row[0]),
            "name": row[1],
            "price": float(row[2]),
            "sales_count": row[3],
            "images": images,
            "stock_quantity": row[5] if len(row) > 5 else 0,
            "slug": row[6] if len(row) > 6 else str(row[0])
        })
    return products

@router.get("/{user_id}")
async def get_recommendations(user_id: str, q: str = None):
    """
    Hệ thống gợi ý lai (Hybrid Recommendation System):
    1. Lọc cộng tác (Collaborative Filtering)
    2. Gợi ý theo nội dung (Content-based Vector Search)
    3. Fallback về Trending
    """
    if not engine:
        return {"recommendations": []}

    try:
        with engine.connect() as conn:
            # 1. Nếu là guest, trả về trending
            if not user_id or user_id == 'guest':
                return {"recommendations": get_trending_products(conn)}

            recommended_product_ids = []

            # 2. Lọc cộng tác (Collaborative Filtering)
            # Tìm người dùng tương tự và lấy sản phẩm họ quan tâm
            cf_query = text("""
                SELECT product_id, SUM(
                    (CASE interaction_type 
                        WHEN 'PURCHASE' THEN 5 
                        WHEN 'ADD_TO_CART' THEN 3 
                        WHEN 'VIEW' THEN 1 
                        ELSE 0 
                    END) * EXP(-0.1 * EXTRACT(EPOCH FROM (NOW() - created_at))/60)
                ) as score
                FROM user_interactions
                WHERE user_id IN (
                    SELECT DISTINCT user_id 
                    FROM user_interactions 
                    WHERE product_id IN (
                        SELECT product_id FROM user_interactions WHERE user_id = :user_id
                    ) AND user_id != :user_id
                )
                AND product_id NOT IN (
                    SELECT product_id FROM user_interactions WHERE user_id = :user_id
                )
                GROUP BY product_id
                ORDER BY score DESC
                LIMIT 8
            """)
            cf_results = conn.execute(cf_query, {"user_id": user_id}).fetchall()
            for row in cf_results:
                recommended_product_ids.append(str(row[0]))

            # 3. Content-Based (RAG / Vector Search) đa dạng hóa
            # Lấy top 3 sản phẩm yêu thích nhất gần đây của user
            top_products_query = text("""
                SELECT p.name, p.description, p.id
                FROM products p
                JOIN user_interactions ui ON p.id = ui.product_id
                WHERE ui.user_id = :user_id
                GROUP BY p.id, p.name, p.description
                ORDER BY SUM(
                    (CASE ui.interaction_type 
                        WHEN 'PURCHASE' THEN 5 
                        WHEN 'ADD_TO_CART' THEN 3 
                        ELSE 1 
                    END) * EXP(-0.1 * EXTRACT(EPOCH FROM (NOW() - ui.created_at))/60)
                ) DESC
                LIMIT 3
            """)
            top_products = conn.execute(top_products_query, {"user_id": user_id}).fetchall()

            if q:
                # Nếu có từ khóa tìm kiếm, chèn nó lên đầu như là mối quan tâm số 1 (cấp 8 vị trí)
                search_res = search_products(q, top_k=10)
                if search_res and search_res.get('ids') and len(search_res['ids']) > 0:
                    added = 0
                    for pid in search_res['ids'][0]:
                        if pid not in recommended_product_ids:
                            recommended_product_ids.append(pid)
                            added += 1
                            if added >= 8:
                                break

            if top_products:
                allocations = [8, 5, 3] if not q else [5, 3, 2] # Giảm số lượng nếu đã có kết quả search q
                for i, top_prod in enumerate(top_products):
                    name = top_prod[0]
                    desc = top_prod[1] or ""
                    top_id = str(top_prod[2])
                    k = allocations[i] if i < len(allocations) else 3
                    
                    # Tìm nhiều hơn lượng cần thiết một chút để bù trừ trùng lặp
                    search_res = search_products(f"{name} {desc}", top_k=k + 5)
                    if search_res and search_res.get('ids') and len(search_res['ids']) > 0:
                        added = 0
                        for pid in search_res['ids'][0]:
                            if pid != top_id and pid not in recommended_product_ids:
                                recommended_product_ids.append(pid)
                                added += 1
                                if added >= k:
                                    break

            # 4. Lấy chi tiết sản phẩm cho các ID đã tìm được
            final_products = []
            if recommended_product_ids:
                # Lấy ngẫu nhiên hoặc top 16 từ danh sách lai
                selected_ids = recommended_product_ids[:16]
                
                prod_query = text("""
                    SELECT id, name, price, sales_count, images, stock_quantity, slug 
                    FROM products 
                    WHERE id IN :ids
                """)
                prod_results = conn.execute(prod_query, {"ids": tuple(selected_ids)}).fetchall()
                final_products = format_products(prod_results)

            # 5. Fallback nếu không đủ 16 sản phẩm
            if len(final_products) < 16:
                exclude_ids = [p['id'] for p in final_products]
                # Lấy những sản phẩm user đã tương tác để loại trừ
                user_interacted = conn.execute(text("SELECT DISTINCT product_id FROM user_interactions WHERE user_id = :user_id"), {"user_id": user_id}).fetchall()
                exclude_ids.extend([str(row[0]) for row in user_interacted])
                
                needed = 16 - len(final_products)
                trending = get_trending_products(conn, limit=needed, exclude_ids=exclude_ids)
                final_products.extend(trending)

            return {"recommendations": final_products[:16]}

    except Exception as e:
        print(f"Error fetching recommendations: {e}")
        return {"recommendations": []}
