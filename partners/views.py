from rest_framework import viewsets
from authentication.permissions import IsAdmin
from .models import Branch, PartnerTransaction
from .serializers import BranchSerializer, PartnerTransactionSerializer


class BranchViewSet(viewsets.ModelViewSet):
    queryset           = Branch.objects.all()
    serializer_class   = BranchSerializer
    permission_classes = [IsAdmin]


class PartnerTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset           = PartnerTransaction.objects.select_related('branch', 'event').all()
    serializer_class   = PartnerTransactionSerializer
    permission_classes = [IsAdmin]
