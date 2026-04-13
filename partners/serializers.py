from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from hotel_pos_backend.validators import validate_sri_lankan_mobile
from .models import Branch, PartnerTransaction


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Branch
        fields = '__all__'

    def validate_contact(self, value):
        try:
            return validate_sri_lankan_mobile(value, required=False, label='Contact number')
        except DjangoValidationError as exc:
            message = exc.messages[0] if getattr(exc, 'messages', None) else str(exc)
            raise serializers.ValidationError(message)


class PartnerTransactionSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    event_name  = serializers.CharField(source='event.name',  read_only=True)

    class Meta:
        model  = PartnerTransaction
        fields = ['id', 'branch', 'branch_name', 'event', 'event_name',
                  'commission_amount', 'status', 'created_at']
