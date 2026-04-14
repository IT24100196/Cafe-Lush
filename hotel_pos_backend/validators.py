import re

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email


GENERIC_EMAIL_REGEX = re.compile(r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
SL_MOBILE_REGEX = re.compile(r'^07\d{8}$')
USERNAME_REGEX = re.compile(r'^(?=.*[A-Za-z])[A-Za-z0-9._-]{3,30}$')
EMAIL_MAX_LENGTH = 254
FULL_NAME_MAX_LENGTH = 150
PASSWORD_MIN_LENGTH = 8


def _normalize_phone(value):
    return (value or '').strip()


def validate_person_name(value, *, required=True, label='Full name'):
    name = ' '.join((value or '').strip().split())
    if not name:
        if required:
            raise DjangoValidationError(f'{label} is required.')
        return ''

    if len(name) > FULL_NAME_MAX_LENGTH:
        raise DjangoValidationError(f'{label} must be {FULL_NAME_MAX_LENGTH} characters or fewer.')

    letters = sum(1 for char in name if char.isalpha())
    if letters < 2 or any(not (char.isalpha() or char == ' ') for char in name):
        raise DjangoValidationError(f'{label} must contain letters and spaces only.')

    return name


def validate_username_format(value):
    username = (value or '').strip()
    if not username:
        raise DjangoValidationError('Username is required.')

    if not USERNAME_REGEX.fullmatch(username):
        raise DjangoValidationError(
            'Username must be 3-30 characters, include at least one letter, and use only letters, numbers, dot, underscore, or hyphen.'
        )

    return username


def validate_generic_email_format(value, *, required=False):
    email = (value or '').strip()
    if not email:
        if required:
            raise DjangoValidationError('Email address is required.')
        return None

    if len(email) > EMAIL_MAX_LENGTH:
        raise DjangoValidationError(f'Email address must be {EMAIL_MAX_LENGTH} characters or fewer.')

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
            f'{label} must contain exactly 10 numbers and start with 07 (example: 0771234567).'
        )
    return normalized
