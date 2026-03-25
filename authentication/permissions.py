from rest_framework.permissions import BasePermission
from .models import Role


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name == Role.ADMIN


class IsCashier(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name == Role.CASHIER


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name == Role.STUDENT


class IsAdminOrCashier(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name in (Role.ADMIN, Role.CASHIER)


class IsAnyRole(BasePermission):
    """Any authenticated user regardless of role."""
    def has_permission(self, request, view):
        return request.user.is_authenticated


class IsAdminOrStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.name in (Role.ADMIN, Role.STUDENT)
