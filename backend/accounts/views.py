from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class AuthStatusView(APIView):
    def get(self, request):
        return Response({
            "status": "online",
            "message": "BheedChaal Authentication API operational"
        }, status=status.HTTP_200_OK)
