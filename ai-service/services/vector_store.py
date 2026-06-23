import os
import chromadb
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

try:
    from services.database import normalize_database_url
except ModuleNotFoundError:
    from .database import normalize_database_url

load_dotenv()

EMBEDDING_MODEL_NAME = os.getenv(
    "EMBEDDING_MODEL_NAME",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
)

DATABASE_URL = normalize_database_url(os.getenv("DATABASE_URL"))
if DATABASE_URL:
    engine = create_engine(DATABASE_URL)

chroma_client = chromadb.PersistentClient(path="./vector_store_data")
collection_name = "products_local_embeddings"

try:
    collection = chroma_client.get_collection(name=collection_name)
except Exception:
    collection = chroma_client.create_collection(name=collection_name)

_embedding_model = None


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _embedding_model


def get_embedding(text: str):
    try:
        embedding = get_embedding_model().encode(
            text or "",
            normalize_embeddings=True,
        )
        if hasattr(embedding, "tolist"):
            return embedding.tolist()
        return list(embedding)
    except Exception as e:
        print(f"Error getting local embedding: {e}")
        raise

def sync_products_to_vector_store():
    if not DATABASE_URL:
        print("Không tìm thấy DATABASE_URL")
        return

    print("Bắt đầu đồng bộ hóa dữ liệu từ Postgres sang Chroma...")
    with engine.connect() as conn:
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

            doc_text = f"Sản phẩm: {name}. Cửa hàng: {shop_name}. Giá: {price}. Mô tả: {desc}"
            
            ids.append(product_id)
            documents.append(doc_text)
            metadatas.append({
                "name": name,
                "price": float(price),
                "shop_name": shop_name,
                "shop_id": shop_id
            })
            
            emb = get_embedding(doc_text)
            embeddings.append(emb)

        collection.upsert(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        print(f"Đã đồng bộ {len(ids)} sản phẩm vào ChromaDB.")

def search_products(query: str, top_k: int = 5, shop_id: str = None):
    query_embedding = get_embedding(query)
    where_clause = {"shop_id": shop_id} if shop_id else None
    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_clause
        )
        return results
    except Exception as e:
        print(f"Search error: {e}")
        return {"documents": [[]], "ids": [[]]}

def init_vector_store():
    sync_products_to_vector_store()

if __name__ == "__main__":
    sync_products_to_vector_store()
