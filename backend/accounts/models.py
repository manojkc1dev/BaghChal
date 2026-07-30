from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    wins = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)
    draws = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.username
