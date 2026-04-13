import re

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email


GENERIC_EMAIL_REGEX = re.compile(r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
SL_MOBILE_REGEX = re.compile(r'^(?:\+94|0)7\d{8}$')


def _normalize_phone(value):
    return re.sub(r'[\s-]+', '', value or '')


def validate_generic_email_format(value, *, required=False):
    email = (value or '').strip()
    if not email:
        if required:
            raise DjangoValidationError('Email address is required.')
        return None

    if not GENERIC_EMAIL_REGEX.fullmatch(email):
        raise DjangoValidationError('Enter a valid email address (example: user@example.com).')

    try:
        validate_email(email)
    except DjangoValidationError as exc:
        raise DjangoValidationError(exc.messages[0] if exc.messages else 'Enter a valid email address.') from exc

    return email.lower()


def validate_sri_lankan_mobile(value, *, required=False, label='Phone number'):
    phone = (value or '').strip()
    if not phone:
        if required:
            raise DjangoValidationError(f'{label} is required.')
        return ''

    normalized = _normalize_phone(phone)
    if not SL_MOBILE_REGEX.fullmatch(normalized):
        raise DjangoValidationError(
            f'{label} must be a valid Sri Lankan mobile number (example: 0771234567 or +94771234567).'
        )
    return normalized
