import importlib
import sys
import types
import unittest
from unittest.mock import patch


class FakeCollection:
    def __init__(self):
        self.last_query = None

    def query(self, **kwargs):
        self.last_query = kwargs
        return {"ids": [["p1"]], "documents": [["Sản phẩm test"]]}


class FakeChromaClient:
    def __init__(self, path):
        self.path = path
        self.collection = FakeCollection()

    def get_collection(self, name):
        return self.collection


class FakeSentenceTransformer:
    loaded_model_name = None

    def __init__(self, model_name):
        FakeSentenceTransformer.loaded_model_name = model_name

    def encode(self, text, normalize_embeddings=True):
        return [0.1, 0.2, 0.3]


class VectorStoreLocalEmbeddingTest(unittest.TestCase):
    def setUp(self):
        self.module_names = [
            "chromadb",
            "dotenv",
            "sqlalchemy",
            "sentence_transformers",
            "ai-service.services.vector_store",
            "services.vector_store",
            "vector_store",
        ]
        self.original_modules = {
            name: sys.modules[name]
            for name in self.module_names
            if name in sys.modules
        }
        for name in self.module_names:
            sys.modules.pop(name, None)

        chromadb = types.ModuleType("chromadb")
        chromadb.PersistentClient = FakeChromaClient
        sys.modules["chromadb"] = chromadb

        dotenv = types.ModuleType("dotenv")
        dotenv.load_dotenv = lambda: None
        sys.modules["dotenv"] = dotenv

        sqlalchemy = types.ModuleType("sqlalchemy")
        sqlalchemy.create_engine = lambda url: object()
        sqlalchemy.text = lambda query: query
        sys.modules["sqlalchemy"] = sqlalchemy

        sentence_transformers = types.ModuleType("sentence_transformers")
        sentence_transformers.SentenceTransformer = FakeSentenceTransformer
        sys.modules["sentence_transformers"] = sentence_transformers

    def tearDown(self):
        for name in self.module_names:
            sys.modules.pop(name, None)
        sys.modules.update(self.original_modules)

    def test_get_embedding_uses_local_sentence_transformer(self):
        with patch.dict("os.environ", {}, clear=True):
            vector_store = importlib.import_module("ai-service.services.vector_store")

        embedding = vector_store.get_embedding("tai nghe bluetooth")

        self.assertEqual(embedding, [0.1, 0.2, 0.3])
        self.assertEqual(
            FakeSentenceTransformer.loaded_model_name,
            vector_store.EMBEDDING_MODEL_NAME,
        )
        self.assertFalse(hasattr(vector_store, "GEMINI_API_KEY"))

    def test_search_products_uses_local_embedding_for_chroma_query(self):
        with patch.dict("os.environ", {}, clear=True):
            vector_store = importlib.import_module("ai-service.services.vector_store")

        result = vector_store.search_products("áo khoác", top_k=3, shop_id="shop-1")

        self.assertEqual(result["ids"], [["p1"]])
        self.assertEqual(
            vector_store.collection.last_query,
            {
                "query_embeddings": [[0.1, 0.2, 0.3]],
                "n_results": 3,
                "where": {"shop_id": "shop-1"},
            },
        )


if __name__ == "__main__":
    unittest.main()
