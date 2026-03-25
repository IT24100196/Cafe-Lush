from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class Role(models.Model):
    STUDENT = 'student'
    CASHIER = 'cashier'
    ADMIN   = 'admin'
    ROLE_CHOICES = [(STUDENT, 'Student'), (CASHIER, 'Cashier'), (ADMIN, 'Admin')]

    name = models.CharField(max_length=50, unique=True, choices=ROLE_CHOICES)

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    def create_user(self, username, password, role, email=None, **extra):
        user = self.model(username=username, email=email, role=role, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password, **extra):
        role, _ = Role.objects.get_or_create(name=Role.ADMIN)
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        return self.create_user(username, password, role=role, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    role       = models.ForeignKey(Role, on_delete=models.PROTECT, related_name='users')
    username   = models.CharField(max_length=100, unique=True)
    email      = models.EmailField(unique=True, null=True, blank=True)
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD  = 'username'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'
        indexes  = [models.Index(fields=['role']), models.Index(fields=['is_active'])]

    def __str__(self):
        return self.username
