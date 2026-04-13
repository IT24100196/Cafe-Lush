import re

from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from authentication.models import PasswordResetOTP, PendingStudentRegistration, Role, User
from pos.models import PosOrder
from pos.serializers import PosOrderSerializer


@override_settings(
    ROOT_URLCONF='authentication.test_urls',
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
)
class CashierCredentialManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_client = APIClient()

        self.admin_role, _ = Role.objects.get_or_create(name=Role.ADMIN)
        self.cashier_role, _ = Role.objects.get_or_create(name=Role.CASHIER)

        self.admin = User.objects.create_user(
            username='adminuser',
            password='AdminPass123!',
            role=self.admin_role,
            email='shanthaenterprise2026@gmail.com',
            is_staff=True,
            is_superuser=True,
        )
        self.cashier = User.objects.create_user(
            username='cashier1',
            password='CashierPass123!',
            role=self.cashier_role,
            email='shanthaenterprise2026@gmail.com',
        )
        self.admin_client.force_authenticate(user=self.admin)
        self.pos_order = PosOrder.objects.create(
            cashier=self.cashier,
            total_amount='1250.00',
            status='paid',
        )

    def test_admin_can_manage_cashier_credentials_and_old_tokens_are_rejected(self):
        login_response = self.client.post('/api/auth/login/', {
            'username': 'cashier1',
            'password': 'CashierPass123!',
        }, format='json')
        self.assertEqual(login_response.status_code, 200)

        old_access = login_response.data['access']
        old_refresh = login_response.data['refresh']

        list_response = self.admin_client.get('/api/auth/cashiers/')
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data), 2)
        self.assertEqual({user['username'] for user in list_response.data}, {'adminuser', 'cashier1'})

        update_response = self.admin_client.patch(f'/api/auth/cashiers/{self.cashier.id}/', {
            'username': 'cashier-renamed',
            'password': 'NewCashierPass123!',
            'confirm_password': 'NewCashierPass123!',
        }, format='json')
        self.assertEqual(update_response.status_code, 200)

        self.cashier.refresh_from_db()
        self.pos_order.refresh_from_db()
        self.assertEqual(self.cashier.username, 'cashier-renamed')
        self.assertEqual(self.cashier.auth_version, 2)
        self.assertEqual(self.pos_order.cashier_id, self.cashier.id)
        self.assertEqual(PosOrderSerializer(self.pos_order).data['cashier_name'], 'cashier-renamed')

        stale_access_client = APIClient()
        stale_access_client.credentials(HTTP_AUTHORIZATION=f'Bearer {old_access}')
        stale_profile_response = stale_access_client.get('/api/auth/profile/')
        self.assertEqual(stale_profile_response.status_code, 401)

        stale_refresh_response = self.client.post('/api/auth/refresh/', {
            'refresh': old_refresh,
        }, format='json')
        self.assertEqual(stale_refresh_response.status_code, 401)

        old_login_response = self.client.post('/api/auth/login/', {
            'username': 'cashier1',
            'password': 'CashierPass123!',
        }, format='json')
        self.assertEqual(old_login_response.status_code, 400)

        new_login_response = self.client.post('/api/auth/login/', {
            'username': 'cashier-renamed',
            'password': 'NewCashierPass123!',
        }, format='json')
        self.assertEqual(new_login_response.status_code, 200)

    def test_admin_can_manage_admin_credentials_and_old_tokens_are_rejected(self):
        login_response = self.client.post('/api/auth/login/', {
            'username': 'adminuser',
            'password': 'AdminPass123!',
        }, format='json')
        self.assertEqual(login_response.status_code, 200)

        old_access = login_response.data['access']
        old_refresh = login_response.data['refresh']

        update_response = self.admin_client.patch(f'/api/auth/cashiers/{self.admin.id}/', {
            'username': 'admin-renamed',
            'password': 'NewAdminPass123!',
            'confirm_password': 'NewAdminPass123!',
        }, format='json')
        self.assertEqual(update_response.status_code, 200)

        self.admin.refresh_from_db()
        self.assertEqual(self.admin.username, 'admin-renamed')
        self.assertEqual(self.admin.auth_version, 2)

        stale_access_client = APIClient()
        stale_access_client.credentials(HTTP_AUTHORIZATION=f'Bearer {old_access}')
        stale_profile_response = stale_access_client.get('/api/auth/profile/')
        self.assertEqual(stale_profile_response.status_code, 401)

        stale_refresh_response = self.client.post('/api/auth/refresh/', {
            'refresh': old_refresh,
        }, format='json')
        self.assertEqual(stale_refresh_response.status_code, 401)

        old_login_response = self.client.post('/api/auth/login/', {
            'username': 'adminuser',
            'password': 'AdminPass123!',
        }, format='json')
        self.assertEqual(old_login_response.status_code, 400)

        new_login_response = self.client.post('/api/auth/login/', {
            'username': 'admin-renamed',
            'password': 'NewAdminPass123!',
        }, format='json')
        self.assertEqual(new_login_response.status_code, 200)

    def test_password_reset_requires_verified_otp_and_rejects_old_credentials(self):
        login_response = self.client.post('/api/auth/login/', {
            'username': 'cashier1',
            'password': 'CashierPass123!',
        }, format='json')
        self.assertEqual(login_response.status_code, 200)
        old_access = login_response.data['access']

        shared_email_response = self.client.post('/api/auth/forgot-password/', {
            'identifier': 'shanthaenterprise2026@gmail.com',
        }, format='json')
        self.assertEqual(shared_email_response.status_code, 400)

        send_response = self.client.post('/api/auth/forgot-password/', {
            'identifier': 'cashier1',
        }, format='json')
        self.assertEqual(send_response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        otp = re.search(r'\b\d{6}\b', mail.outbox[0].body).group(0)

        early_reset_response = self.client.post('/api/auth/reset-password/', {
            'identifier': 'cashier1',
            'reset_token': 'not-verified',
            'password': 'OtpResetPass123!',
            'confirm_password': 'OtpResetPass123!',
        }, format='json')
        self.assertEqual(early_reset_response.status_code, 400)

        verify_response = self.client.post('/api/auth/verify-reset-otp/', {
            'identifier': 'cashier1',
            'otp': otp,
        }, format='json')
        self.assertEqual(verify_response.status_code, 200)
        self.assertTrue(verify_response.data['reset_token'])

        reset_response = self.client.post('/api/auth/reset-password/', {
            'identifier': 'cashier1',
            'reset_token': verify_response.data['reset_token'],
            'password': 'OtpResetPass123!',
            'confirm_password': 'OtpResetPass123!',
        }, format='json')
        self.assertEqual(reset_response.status_code, 200)

        self.cashier.refresh_from_db()
        self.assertEqual(self.cashier.auth_version, 2)
        self.assertTrue(PasswordResetOTP.objects.get(user=self.cashier).used_at)

        stale_access_client = APIClient()
        stale_access_client.credentials(HTTP_AUTHORIZATION=f'Bearer {old_access}')
        stale_profile_response = stale_access_client.get('/api/auth/profile/')
        self.assertEqual(stale_profile_response.status_code, 401)

        old_login_response = self.client.post('/api/auth/login/', {
            'username': 'cashier1',
            'password': 'CashierPass123!',
        }, format='json')
        self.assertEqual(old_login_response.status_code, 400)

        new_login_response = self.client.post('/api/auth/login/', {
            'username': 'cashier1',
            'password': 'OtpResetPass123!',
        }, format='json')
        self.assertEqual(new_login_response.status_code, 200)

    def test_student_registration_requires_email_otp_before_account_is_created(self):
        direct_response = self.client.post('/api/auth/register/student/', {
            'username': 'student1',
            'email': 'student1@example.com',
            'password': 'StudentPass123!',
            'full_name': 'Student One',
        }, format='json')
        self.assertEqual(direct_response.status_code, 400)

        request_response = self.client.post('/api/auth/register/student/request-otp/', {
            'username': 'student1',
            'email': 'student1@example.com',
            'password': 'StudentPass123!',
            'confirm_password': 'StudentPass123!',
            'full_name': 'Student One',
            'contact': '0771234567',
        }, format='json')
        self.assertEqual(request_response.status_code, 200)
        self.assertFalse(User.objects.filter(username='student1').exists())
        self.assertEqual(len(mail.outbox), 1)
        otp = re.search(r'\b\d{6}\b', mail.outbox[0].body).group(0)

        wrong_otp_response = self.client.post('/api/auth/register/student/verify/', {
            'email': 'student1@example.com',
            'otp': '000000',
        }, format='json')
        self.assertEqual(wrong_otp_response.status_code, 400)
        self.assertFalse(User.objects.filter(username='student1').exists())

        verify_response = self.client.post('/api/auth/register/student/verify/', {
            'email': 'student1@example.com',
            'otp': otp,
        }, format='json')
        self.assertEqual(verify_response.status_code, 201)
        self.assertIn('access', verify_response.data)

        student = User.objects.get(username='student1')
        self.assertEqual(student.email, 'student1@example.com')
        self.assertEqual(student.role.name, Role.STUDENT)
        self.assertEqual(student.student_profile.full_name, 'Student One')
        self.assertTrue(PendingStudentRegistration.objects.get(email='student1@example.com').used_at)

        login_response = self.client.post('/api/auth/login/', {
            'username': 'student1',
            'password': 'StudentPass123!',
        }, format='json')
        self.assertEqual(login_response.status_code, 200)
