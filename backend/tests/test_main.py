import os
import pytest
from fastapi.testclient import TestClient
from ..main import app

client = TestClient(app)


@pytest.fixture(scope="module")
def token():
    # Generate a valid token for testing
    from jose import jwt

    SECRET_KEY = os.getenv("NEXTAUTH_SECRET")
    ALGORITHM = "HS256"
    payload = {"sub": "testuser"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def test_ask_question(token):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "question": "What is the PDM 2021?",
        "properties": {"property1": [{"abstract": "PDM 2021", "value": "test"}]},
    }
    response = client.post("/ask_question/", json=data, headers=headers)
    assert response.status_code == 200
    assert "answer" in response.json()


def test_get_layers(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/layers/Porto", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_layer_info(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/layer_info/some_layer", headers=headers)
    if response.status_code == 200:
        assert "keywords" in response.json()
        assert "title" in response.json()
        assert "name" in response.json()
        assert "boundingBoxWGS84" in response.json()
    else:
        assert response.status_code == 404


def test_get_properties(token):
    headers = {"Authorization": f"Bearer {token}"}
    data = {"lat": 41.1579, "lon": -8.6291, "margin": 0.001, "municipality": "Porto"}
    response = client.post("/get_properties/", json=data, headers=headers)
    if response.status_code == 200:
        assert isinstance(response.json(), dict)
    else:
        assert response.status_code == 404
