import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import chat, recommendation, search
from services.vector_store import init_vector_store

app = FastAPI(
    title="ProjectIII AI Service",
    description="AI Service with RAG Chatbot and Recommendations",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    print("Initializing Vector Store...")
    # Khởi tạo vector store nếu chưa có (có thể đọc từ DB lúc khởi động)
    # init_vector_store()
    print("Vector Store initialized.")

app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(recommendation.router, prefix="/recommendations", tags=["recommendations"])
app.include_router(search.router, prefix="/search", tags=["search"])

@app.post("/sync", tags=["sync"])
def sync_data():
    from services.vector_store import sync_products_to_vector_store
    try:
        sync_products_to_vector_store()
        return {"message": "Sync successful"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def read_root():
    return {"message": "Welcome to ProjectIII AI Service API"}
