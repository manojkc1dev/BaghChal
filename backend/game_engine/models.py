from django.db import models
from django.conf import settings
from .logic import create_initial_board, TOTAL_SHEEP_RESERVE

class Game(models.Model):
    MODE_CHOICES = [
        ('LOCAL', 'Local Pass & Play'),
        ('PVAI', 'Player vs AI Bot'),
        ('PVP', 'Online Multiplayer'),
    ]

    ROLE_CHOICES = [
        ('SHEEP', 'Sheep / Goat'),
        ('LION', 'Lion / Tiger'),
    ]

    DIFFICULTY_CHOICES = [
        ('EASY', 'Easy'),
        ('MEDIUM', 'Medium'),
        ('HARD', 'Hard'),
    ]

    STATUS_CHOICES = [
        ('IN_PROGRESS', 'In Progress'),
        ('LIONS_WON', 'Lions Won'),
        ('SHEEP_WON', 'Sheep Won'),
    ]

    room_name = models.CharField(max_length=64, unique=True, db_index=True)
    mode = models.CharField(max_length=10, choices=MODE_CHOICES, default='PVP')
    ai_role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='LION')
    ai_difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='MEDIUM')

    player_sheep = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='games_as_sheep'
    )
    player_lion = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='games_as_lion'
    )

    board = models.JSONField(default=create_initial_board)
    game_phase = models.CharField(max_length=15, default='PLACEMENT')
    current_turn = models.CharField(max_length=10, choices=ROLE_CHOICES, default='SHEEP')
    unplaced_sheep = models.IntegerField(default=TOTAL_SHEEP_RESERVE)
    captured_sheep = models.IntegerField(default=0)
    game_status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='IN_PROGRESS')

    move_number = models.IntegerField(default=0)
    state_version = models.IntegerField(default=1)
    move_history = models.JSONField(default=list)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Game {self.room_name} ({self.game_status}) - Turn: {self.current_turn}"
