import os
from django.http import JsonResponse

def health_check(request):
    """
    Production-safe minimal health check endpoint.
    Returns HTTP 200 without exposing sensitive environment variables or secrets.
    """
    return JsonResponse({
        "status": "ok",
        "app": "BheedChaal",
        "environment": os.environ.get("ENVIRONMENT", "production" if not os.environ.get("DEBUG", "True").lower() in ["true", "1"] else "development"),
    }, status=200)
