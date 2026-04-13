from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MealTypeViewSet, MealPackageViewSet, MealOrderView, MealOrderBatchView, MealOrderStatusView,
    StudentOrderCancelView,
    NotificationView, PosItemsForPackageView, StudentItemsView,
    OnlineOrdersView, OnlineOrderDetailView, GenerateBillView, WalkInBillView,
    WalkInBillListView, BillDetailView, BillPrintView, BillPdfView, SendBillEmailView,
    SuggestionView, ClearOrderHistoryView, DeliveryFeeEstimateView,
)

router = DefaultRouter()
router.register('types',    MealTypeViewSet,    basename='mealtype')
router.register('packages', MealPackageViewSet, basename='mealpackage')

urlpatterns = [
    path('', include(router.urls)),
    path('orders/',                       MealOrderView.as_view()),
    path('orders/clear/',                 ClearOrderHistoryView.as_view()),
    path('orders/batch/',                 MealOrderBatchView.as_view()),
    path('orders/delivery-fee/',          DeliveryFeeEstimateView.as_view()),
    path('orders/<int:pk>/cancel/',       StudentOrderCancelView.as_view()),
    path('orders/<int:pk>/status/',       MealOrderStatusView.as_view()),
    path('notifications/',                NotificationView.as_view()),
    path('package-items/',                PosItemsForPackageView.as_view()),
    path('student-items/',                StudentItemsView.as_view()),
    path('suggestions/',                  SuggestionView.as_view()),
    # Online orders — list + detail
    path('online-orders/',                OnlineOrdersView.as_view()),
    path('online-orders/<int:pk>/',       OnlineOrderDetailView.as_view()),
    # Bill generation
    path('bills/online/<int:order_id>/',  GenerateBillView.as_view()),
    path('bills/walk-in/',                WalkInBillView.as_view()),
    path('bills/walk-in/list/',           WalkInBillListView.as_view()),
    # Bill detail + print
    path('bills/<int:pk>/',               BillDetailView.as_view()),
    path('bills/<int:pk>/print/',         BillPrintView.as_view()),
    path('bills/<int:pk>/pdf/',           BillPdfView.as_view()),
    path('bills/<int:pk>/send-email/',    SendBillEmailView.as_view()),
]
