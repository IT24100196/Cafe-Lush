import json
import math
import re
from difflib import SequenceMatcher
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError


MONEY_SCALE = Decimal('0.01')
COORD_SCALE = Decimal('0.000001')
RESTAURANT_LAT = Decimal('9.697726')
RESTAURANT_LNG = Decimal('80.032571')
LOCATION_SOURCE_ADDRESS = 'address'
LOCATION_SOURCE_CURRENT = 'current_location'

KNOWN_ADDRESS_TERMS = [
    'Ariyalai',
    'Chunnakam',
    'Jaffna',
    'Kandy Road',
    'Kokuvil',
    'Kopay',
    'Manipay',
    'Nallur',
    'Navalar Road',
    'Palaly Road',
    'Ramanathan Road',
    'Thirunelveli',
    'University of Jaffna',
]

ADDRESS_ALIASES = {
    'jaffna uni': 'University of Jaffna',
    'jaffna university': 'University of Jaffna',
    'thirunalveli': 'Thirunelveli',
    'thirunelweli': 'Thirunelveli',
    'thirunaveli': 'Thirunelveli',
    'tirunelveli': 'Thirunelveli',
    'univercity of jaffna': 'University of Jaffna',
    'university jaffna': 'University of Jaffna',
    'uni of jaffna': 'University of Jaffna',
}


def build_delivery_address(address_line_1='', address_line_2='', city_area=''):
    parts = [
        str(address_line_1 or '').strip(),
        str(address_line_2 or '').strip(),
        str(city_area or '').strip(),
    ]
    return ', '.join(part for part in parts if part)


def normalize_address_text(value):
    text = str(value or '').strip()
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\s*,\s*', ', ', text)
    text = re.sub(r'(,\s*)+', ', ', text)
    return text.strip(' ,')


def _replace_address_aliases(text):
    corrected = normalize_address_text(text)
    for alias, canonical in sorted(ADDRESS_ALIASES.items(), key=lambda item: len(item[0]), reverse=True):
        corrected = re.sub(rf'\b{re.escape(alias)}\b', canonical, corrected, flags=re.IGNORECASE)
    return normalize_address_text(corrected)


def _best_known_term_match(segment):
    cleaned = normalize_address_text(segment)
    if not cleaned or any(char.isdigit() for char in cleaned) or len(cleaned) < 5:
        return cleaned

    lower = cleaned.lower()
    for term in KNOWN_ADDRESS_TERMS:
        if lower == term.lower():
            return term

    best_term = cleaned
    best_score = 0
    for term in KNOWN_ADDRESS_TERMS:
        score = SequenceMatcher(None, lower, term.lower()).ratio()
        if score > best_score:
            best_term = term
            best_score = score

    return best_term if best_score >= 0.86 else cleaned


def correct_delivery_address(full_address):
    corrected = _replace_address_aliases(full_address)
    parts = [_best_known_term_match(part) for part in corrected.split(',')]
    return normalize_address_text(', '.join(part for part in parts if part))


def get_delivery_address_candidates(full_address):
    original = normalize_address_text(full_address)
    corrected = correct_delivery_address(original)
    candidates = []

    def add_candidate(value):
        candidate = normalize_address_text(value)
        if candidate and candidate.lower() not in {existing.lower() for existing in candidates}:
            candidates.append(candidate)

    add_candidate(corrected)
    add_candidate(original)

    for candidate in list(candidates):
        if 'sri lanka' not in candidate.lower():
            add_candidate(f'{candidate}, Sri Lanka')

    corrected_parts = [part.strip() for part in corrected.split(',') if part.strip()]
    if len(corrected_parts) > 1:
        add_candidate(', '.join(corrected_parts[-2:]))
        add_candidate(f'{", ".join(corrected_parts[-2:])}, Sri Lanka')
    if corrected_parts:
        add_candidate(f'{corrected_parts[-1]}, Sri Lanka')

    return candidates


def normalize_coordinate(value, label):
    if value in (None, ''):
        return None
    try:
        return Decimal(str(value)).quantize(COORD_SCALE, rounding=ROUND_HALF_UP)
    except (InvalidOperation, TypeError, ValueError):
        raise DjangoValidationError(f'{label} must be a valid coordinate.')


