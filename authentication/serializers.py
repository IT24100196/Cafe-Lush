from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Role


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
    password  = serializers.CharField(write_only=True, min_length=6)
    role_name = serializers.ChoiceField(choices=Role.ROLE_CHOICES, write_only=True)

    class Meta:
        model  = User
        fields = ['username', 'email', 'password', 'role_name']

    def create(self, validated_data):
        role_name = validated_data.pop('role_name')
        role, _   = Role.objects.get_or_create(name=role_name)
        return User.objects.create_user(role=role, **validated_data)


class StudentRegisterSerializer(serializers.Serializer):
    """Public registration — always creates a student account + student profile."""
    username  = serializers.CharField(max_length=100)
    email     = serializers.EmailField(required=False, allow_blank=True)
    password  = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(max_length=150)
    contact   = serializers.CharField(max_length=50, required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

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
