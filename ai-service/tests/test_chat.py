import importlib
import sys
import types
import unittest
from unittest.mock import patch


class ChatWithoutVectorStoreTest(unittest.TestCase):
    def setUp(self):
        self.module_names = [
            "dotenv",
            "fastapi",
            "pydantic",
            "requests",
            "ai-service.routers.chat",
            "routers.chat",
        ]
        self.original_modules = {
            name: sys.modules[name]
            for name in self.module_names
            if name in sys.modules
        }
        for name in self.module_names:
            sys.modules.pop(name, None)

        dotenv = types.ModuleType("dotenv")
        dotenv.load_dotenv = lambda: None
        sys.modules["dotenv"] = dotenv

        fastapi = types.ModuleType("fastapi")

        class FakeAPIRouter:
            def post(self, *args, **kwargs):
                def decorator(fn):
                    return fn

                return decorator

        class FakeHTTPException(Exception):
            def __init__(self, status_code=None, detail=None):
                super().__init__(detail)
                self.status_code = status_code
                self.detail = detail

        fastapi.APIRouter = FakeAPIRouter
        fastapi.HTTPException = FakeHTTPException
        sys.modules["fastapi"] = fastapi

        pydantic = types.ModuleType("pydantic")

        class FakeBaseModel:
            pass

        pydantic.BaseModel = FakeBaseModel
        sys.modules["pydantic"] = pydantic

        requests = types.ModuleType("requests")
        requests.post = lambda *args, **kwargs: None
        sys.modules["requests"] = requests

    def tearDown(self):
        for name in self.module_names:
            sys.modules.pop(name, None)
        sys.modules.update(self.original_modules)

    def test_chat_router_imports_without_vector_store_dependency(self):
        sys.modules.pop("services.vector_store", None)

        with patch.dict("os.environ", {"DEEPSEEK_API_KEY": ""}, clear=True):
            chat = importlib.import_module("ai-service.routers.chat")

        self.assertTrue(hasattr(chat, "predict_chat"))

    def test_format_products_context_includes_product_facts(self):
        with patch.dict("os.environ", {"DEEPSEEK_API_KEY": ""}, clear=True):
            chat = importlib.import_module("ai-service.routers.chat")

        context = chat.format_products_context([
            {
                "name": "iPhone 17 Pro Max",
                "price": 36890000,
                "stock_quantity": 15,
                "slug": "iphone-17-pro-max",
                "description": "Điện thoại Apple chính hãng",
            }
        ])

        self.assertIn("Tên: iPhone 17 Pro Max", context)
        self.assertIn("Giá: 36890000", context)
        self.assertIn("Tồn kho: 15", context)


if __name__ == "__main__":
    unittest.main()
