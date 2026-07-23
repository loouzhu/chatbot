import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main


def test_health_check():
    response = main.app.test_client().get('/')
    assert response.status_code == 200


def test_chat_endpoint_requires_message():
    response = main.app.test_client().post('/chat', json={})
    assert response.status_code == 422
