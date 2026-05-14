from email.mime.image import MIMEImage
from unittest.mock import patch

from django.core.mail import EmailMultiAlternatives, send_mail
from django.test import SimpleTestCase, override_settings


@override_settings(
    EMAIL_BACKEND='hotel_pos_backend.email_backends.ResendEmailBackend',
    RESEND_API_KEY='re_test_key',
    RESEND_API_URL='https://api.resend.com/emails',
    DEFAULT_FROM_EMAIL='Cafe Lush <noreply@example.com>',
    EMAIL_TIMEOUT=10,
)
class ResendEmailBackendTests(SimpleTestCase):
    @patch('hotel_pos_backend.email_backends.requests.post')
    def test_send_mail_uses_resend_backend(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.text = '{"id":"email_123"}'

        result = send_mail(
            subject='OTP',
            message='Your code is 123456',
            from_email=None,
            recipient_list=['student@example.com'],
            fail_silently=False,
        )

        self.assertEqual(result, 1)
        payload = mock_post.call_args.kwargs['json']
        self.assertEqual(payload['from'], 'Cafe Lush <noreply@example.com>')
        self.assertEqual(payload['to'], ['student@example.com'])
        self.assertEqual(payload['subject'], 'OTP')
        self.assertEqual(payload['text'], 'Your code is 123456')
        self.assertNotIn('attachments', payload)

    @patch('hotel_pos_backend.email_backends.requests.post')
    def test_html_and_attachments_are_sent_to_resend(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.text = '{"id":"email_456"}'

        message = EmailMultiAlternatives(
            subject='Your Bill',
            body='Plain text fallback',
            to=['student@example.com'],
        )
        message.attach_alternative('<p>Hello <img src="cid:bill-logo-cid" /></p>', 'text/html')

        logo = MIMEImage(b'fake-image-bytes', _subtype='png')
        logo.add_header('Content-ID', '<bill-logo-cid>')
        logo.add_header('Content-Disposition', 'inline', filename='logo.png')
        message.attach(logo)
        message.attach('bill.pdf', b'%PDF-1.4 fake pdf', 'application/pdf')

        result = message.send(fail_silently=False)

        self.assertEqual(result, 1)
        payload = mock_post.call_args.kwargs['json']
        self.assertEqual(payload['to'], ['student@example.com'])
        self.assertEqual(payload['subject'], 'Your Bill')
        self.assertEqual(payload['text'], 'Plain text fallback')
        self.assertIn('cid:bill-logo-cid', payload['html'])
        self.assertEqual(len(payload['attachments']), 2)

        filenames = {item['filename'] for item in payload['attachments']}
        self.assertEqual(filenames, {'logo.png', 'bill.pdf'})

        inline_attachment = next(
            item for item in payload['attachments'] if item['filename'] == 'logo.png'
        )
        self.assertEqual(inline_attachment['contentId'], 'bill-logo-cid')
