import os
import chromadb
import google.generativeai as genai
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Cấu hình Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
    genai.configure(api_key=GEMINI_API_KEY)

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    engine = create_engine(DATABASE_URL)

# Khởi tạo ChromaDB
# Lưu data ở thư mục vector_store_data
chroma_client = chromadb.PersistentClient(path="./vector_store_data")
collection_name = "products"

# Lấy hoặc tạo collection
try:
    collection = chroma_client.get_collection(name=collection_name)
except Exception:
    collection = chroma_client.create_collection(name=collection_name)

def get_embedding(text: str):
    """Sử dụng Gemini API để tạo vector (embedding) từ text"""
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        # Mock embedding cho lúc dev nếu chưa có key (10-dim vector)
        return [0.0] * 768

    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=text,
        task_type="retrieval_document",
        title="Embedding of single string"
    )
    return result['embedding']

def sync_products_to_vector_store():
    """Đọc dữ liệu từ Postgres và nạp vào ChromaDB"""
    if not DATABASE_URL:
        print("Không tìm thấy DATABASE_URL")
        return

    print("Bắt đầu đồng bộ hóa dữ liệu từ Postgres sang Chroma...")
    with engine.connect() as conn:
        # Lấy sản phẩm và tên shop
        query = text("""
            SELECT p.id, p.name, p.description, p.price, s.name as shop_name, p.shop_id
            FROM products p
            LEFT JOIN shops s ON p.shop_id = s.id
        """)
        result = conn.execute(query).fetchall()

        if not result:
            print("Không có sản phẩm nào trong DB.")
            return

        ids = []
        documents = []
        metadatas = []
        embeddings = []

        for row in result:
            product_id = str(row[0])
            name = row[1] or ""
            desc = row[2] or ""
            price = row[3] or 0
            shop_name = row[4] or "Unknown Shop"
            shop_id = str(row[5]) if row[5] else ""

            # Chuỗi text để embedding (gộp thông tin quan trọng)
            doc_text = f"Sản phẩm: {name}. Cửa hàng: {shop_name}. Giá: {price}. Mô tả: {desc}"
            
            ids.append(product_id)
            documents.append(doc_text)
            metadatas.append({
                "name": name,
                "price": float(price),
                "shop_name": shop_name,
                "shop_id": shop_id
            })
            
            # Tạo embedding
            emb = get_embedding(doc_text)
            embeddings.append(emb)
            import time
            time.sleep(0.5)

        # Upsert vào ChromaDB
        collection.upsert(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        print(f"Đã đồng bộ {len(ids)} sản phẩm vào ChromaDB.")

def search_products(query: str, top_k: int = 5, shop_id: str = None):
    """Tìm kiếm sản phẩm theo ngữ nghĩa (Semantic Search)"""
    query_embedding = get_embedding(query)
    
    where_clause = {"shop_id": shop_id} if shop_id else None

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=where_clause
    )
    
    return results

def init_vector_store():
    """Chạy đồng bộ lúc startup"""
    sync_products_to_vector_store()

if __name__ == "__main__":
    sync_products_to_vector_store()
