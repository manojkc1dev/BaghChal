import pytest
from django.test import Client

@pytest.mark.django_db
def test_health_check_endpoint():
    client = Client()
    response = client.get('/health/')
    assert response.status_code == 200
    data = response.json()
    assert data.get('status') == 'ok'
    assert data.get('app') == 'BheedChaal'
    assert 'environment' in data
    # Ensure secrets/DB paths are not exposed
    assert 'SECRET_KEY' not in data
    assert 'DATABASES' not in data
