from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BranchViewSet, PartnerTransactionViewSet

router = DefaultRouter()
router.register('branches',     BranchViewSet,             basename='branch')
router.register('transactions', PartnerTransactionViewSet, basename='partner-transaction')

urlpatterns = [path('', include(router.urls))]
