from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, Role
from hotel_pos_backend.validators import (
    PASSWORD_MIN_LENGTH,
    validate_generic_email_format,
    validate_person_name,
    validate_sri_lankan_mobile,
    validate_username_format,
)


def _django_error_message(exc):
    return exc.messages[0] if getattr(exc, 'messages', None) else str(exc)


def _validate_identifier(value):
    identifier = value.strip()
    if not identifier:
        raise serializers.ValidationError('Username or email is required.')
    if '@' in identifier:
        try:
            return validate_generic_email_format(identifier, required=True)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))
    return identifier


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Role
        fields = ['id', 'name']


class UserSerializer(serializers.ModelSerializer):
    role      = RoleSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    contact   = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'role', 'is_active', 'created_at',
                  'full_name', 'contact', 'deactivation_reason']

    def get_full_name(self, obj):
        s = getattr(obj, 'student_profile', None)
        return s.full_name if s else ''

    def get_contact(self, obj):
        s = getattr(obj, 'student_profile', None)
        return s.contact if s else ''


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=PASSWORD_MIN_LENGTH)
    role_name = serializers.ChoiceField(choices=Role.ROLE_CHOICES, write_only=True)

    class Meta:
        model  = User
        fields = ['username', 'email', 'password', 'role_name']

    def validate_username(self, value):
        try:
            username = validate_username_format(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError('Username already taken.')
        return username

    def validate_email(self, value):
        try:
            email = validate_generic_email_format(value, required=False)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))
        if email and User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('This email is already in use.')
        return email

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))
        return value

    def create(self, validated_data):
        role_name = validated_data.pop('role_name')
        role, _   = Role.objects.get_or_create(name=role_name)
        return User.objects.create_user(role=role, **validated_data)


class StudentRegisterSerializer(serializers.Serializer):
    """Public registration — always creates a student account + student profile."""
    username  = serializers.CharField(max_length=100)
    email     = serializers.CharField(max_length=254, required=False, allow_blank=True)
    password  = serializers.CharField(write_only=True, min_length=PASSWORD_MIN_LENGTH)
    full_name = serializers.CharField(max_length=150)
    contact   = serializers.CharField(max_length=50, required=False, allow_blank=True)

    def validate_username(self, value):
        try:
            username = validate_username_format(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError('Username already taken.')
        return username

    def validate_email(self, value):
        try:
            email = validate_generic_email_format(value, required=False)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))
        if email and User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('This email is already in use.')
        return email

    def validate_full_name(self, value):
        try:
            return validate_person_name(value, required=True, label='Full name')
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))

    def validate_contact(self, value):
        try:
            return validate_sri_lankan_mobile(value, required=False, label='Contact number')
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))

    def create(self, validated_data):
        import uuid
        from meals.models import Student
        full_name = validated_data.pop('full_name')
        contact   = validated_data.pop('contact', '')

        role, _ = Role.objects.get_or_create(name=Role.STUDENT)
        user    = User.objects.create_user(role=role, **validated_data)
        Student.objects.create(
            user=user,
            student_code=f'STU-{uuid.uuid4().hex[:8].upper()}',
            full_name=full_name,
            contact=contact,
        )
        return user


class StudentRegistrationOTPRequestSerializer(serializers.Serializer):
    username         = serializers.CharField(max_length=100)
    email            = serializers.CharField(max_length=254)
    password         = serializers.CharField(write_only=True, min_length=PASSWORD_MIN_LENGTH)
    confirm_password = serializers.CharField(write_only=True, min_length=PASSWORD_MIN_LENGTH)
    full_name        = serializers.CharField(max_length=150)
    contact          = serializers.CharField(max_length=50, required=False, allow_blank=True)

    def validate_username(self, value):
        try:
            username = validate_username_format(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError('Username already taken.')
        return username

    def validate_email(self, value):
        try:
            email = validate_generic_email_format(value, required=True)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('This email is already in use.')
        return email

    def validate_full_name(self, value):
        try:
            return validate_person_name(value, required=True, label='Full name')
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))

    def validate_contact(self, value):
        try:
            return validate_sri_lankan_mobile(value, required=False, label='Contact number')
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data


class StudentRegistrationOTPVerifySerializer(serializers.Serializer):
    email = serializers.CharField(max_length=254)
    otp   = serializers.CharField(max_length=6)

    def validate_email(self, value):
        try:
            return validate_generic_email_format(value, required=True)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))

    def validate_otp(self, value):
        otp = value.strip()
        if len(otp) != 6 or not otp.isdigit():
            raise serializers.ValidationError('Enter the 6 digit OTP.')
        return otp


