from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, StudentRegisterView, LoginView, LogoutView, ProfileView, GoogleLoginView, StudentListView

urlpatterns = [
    path('register/',         RegisterView.as_view()),
    path('register/student/', StudentRegisterView.as_view()),
    path('login/',            LoginView.as_view()),
    path('logout/',           LogoutView.as_view()),
    path('refresh/',          TokenRefreshView.as_view()),
    path('profile/',          ProfileView.as_view()),
    path('google/',           GoogleLoginView.as_view()),
    path('users/',            StudentListView.as_view()),
]
