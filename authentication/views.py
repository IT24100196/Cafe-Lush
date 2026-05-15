import logging
import secrets
from datetime import timedelta

import requests as http_requests
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .serializers import (
    RegisterSerializer,
    StudentRegisterSerializer,
    StudentRegistrationOTPRequestSerializer,
    StudentRegistrationOTPVerifySerializer,
    LoginSerializer,
    UserSerializer,
    ProfileUpdateSerializer,
    CashierAdminCreateSerializer,
    CashierAdminUpdateSerializer,
    ForgotPasswordSerializer,
    VerifyResetOTPSerializer,
    ResetPasswordSerializer,
)
from .models import PasswordResetOTP, PendingStudentRegistration, Role
from .permissions import IsAdmin
from .jwt import (
    CredentialAwareTokenRefreshSerializer,
    blacklist_outstanding_tokens,
    build_token_pair,
)
from .email import send_transactional_email

GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
logger = logging.getLogger(__name__)
User = get_user_model()
RESET_OTP_EXPIRY_MINUTES = 10
RESET_OTP_MAX_ATTEMPTS = 5
RESET_GENERIC_MESSAGE = 'If the account exists, a reset code has been sent.'
REGISTRATION_OTP_EXPIRY_MINUTES = 10
REGISTRATION_OTP_MAX_ATTEMPTS = 5


class CredentialAwareTokenRefreshView(TokenRefreshView):
    serializer_class = CredentialAwareTokenRefreshSerializer


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
        return Response(
            {'detail': 'Email OTP verification is required. Please request a registration OTP first.'},
            status=status.HTTP_400_BAD_REQUEST,
        )


def _latest_open_pending_registration(email):
    return (
        PendingStudentRegistration.objects
        .filter(email__iexact=email, used_at__isnull=True)
        .order_by('-created_at')
        .first()
    )


class StudentRegistrationOTPRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StudentRegistrationOTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        otp = f'{secrets.randbelow(1000000):06d}'
        now = timezone.now()
        PendingStudentRegistration.objects.filter(
            email__iexact=payload['email'],
            used_at__isnull=True,
        ).update(used_at=now)
        PendingStudentRegistration.objects.filter(
            username__iexact=payload['username'],
            used_at__isnull=True,
        ).update(used_at=now)

        pending = PendingStudentRegistration.objects.create(
            username=payload['username'],
            email=payload['email'],
            password_hash=make_password(payload['password']),
            full_name=payload['full_name'],
            contact=payload.get('contact', ''),
            otp_hash=make_password(otp),
            expires_at=now + timedelta(minutes=REGISTRATION_OTP_EXPIRY_MINUTES),
        )

        try:
            send_transactional_email(
                subject='Cafe Lush registration OTP',
                message=(
                    f'Your Cafe Lush registration OTP is {otp}.\n\n'
                    f'This code expires in {REGISTRATION_OTP_EXPIRY_MINUTES} minutes. '
                    'If you did not request this, you can ignore this email.'
                ),
                recipient_list=[payload['email']],
            )
        except Exception:
            pending.delete()
            logger.exception(
                'Failed to send student registration OTP email to %s',
                payload['email'],
            )
            return Response(
                {'detail': 'We could not send the OTP email right now. Please try again shortly.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({'detail': 'OTP sent to your email.'})


class StudentRegistrationOTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StudentRegistrationOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']

        pending = _latest_open_pending_registration(email)
        now = timezone.now()
        if not pending or pending.expires_at <= now:
            return Response({'detail': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)
        if pending.attempts >= REGISTRATION_OTP_MAX_ATTEMPTS:
            return Response({'detail': 'Too many wrong attempts. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        if not check_password(otp, pending.otp_hash):
            pending.attempts += 1
            pending.save(update_fields=['attempts'])
            return Response({'detail': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username__iexact=pending.username).exists():
            return Response({'detail': 'Username already taken. Please register again.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email__iexact=pending.email).exists():
            return Response({'detail': 'This email is already in use. Please register again.'}, status=status.HTTP_400_BAD_REQUEST)

        from meals.models import Student
        import uuid

        with transaction.atomic():
            role, _ = Role.objects.get_or_create(name=Role.STUDENT)
            user = User(
                username=pending.username,
                email=pending.email,
                role=role,
                is_active=True,
            )
            user.password = pending.password_hash
            user.save()
            Student.objects.create(
                user=user,
                student_code=f'STU-{uuid.uuid4().hex[:8].upper()}',
                full_name=pending.full_name,
                contact=pending.contact,
            )
            pending.used_at = now
            pending.save(update_fields=['used_at'])
            PendingStudentRegistration.objects.filter(email__iexact=pending.email, used_at__isnull=True).exclude(pk=pending.pk).update(used_at=now)

        tokens = build_token_pair(user)
        return Response({
            **tokens,
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        tokens = build_token_pair(user)
        return Response({
            **tokens,
            'user': UserSerializer(user).data,
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
        serializer = ProfileUpdateSerializer(
            data=request.data,
            context={'user': user},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        if 'email' in payload:
            user.email = payload['email']
            user.save(update_fields=['email'])

        student = getattr(user, 'student_profile', None)
        if student:
            updates = []
            if 'full_name' in payload:
                student.full_name = payload['full_name']
                updates.append('full_name')
            if 'contact' in payload:
                student.contact = payload['contact']
                updates.append('contact')
            if updates:
                student.save(update_fields=updates)
        return Response(UserSerializer(user).data)


class StudentListView(APIView):
    """Admin-only: list all registered students."""
    permission_classes = [IsAdmin]

    def get(self, request):
        students = User.objects.filter(role__name='student').order_by('-created_at')
        return Response(UserSerializer(students, many=True).data)

    def patch(self, request, pk=None):
        """Deactivate with reason, or re-activate a student."""
        try:
            user = User.objects.get(pk=request.data.get('id'), role__name='student')
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if user.is_active:
            reason = request.data.get('reason', '').strip()
            if not reason:
                return Response({'detail': 'Reason is required to deactivate.'}, status=status.HTTP_400_BAD_REQUEST)
            user.is_active = False
            user.deactivation_reason = reason
        else:
            user.is_active = True
            user.deactivation_reason = ''
        user.save(update_fields=['is_active', 'deactivation_reason'])
        return Response(UserSerializer(user).data)


class CashierListCreateView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        staff = User.objects.filter(role__name__in=['admin', 'cashier']).order_by('role__name', '-created_at')
        return Response(UserSerializer(staff, many=True).data)

    def post(self, request):
        serializer = CashierAdminCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class CashierDetailView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk, role__name__in=['admin', 'cashier'])
        except User.DoesNotExist:
            return Response({'detail': 'Staff account not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CashierAdminUpdateSerializer(
            data=request.data,
            context={'user': user},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        update_fields = set()
        credentials_changed = False

        if 'username' in payload and payload['username'] != user.username:
            user.username = payload['username']
            update_fields.add('username')
            credentials_changed = True

        if 'email' in payload and payload['email'] != user.email:
            user.email = payload['email']
            update_fields.add('email')

        if 'password' in payload and payload['password']:
            user.set_password(payload['password'])
            update_fields.add('password')
            credentials_changed = True

        if 'is_active' in payload and payload['is_active'] != user.is_active:
            if user.role.name == 'admin':
                return Response({'detail': 'Admin accounts cannot be activated or deactivated here.'}, status=status.HTTP_400_BAD_REQUEST)
            user.is_active = payload['is_active']
            update_fields.add('is_active')

        if credentials_changed:
            user.auth_version += 1
            update_fields.add('auth_version')

        if update_fields:
            user.save(update_fields=sorted(update_fields))

        if credentials_changed:
            blacklist_outstanding_tokens(user)

        return Response(UserSerializer(user).data)


def _resolve_password_reset_user(identifier):
    identifier = identifier.strip()
    username_match = User.objects.filter(username__iexact=identifier).first()
    if username_match:
        return username_match, None

    email_matches = list(User.objects.filter(email__iexact=identifier).exclude(email__isnull=True).exclude(email='')[:2])
    if len(email_matches) == 1:
        return email_matches[0], None
    if len(email_matches) > 1:
        return None, 'multiple'
    return None, None


def _latest_open_reset_otp(user):
    return (
        PasswordResetOTP.objects
        .filter(user=user, used_at__isnull=True)
        .order_by('-created_at')
        .first()
    )


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data['identifier']
        user, issue = _resolve_password_reset_user(identifier)

        if issue == 'multiple':
            return Response(
                {'detail': 'This email is linked to more than one account. Please enter your username instead.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user:
            return Response({'detail': RESET_GENERIC_MESSAGE})

        if not user.email:
            return Response(
                {'detail': 'This account has no email address. Please contact the administrator.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp = f'{secrets.randbelow(1000000):06d}'
        now = timezone.now()
        PasswordResetOTP.objects.filter(user=user, used_at__isnull=True).update(used_at=now)
        PasswordResetOTP.objects.create(
            user=user,
            otp_hash=make_password(otp),
            expires_at=now + timedelta(minutes=RESET_OTP_EXPIRY_MINUTES),
        )

        send_transactional_email(
            subject='Cafe Lush password reset OTP',
            message=(
                f'Your Cafe Lush password reset OTP is {otp}.\n\n'
                f'This code expires in {RESET_OTP_EXPIRY_MINUTES} minutes. '
                'If you did not request this, you can ignore this email.'
            ),
            recipient_list=[user.email],
        )

        return Response({'detail': RESET_GENERIC_MESSAGE})


class VerifyResetOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyResetOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data['identifier']
        otp = serializer.validated_data['otp']
        user, issue = _resolve_password_reset_user(identifier)

        if issue == 'multiple':
            return Response({'detail': 'Please enter your username instead of this shared email.'}, status=status.HTTP_400_BAD_REQUEST)
        if not user:
            return Response({'detail': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        record = _latest_open_reset_otp(user)
        now = timezone.now()
        if not record or record.expires_at <= now:
            return Response({'detail': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)
        if record.attempts >= RESET_OTP_MAX_ATTEMPTS:
            return Response({'detail': 'Too many wrong attempts. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        if not check_password(otp, record.otp_hash):
            record.attempts += 1
            record.save(update_fields=['attempts'])
            return Response({'detail': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        reset_token = secrets.token_urlsafe(32)
        record.verified_at = now
        record.reset_token_hash = make_password(reset_token)
        record.save(update_fields=['verified_at', 'reset_token_hash'])
        return Response({
            'detail': 'OTP verified. You can now reset your password.',
            'reset_token': reset_token,
        })


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        user, issue = _resolve_password_reset_user(payload['identifier'])

        if issue == 'multiple':
            return Response({'detail': 'Please enter your username instead of this shared email.'}, status=status.HTTP_400_BAD_REQUEST)
        if not user:
            return Response({'detail': 'Verify OTP before resetting password.'}, status=status.HTTP_400_BAD_REQUEST)

        record = _latest_open_reset_otp(user)
        now = timezone.now()
        if (
            not record or
            not record.verified_at or
            not record.reset_token_hash or
            record.expires_at <= now or
            not check_password(payload['reset_token'], record.reset_token_hash)
        ):
            return Response({'detail': 'Verify OTP before resetting password.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user.set_password(payload['password'])
            user.auth_version += 1
            user.save(update_fields=['password', 'auth_version'])
            record.used_at = now
            record.save(update_fields=['used_at'])
            PasswordResetOTP.objects.filter(user=user, used_at__isnull=True).exclude(pk=record.pk).update(used_at=now)

        blacklist_outstanding_tokens(user)
        return Response({'detail': 'Password reset successfully. Please log in.'})


class GoogleLoginView(APIView):

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

        user = User.objects.filter(email=email, role__name='student').first()
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

        tokens = build_token_pair(user)
        return Response({
            **tokens,
            'user': UserSerializer(user).data,
        })
