from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction

from authentication.permissions import IsAdmin
from partners.models import PartnerTransaction
from .models import Event
from .serializers import EventSerializer, EventStatusSerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset           = Event.objects.select_related('assigned_branch').all()
    serializer_class   = EventSerializer
    permission_classes = [IsAdmin]

    @transaction.atomic
    def perform_create(self, serializer):
        event = serializer.save()
        self._handle_commission(event)

    @transaction.atomic
    def perform_update(self, serializer):
        old_branch = self.get_object().assigned_branch
        event      = serializer.save()
        if event.assigned_branch != old_branch:
            PartnerTransaction.objects.filter(event=event).delete()
            self._handle_commission(event)

    def _handle_commission(self, event):
        branch = event.assigned_branch
        if branch and branch.is_partner and branch.commission_rate > 0:
            commission = event.total_amount * (branch.commission_rate / 100)
            PartnerTransaction.objects.update_or_create(
                event=event,
                defaults={'branch': branch, 'commission_amount': commission, 'status': 'pending'},
            )

    @action(detail=True, methods=['put'], url_path='status')
    def update_status(self, request, pk=None):
        event      = self.get_object()
        serializer = EventStatusSerializer(event, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EventSerializer(event).data)
