from django.contrib.auth import get_user_model
from django.db.utils import OperationalError, ProgrammingError
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken


AUTH_VERSION_CLAIM = 'auth_version'
User = get_user_model()


def build_token_pair(user):
    refresh = RefreshToken.for_user(user)
    refresh[AUTH_VERSION_CLAIM] = user.auth_version
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


def blacklist_outstanding_tokens(user):
    try:
        for token in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=token)
    except (ProgrammingError, OperationalError):
        # If blacklist tables are unavailable, still allow the credential
        # version check to invalidate existing access tokens.
        return


class CredentialAwareJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        token_auth_version = validated_token.get(AUTH_VERSION_CLAIM)
        if int(token_auth_version or 0) != user.auth_version:
            raise InvalidToken('This session is no longer valid. Please log in again.')
        return user


class CredentialAwareTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        refresh = self.token_class(attrs['refresh'])
        user_id = refresh.get(api_settings.USER_ID_CLAIM)
        token_auth_version = refresh.get(AUTH_VERSION_CLAIM)

        if not user_id:
            raise InvalidToken('Token contained no recognizable user identification.')

        try:
            user = User.objects.get(**{api_settings.USER_ID_FIELD: user_id})
        except User.DoesNotExist as exc:
            raise InvalidToken('User not found.') from exc

        if not user.is_active:
            raise InvalidToken('User account is inactive.')

        if int(token_auth_version or 0) != user.auth_version:
            raise InvalidToken('This session is no longer valid. Please log in again.')

        return super().validate(attrs)
