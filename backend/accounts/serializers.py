from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    win_rate = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'wins', 'losses', 'draws', 'win_rate')
        read_only_fields = ('id', 'wins', 'losses', 'draws', 'win_rate')

    def get_win_rate(self, obj):
        total = obj.wins + obj.losses + obj.draws
        if total == 0:
            return 0.0
        return round((obj.wins / total) * 100, 2)
