from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ItemViewSet, CreatePosOrderView, DailySummaryView, FeaturedItemView, FeaturedItemDeleteView, WeeklyMealPlanView, WeeklyMealPlanDetailView

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('items',      ItemViewSet,     basename='item')

urlpatterns = [
    path('', include(router.urls)),
    path('orders/',          CreatePosOrderView.as_view()),
    path('orders/summary/',  DailySummaryView.as_view()),
    path('weekly-meal-plan/',        WeeklyMealPlanView.as_view()),
    path('weekly-meal-plan/<int:pk>/', WeeklyMealPlanDetailView.as_view()),
    path('featured-items/',              FeaturedItemView.as_view()),
    path('featured-items/<int:position>/', FeaturedItemDeleteView.as_view()),
]
