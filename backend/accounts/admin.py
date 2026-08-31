from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'wins', 'losses', 'draws', 'is_staff', 'date_joined']
    list_filter = ['is_staff', 'is_superuser', 'is_active']
    search_fields = ['username', 'email']
    ordering = ['-date_joined']

    # Extend the base UserAdmin fieldsets to include game stats
    fieldsets = UserAdmin.fieldsets + (
        ('Game Stats', {'fields': ('wins', 'losses', 'draws')}),
    )

    # Also show stats when adding via admin
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Game Stats (optional)', {'fields': ('wins', 'losses', 'draws')}),
    )
