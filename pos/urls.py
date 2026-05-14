from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, CatalogCategoryViewSet, MenuGroupViewSet, MenuItemViewSet, ItemVariantViewSet,
    ItemViewSet, CreatePosOrderView, DailySummaryView, FeaturedItemView, FeaturedItemDeleteView,
    WeeklyMealPlanView, WeeklyMealPlanDetailView,
)

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('items',      ItemViewSet,     basename='item')
router.register('catalog-categories', CatalogCategoryViewSet, basename='catalog-category')
router.register('menu-groups', MenuGroupViewSet, basename='menu-group')
router.register('menu-items', MenuItemViewSet, basename='menu-item')
router.register('item-variants', ItemVariantViewSet, basename='item-variant')

urlpatterns = [
    path('', include(router.urls)),
    path('orders/',          CreatePosOrderView.as_view()),
    path('orders/summary/',  DailySummaryView.as_view()),
    path('weekly-meal-plan/',        WeeklyMealPlanView.as_view()),
    path('weekly-meal-plan/<int:pk>/', WeeklyMealPlanDetailView.as_view()),
    path('featured-items/',              FeaturedItemView.as_view()),
    path('featured-items/<int:position>/', FeaturedItemDeleteView.as_view()),
]
