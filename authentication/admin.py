from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role

admin.site.register(Role)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display   = ['username', 'email', 'role', 'is_active']
    list_filter    = ['role', 'is_active']
    fieldsets      = None
    add_fieldsets  = None
    ordering       = ['username']
    search_fields  = ['username', 'email']
    filter_horizontal = []
