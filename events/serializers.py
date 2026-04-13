from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from hotel_pos_backend.validators import validate_sri_lankan_mobile
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='assigned_branch.name', read_only=True)

    class Meta:
        model  = Event
        fields = ['id', 'name', 'customer_name', 'customer_contact', 'event_date',
                  'venue', 'assigned_branch', 'branch_name', 'total_amount', 'status', 'created_at']
        read_only_fields = ['created_at']

    def validate_customer_contact(self, value):
        try:
            return validate_sri_lankan_mobile(value, required=False, label='Customer contact')
        except DjangoValidationError as exc:
            message = exc.messages[0] if getattr(exc, 'messages', None) else str(exc)
            raise serializers.ValidationError(message)


class EventStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Event
        fields = ['status']
