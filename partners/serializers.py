from rest_framework import serializers
from .models import Branch, PartnerTransaction


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Branch
        fields = '__all__'


class PartnerTransactionSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    event_name  = serializers.CharField(source='event.name',  read_only=True)

    class Meta:
        model  = PartnerTransaction
        fields = ['id', 'branch', 'branch_name', 'event', 'event_name',
                  'commission_amount', 'status', 'created_at']
