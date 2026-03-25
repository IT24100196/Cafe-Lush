from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='assigned_branch.name', read_only=True)

    class Meta:
        model  = Event
        fields = ['id', 'name', 'customer_name', 'customer_contact', 'event_date',
                  'venue', 'assigned_branch', 'branch_name', 'total_amount', 'status', 'created_at']
        read_only_fields = ['created_at']


class EventStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Event
        fields = ['status']
