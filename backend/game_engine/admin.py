from django.contrib import admin
from .models import Game


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = [
        'room_name', 'mode', 'game_status', 'current_turn',
        'captured_sheep', 'player_sheep', 'player_lion', 'updated_at',
    ]
    list_filter = ['mode', 'game_status', 'game_phase', 'ai_difficulty']
    search_fields = ['room_name', 'player_sheep__username', 'player_lion__username']
    ordering = ['-updated_at']
    readonly_fields = ['created_at', 'updated_at', 'state_version', 'move_number', 'move_history']

    fieldsets = (
        ('Room & Mode', {
            'fields': ('room_name', 'mode', 'ai_role', 'ai_difficulty'),
        }),
        ('Players', {
            'fields': ('player_sheep', 'player_lion'),
        }),
        ('Game State', {
            'fields': (
                'board', 'game_phase', 'current_turn',
                'unplaced_sheep', 'captured_sheep', 'game_status',
            ),
        }),
        ('Metadata', {
            'fields': ('move_number', 'state_version', 'move_history', 'created_at', 'updated_at'),
            'classes': ['collapse'],
        }),
    )
