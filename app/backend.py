
from fastapi import FastAPI

app = FastAPI(
    title="Secure API Gateway - Backend Service",
    description="Internal backend service for the API Gateway",
    version="1.0.0"
)


@app.get("/")
def backend_home():
    return {
        "service": "Backend Service",
        "status": "Running",
        "port": 8001
    }


@app.get("/health")
def backend_health():
    return {
        "status": "healthy",
        "service": "Backend Service"
    }


@app.get("/products")
def get_products():
    return {
        "message": "Products retrieved successfully",
        "source": "Backend Service",
        "products": [
            {
                "id": 1,
                "name": "Laptop",
                "price": 55000
            },
            {
                "id": 2,
                "name": "Smartphone",
                "price": 25000
            },
            {
                "id": 3,
                "name": "Headphones",
                "price": 3000
            }
        ]
    }


@app.get("/profile")
def get_profile():
    return {
        "message": "Profile retrieved successfully",
        "source": "Backend Service",
        "profile": {
            "id": 101,
            "name": "Demo User",
            "role": "USER"
        }
    }