class ProfileUpdateSerializer(serializers.Serializer):
    email     = serializers.CharField(max_length=254, required=False, allow_blank=True)
    full_name = serializers.CharField(max_length=150, required=False, allow_blank=False)
    contact   = serializers.CharField(max_length=50, required=False, allow_blank=True)

    def validate_email(self, value):
        try:
            return validate_generic_email_format(value, required=False)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))

    def validate_full_name(self, value):
        try:
            return validate_person_name(value, required=True, label='Full name')
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))

    def validate_contact(self, value):
        try:
            return validate_sri_lankan_mobile(value, required=False, label='Contact number')
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))

    def validate(self, data):
        user = self.context.get('user')
        email = data.get('email')
        if user and email and User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
            raise serializers.ValidationError({'email': 'This email is already in use.'})
        return data


class CashierAdminCreateSerializer(serializers.Serializer):
    username         = serializers.CharField(max_length=100)
    email            = serializers.CharField(max_length=254, required=False, allow_blank=True)
    password         = serializers.CharField(write_only=True, min_length=PASSWORD_MIN_LENGTH)
    confirm_password = serializers.CharField(write_only=True, min_length=PASSWORD_MIN_LENGTH)

    def validate_username(self, value):
        try:
            username = validate_username_format(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError('Username already taken.')
        return username

    def validate_email(self, value):
        try:
            email = validate_generic_email_format(value, required=False)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))
        if email and User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('This email is already in use.')
        return email

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        role, _ = Role.objects.get_or_create(name=Role.CASHIER)
        return User.objects.create_user(role=role, **validated_data)


class CashierAdminUpdateSerializer(serializers.Serializer):
    username         = serializers.CharField(max_length=100, required=False)
    email            = serializers.CharField(max_length=254, required=False, allow_blank=True)
    password         = serializers.CharField(write_only=True, min_length=PASSWORD_MIN_LENGTH, required=False, allow_blank=True)
    confirm_password = serializers.CharField(write_only=True, min_length=PASSWORD_MIN_LENGTH, required=False, allow_blank=True)
    is_active        = serializers.BooleanField(required=False)

    def validate_username(self, value):
        try:
            username = validate_username_format(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))
        user = self.context.get('user')
        if user and User.objects.filter(username__iexact=username).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('Username already taken.')
        return username

    def validate_email(self, value):
        try:
            email = validate_generic_email_format(value, required=False)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))
        user = self.context.get('user')
        if email and User.objects.filter(email__iexact=email).exclude(pk=getattr(user, 'pk', None)).exists():
            raise serializers.ValidationError('This email is already in use.')
        return email

    def validate_password(self, value):
        if not value:
            return ''
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))
        return value

    def validate(self, data):
        if not data:
            raise serializers.ValidationError({'detail': 'No changes were provided.'})

        password = data.get('password', '')
        confirm_password = data.get('confirm_password', '')

        if confirm_password and not password:
            raise serializers.ValidationError({'password': 'Enter a new password before confirming it.'})
        if password and not confirm_password:
            raise serializers.ValidationError({'confirm_password': 'Please confirm the new password.'})
        if password and confirm_password and password != confirm_password:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})

        return data


class ForgotPasswordSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=254)

    def validate_identifier(self, value):
        return _validate_identifier(value)


class VerifyResetOTPSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=254)
    otp        = serializers.CharField(max_length=6)

    def validate_identifier(self, value):
        return _validate_identifier(value)

    def validate_otp(self, value):
        otp = value.strip()
        if len(otp) != 6 or not otp.isdigit():
            raise serializers.ValidationError('Enter the 6 digit OTP.')
        return otp


class ResetPasswordSerializer(serializers.Serializer):
    identifier       = serializers.CharField(max_length=254)
    reset_token      = serializers.CharField(max_length=128)
    password         = serializers.CharField(write_only=True, min_length=PASSWORD_MIN_LENGTH)
    confirm_password = serializers.CharField(write_only=True, min_length=PASSWORD_MIN_LENGTH)

    def validate_identifier(self, value):
        return _validate_identifier(value)

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(_django_error_message(exc))
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        # Use authenticate with backend that allows inactive users so we can
        # distinguish "wrong password" from "deactivated account".
        try:
            user = User.objects.get(username=data['username'])
        except User.DoesNotExist:
            raise serializers.ValidationError({'detail': 'Invalid username or password.'})

        if not user.check_password(data['password']):
            raise serializers.ValidationError({'detail': 'Invalid username or password.'})

        if not user.is_active:
            reason = user.deactivation_reason or 'Your account has been deactivated by the administrator.'
            raise serializers.ValidationError({'detail': f'DEACTIVATED:{reason}'})

        data['user'] = user
        return data
