"""
Custom permission classes for role-based access control.
"""
from rest_framework.permissions import BasePermission


class IsCustomer(BasePermission):
    """Allow access only to users with CUSTOMER role."""

    message = 'Access restricted to customers only.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'CUSTOMER'
        )


class IsShopOwner(BasePermission):
    """Allow access only to users with SHOP_OWNER role."""

    message = 'Access restricted to shop owners only.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'SHOP_OWNER'
        )


class IsAdmin(BasePermission):
    """Allow access only to users with ADMIN role."""

    message = 'Access restricted to administrators only.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.role == 'ADMIN' or request.user.is_staff)
        )


class IsShopOwnerOrAdmin(BasePermission):
    """Allow access to shop owners and admins."""

    message = 'Access restricted to shop owners and administrators.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('SHOP_OWNER', 'ADMIN')
        )


class IsOwnerOrAdmin(BasePermission):
    """Allow access to the object owner or admin."""

    message = 'You do not have permission to perform this action.'

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN' or request.user.is_staff:
            return True
        # Check if the object has an 'owner' or 'user' attribute
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return obj == request.user
