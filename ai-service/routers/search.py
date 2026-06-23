from fastapi import APIRouter, Query
from services.vector_store import search_products

router = APIRouter()

@router.get("/")
def semantic_search(q: str = Query(..., description="Query text"), top_k: int = 20):
    try:
        results = search_products(q, top_k=top_k)
        if not results or not results.get('ids') or len(results['ids']) == 0:
            return {"ids": []}
            
        return {"ids": results['ids'][0]}
    except Exception as e:
        print(f"Semantic search error: {e}")
        return {"error": str(e), "ids": []}
