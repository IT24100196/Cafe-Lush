import html

import requests
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.mail import send_mail


def send_transactional_email(subject, message, recipient_list):
    if getattr(settings, 'EMAIL_PROVIDER', '').lower() != 'resend':
        return send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            fail_silently=False,
        )

    api_key = getattr(settings, 'RESEND_API_KEY', '')
    if not api_key:
        raise ImproperlyConfigured('RESEND_API_KEY is required when EMAIL_PROVIDER=resend.')

    response = requests.post(
        getattr(settings, 'RESEND_API_URL', 'https://api.resend.com/emails'),
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'Cafe-Lush/1.0',
        },
        json={
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': recipient_list,
            'subject': subject,
            'text': message,
            'html': f'<p>{html.escape(message).replace(chr(10), "<br>")}</p>',
        },
        timeout=getattr(settings, 'EMAIL_TIMEOUT', 10),
    )

    if response.status_code >= 400:
        raise RuntimeError(f'Resend email failed: {response.status_code} {response.text}')

    return 1
