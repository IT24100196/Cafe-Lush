from django.urls import path
from .views import MonthlyReportView, AdminOverviewView, IncomeOutcomeListView, IncomeOutcomeDeleteView

urlpatterns = [
    path('monthly/',          MonthlyReportView.as_view()),
    path('overview/',         AdminOverviewView.as_view()),
    path('income-outcome/',   IncomeOutcomeListView.as_view()),
    path('income-outcome/<int:pk>/', IncomeOutcomeDeleteView.as_view()),
]
