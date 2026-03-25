from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Role


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Role
        fields = ['id', 'name']


class UserSerializer(serializers.ModelSerializer):
    role       = RoleSerializer(read_only=True)
    full_name  = serializers.SerializerMethodField()
    student_code = serializers.SerializerMethodField()
    contact    = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'role', 'is_active', 'created_at',
                  'full_name', 'student_code', 'contact']

    def get_full_name(self, obj):
        s = getattr(obj, 'student_profile', None)
        return s.full_name if s else ''

    def get_student_code(self, obj):
        s = getattr(obj, 'student_profile', None)
        return s.student_code if s else ''

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
    username     = serializers.CharField(max_length=100)
    email        = serializers.EmailField(required=False, allow_blank=True)
    password     = serializers.CharField(write_only=True, min_length=6)
    full_name    = serializers.CharField(max_length=150)
    student_code = serializers.CharField(max_length=50)
    contact      = serializers.CharField(max_length=50, required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

    def validate_student_code(self, value):
        from meals.models import Student
        if Student.objects.filter(student_code=value).exists():
            raise serializers.ValidationError('Student code already registered.')
        return value

    def create(self, validated_data):
        from meals.models import Student
        full_name    = validated_data.pop('full_name')
        student_code = validated_data.pop('student_code')
        contact      = validated_data.pop('contact', '')

        role, _ = Role.objects.get_or_create(name=Role.STUDENT)
        user    = User.objects.create_user(role=role, **validated_data)
        Student.objects.create(
            user=user,
            student_code=student_code,
            full_name=full_name,
            contact=contact,
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(**data)
        if not user or not user.is_active:
            raise serializers.ValidationError('Invalid credentials or inactive account.')
        data['user'] = user
        return data