def haversine_distance_km(lat1, lng1, lat2, lng2):
    lat1f, lng1f = float(lat1), float(lng1)
    lat2f, lng2f = float(lat2), float(lng2)
    radius_km = 6371.0
    d_lat = math.radians(lat2f - lat1f)
    d_lng = math.radians(lng2f - lng1f)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1f))
        * math.cos(math.radians(lat2f))
        * math.sin(d_lng / 2) ** 2
    )
    return radius_km * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def get_delivery_charge(distance_km):
    if distance_km <= 2:
        return Decimal('150.00')
    if distance_km <= 5:
        return Decimal('200.00')
    if distance_km <= 10:
        return Decimal('400.00')
    if distance_km <= 15:
        return Decimal('500.00')
    return None


def format_delivery_charge(charge):
    if charge is None:
        return 'Outside delivery zone'
    quantized = Decimal(charge).quantize(MONEY_SCALE, rounding=ROUND_HALF_UP)
    if quantized == quantized.to_integral():
        return f'LKR {int(quantized)}'
    return f'LKR {quantized:.2f}'


def _geocode_query(query):
    query = normalize_address_text(query)
    if not query:
        raise DjangoValidationError('A delivery address is required to calculate the delivery fee.')

    params = urlencode({
        'q': query,
        'format': 'jsonv2',
        'limit': 1,
        'countrycodes': 'lk',
    })
    url = f'{getattr(settings, "NOMINATIM_BASE_URL", "https://nominatim.openstreetmap.org/search")}?{params}'
    request = Request(
        url,
        headers={
            'User-Agent': getattr(settings, 'GEOCODER_USER_AGENT', 'CafeLushDelivery/1.0'),
            'Accept-Language': 'en',
        },
    )

    try:
        with urlopen(request, timeout=8) as response:
            payload = json.loads(response.read().decode('utf-8'))
    except Exception as exc:
        raise DjangoValidationError(f'Could not calculate delivery fee from the address right now. {exc}')

    if not payload:
        raise DjangoValidationError('We could not locate that delivery address. Please check the address and try again.')

    first = payload[0]
    return (
        normalize_coordinate(first.get('lat'), 'Latitude'),
        normalize_coordinate(first.get('lon'), 'Longitude'),
    )


def geocode_delivery_address(full_address):
    candidates = get_delivery_address_candidates(full_address)
    if not candidates:
        raise DjangoValidationError('A delivery address is required to calculate the delivery fee.')

    last_error = None
    for candidate in candidates:
        try:
            return _geocode_query(candidate)
        except DjangoValidationError as exc:
            last_error = exc

    if last_error:
        message = last_error.messages[0] if getattr(last_error, 'messages', None) else str(last_error)
        if 'right now' in message:
            raise last_error

    corrected = correct_delivery_address(full_address)
    raise DjangoValidationError(
        'We could not locate that delivery address. Please check the spelling, add a nearby landmark, '
        f'or use Current Location. Tried: {corrected}.'
    )


def calculate_delivery_quote(
    *,
    delivery_type,
    has_package=False,
    location_source=LOCATION_SOURCE_ADDRESS,
    full_address='',
    latitude=None,
    longitude=None,
):
    if (delivery_type or '').lower() != 'delivery':
        return {
            'delivery_fee': Decimal('0.00'),
            'distance_km': None,
            'label': 'LKR 0',
            'latitude': None,
            'longitude': None,
            'location_source': LOCATION_SOURCE_ADDRESS,
        }

    if has_package:
        return {
            'delivery_fee': Decimal('0.00'),
            'distance_km': None,
            'label': 'LKR 0',
            'latitude': None,
            'longitude': None,
            'location_source': LOCATION_SOURCE_ADDRESS,
        }

    source = (location_source or LOCATION_SOURCE_ADDRESS).strip() or LOCATION_SOURCE_ADDRESS
    if source == LOCATION_SOURCE_CURRENT:
        lat = normalize_coordinate(latitude, 'Latitude')
        lng = normalize_coordinate(longitude, 'Longitude')
        if lat is None or lng is None:
            raise DjangoValidationError('Current location is required to calculate the delivery fee.')
    else:
        lat, lng = geocode_delivery_address(full_address)
        source = LOCATION_SOURCE_ADDRESS

    distance_km = Decimal(str(haversine_distance_km(RESTAURANT_LAT, RESTAURANT_LNG, lat, lng))).quantize(
        Decimal('0.01'),
        rounding=ROUND_HALF_UP,
    )
    delivery_fee = get_delivery_charge(float(distance_km))
    if delivery_fee is None:
        raise DjangoValidationError('Sorry, your location is outside our delivery zone (max 15 km).')

    return {
        'delivery_fee': delivery_fee.quantize(MONEY_SCALE, rounding=ROUND_HALF_UP),
        'distance_km': distance_km,
        'label': format_delivery_charge(delivery_fee),
        'latitude': lat,
        'longitude': lng,
        'location_source': source,
    }
