from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class AccountsAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('auth_register')
        self.token_url = reverse('token_obtain_pair')
        self.profile_url = reverse('user_profile')
        self.status_url = reverse('auth_status')

        self.user_data = {
            'username': 'testplayer',
            'email': 'player@example.com',
            'password': 'StrongPassword123!'
        }

    def test_auth_status_endpoint(self):
        response = self.client.get(self.status_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'online')

    def test_user_registration(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().username, 'testplayer')

    def test_jwt_token_and_profile_access(self):
        # Register user
        User.objects.create_user(**self.user_data)

        # Obtain JWT token
        token_res = self.client.post(self.token_url, {
            'username': 'testplayer',
            'password': 'StrongPassword123!'
        }, format='json')
        self.assertEqual(token_res.status_code, status.HTTP_200_OK)
        access_token = token_res.data['access']

        # Access profile without token -> 401 Unauthorized
        unauth_res = self.client.get(self.profile_url)
        self.assertEqual(unauth_res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Access profile with Bearer token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        auth_res = self.client.get(self.profile_url)
        self.assertEqual(auth_res.status_code, status.HTTP_200_OK)
        self.assertEqual(auth_res.data['username'], 'testplayer')
