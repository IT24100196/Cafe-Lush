from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, StudentRegisterSerializer, LoginSerializer, UserSerializer
from .permissions import IsAdmin
from django.contrib.auth import get_user_model
import requests as http_requests

GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
User = get_user_model()


class RegisterView(APIView):
    """Admin-only: create cashier or admin accounts."""
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class StudentRegisterView(APIView):
    """Public: anyone can self-register as a student."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StudentRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user    = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user    = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            RefreshToken(request.data['refresh']).blacklist()
        except Exception:
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        email = request.data.get('email')
        if email is not None:
            user.email = email
            user.save(update_fields=['email'])
        student = getattr(user, 'student_profile', None)
        if student:
            if 'full_name' in request.data:
                student.full_name = request.data['full_name']
            if 'contact' in request.data:
                student.contact = request.data['contact']
            student.save()
        return Response(UserSerializer(user).data)


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        access_token = request.data.get('access_token')
        if not access_token:
            return Response({'error': 'No access_token provided.'}, status=status.HTTP_400_BAD_REQUEST)
        resp = http_requests.get(
            GOOGLE_USERINFO_URL,
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=10,
        )
        if resp.status_code != 200:
            return Response({'error': 'Invalid Google token.'}, status=status.HTTP_400_BAD_REQUEST)
        info = resp.json()

        email    = info.get('email')
        if not email:
            return Response({'error': 'Google account has no email.'}, status=status.HTTP_400_BAD_REQUEST)
        username = email.split('@')[0]

        user = User.objects.filter(email=email).first()
        if not user:
            from authentication.models import Role
            from meals.models import Student
            import uuid
            student_role, _ = Role.objects.get_or_create(name=Role.STUDENT)
            base, i = username, 1
            while User.objects.filter(username=username).exists():
                username = f'{base}{i}'; i += 1
            user = User(
                username=username,
                email=email,
                role=student_role,
                is_active=True,
            )
            user.set_unusable_password()
            user.save()
            Student.objects.create(
                user=user,
                student_code=f'G-{uuid.uuid4().hex[:8].upper()}',
                full_name=info.get('name', username),
                contact='',
            )
        else:
            # Ensure existing Google users also have a student profile
            from meals.models import Student
            import uuid
            if not Student.objects.filter(user=user).exists():
                Student.objects.create(
                    user=user,
                    student_code=f'G-{uuid.uuid4().hex[:8].upper()}',
                    full_name=info.get('name', user.username),
                    contact='',
                )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        })
