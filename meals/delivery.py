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
DELIVERY_MAX_DISTANCE_KM = Decimal('20.00')
LOCATION_SOURCE_ADDRESS = 'address'
LOCATION_SOURCE_CURRENT = 'current_location'

DELIVERY_FEE_BRACKETS = [
    (Decimal('2'), Decimal('150.00')),
    (Decimal('5'), Decimal('250.00')),
    (Decimal('10'), Decimal('450.00')),
    (Decimal('15'), Decimal('700.00')),
    (DELIVERY_MAX_DISTANCE_KM, Decimal('1000.00')),
]

SPECIAL_DELIVERY_AREA_FEES = {
    'point-pedro': Decimal('1000.00'),
    'karainagar': Decimal('1000.00'),
    'kankesanthurai-kks': Decimal('1000.00'),
}

DELIVERY_AREAS = [
    {
        'id': 'alaveddy',
        'name': 'Alaveddy',
        'latitude': Decimal('9.765000'),
        'longitude': Decimal('80.000000'),
        'aliases': ['alavetti'],
    },
    {
        'id': 'anaicoddai',
        'name': 'Anaicoddai',
        'latitude': Decimal('9.690000'),
        'longitude': Decimal('79.994000'),
        'aliases': ['anaikoddai', 'anaikodai', 'anaikkoddai', 'anaikkodai'],
    },
    {
        'id': 'ariyalai',
        'name': 'Ariyalai',
        'latitude': Decimal('9.659000'),
        'longitude': Decimal('80.043000'),
        'aliases': [],
    },
    {
        'id': 'araly',
        'name': 'Araly',
        'latitude': Decimal('9.722000'),
        'longitude': Decimal('79.941000'),
        'aliases': ['arali'],
    },
    {
        'id': 'atchuvely',
        'name': 'Atchuvely',
        'latitude': Decimal('9.789000'),
        'longitude': Decimal('80.111000'),
        'aliases': ['achchuveli', 'achchuvely', 'atchuveli'],
    },
    {
        'id': 'chankanai',
        'name': 'Chankanai',
        'latitude': Decimal('9.747000'),
        'longitude': Decimal('79.976000'),
        'aliases': ['sankanai', 'changani'],
    },
    {
        'id': 'chavakachcheri',
        'name': 'Chavakachcheri',
        'latitude': Decimal('9.656000'),
        'longitude': Decimal('80.161000'),
        'aliases': ['chavakacheri', 'chavakachcheri town'],
    },
    {
        'id': 'chulipuram',
        'name': 'Chulipuram',
        'latitude': Decimal('9.785000'),
        'longitude': Decimal('79.950000'),
        'aliases': ['chulipuram junction'],
    },
    {
        'id': 'chunnakam',
        'name': 'Chunnakam',
        'latitude': Decimal('9.747400'),
        'longitude': Decimal('80.013200'),
        'aliases': ['chunnagam', 'chunnakam junction'],
    },
    {
        'id': 'chundikuli',
        'name': 'Chundikuli',
        'latitude': Decimal('9.662000'),
        'longitude': Decimal('80.036000'),
        'aliases': ['chundukuli'],
    },
    {
        'id': 'colombuthurai',
        'name': 'Colombuthurai',
        'latitude': Decimal('9.650000'),
        'longitude': Decimal('80.032000'),
        'aliases': ['columbuthurai', 'colombuthurai road'],
    },
    {
        'id': 'erlalai',
        'name': 'Erlalai',
        'latitude': Decimal('9.755000'),
        'longitude': Decimal('80.030000'),
        'aliases': ['erelalai'],
    },
    {
        'id': 'gurunagar',
        'name': 'Gurunagar',
        'latitude': Decimal('9.658000'),
        'longitude': Decimal('80.015000'),
        'aliases': [],
    },
    {
        'id': 'ilavalai',
        'name': 'Ilavalai',
        'latitude': Decimal('9.793000'),
        'longitude': Decimal('79.985000'),
        'aliases': ['illavalai'],
    },
    {
        'id': 'inuvil',
        'name': 'Inuvil',
        'latitude': Decimal('9.721000'),
        'longitude': Decimal('80.011000'),
        'aliases': ['innuvil'],
    },
    {
        'id': 'irupalai',
        'name': 'Irupalai',
        'latitude': Decimal('9.704000'),
        'longitude': Decimal('80.049000'),
        'aliases': ['irupalai east', 'irupalai west'],
    },
    {
        'id': 'jaffna-town',
        'name': 'Jaffna Town',
        'latitude': Decimal('9.661500'),
        'longitude': Decimal('80.025500'),
        'aliases': ['jaffna', 'jaffna city', 'yarlpanam', 'yalpanam', 'jaffan'],
    },
    {
        'id': 'kaitadi',
        'name': 'Kaitadi',
        'latitude': Decimal('9.664000'),
        'longitude': Decimal('80.094000'),
        'aliases': ['kaithady', 'kaithadi'],
    },
    {
        'id': 'kalviyankadu',
        'name': 'Kalviyankadu',
        'latitude': Decimal('9.684000'),
        'longitude': Decimal('80.048000'),
        'aliases': ['kalviyankaddu'],
    },
    {
        'id': 'kankesanthurai-kks',
        'name': 'Kankesanthurai (KKS)',
        'latitude': Decimal('9.816000'),
        'longitude': Decimal('80.040000'),
        'aliases': ['kankesanthurai', 'kks', 'kantharodai'],
    },
    {
        'id': 'karainagar',
        'name': 'Karainagar',
        'latitude': Decimal('9.746000'),
        'longitude': Decimal('79.881000'),
        'aliases': ['karaitivu'],
    },
    {
        'id': 'kokuvil',
        'name': 'Kokuvil',
        'latitude': Decimal('9.695700'),
        'longitude': Decimal('80.011400'),
        'aliases': ['kokkuvil'],
    },
    {
        'id': 'kondavil',
        'name': 'Kondavil',
        'latitude': Decimal('9.716700'),
        'longitude': Decimal('80.018000'),
        'aliases': ['kondawil'],
    },
    {
        'id': 'kopay',
        'name': 'Kopay',
        'latitude': Decimal('9.713000'),
        'longitude': Decimal('80.066000'),
        'aliases': ['kopai', 'koppay'],
    },
    {
        'id': 'kuppilan',
        'name': 'Kuppilan',
        'latitude': Decimal('9.770000'),
        'longitude': Decimal('80.035000'),
        'aliases': [],
    },
    {
        'id': 'mallakam',
        'name': 'Mallakam',
        'latitude': Decimal('9.764000'),
        'longitude': Decimal('80.015000'),
        'aliases': ['mallagam'],
    },
    {
        'id': 'manipay',
        'name': 'Manipay',
        'latitude': Decimal('9.734000'),
        'longitude': Decimal('80.005000'),
        'aliases': ['manippay'],
    },
    {
        'id': 'maruthanamadam',
        'name': 'Maruthanamadam',
        'latitude': Decimal('9.748000'),
        'longitude': Decimal('80.021000'),
        'aliases': ['maruthanarmadam'],
    },
    {
        'id': 'maviddapuram',
        'name': 'Maviddapuram',
        'latitude': Decimal('9.799000'),
        'longitude': Decimal('80.031000'),
        'aliases': ['mavidapuram'],
    },
    {
        'id': 'mathagal',
        'name': 'Mathagal',
        'latitude': Decimal('9.800000'),
        'longitude': Decimal('79.970000'),
        'aliases': ['mathakal'],
    },
    {
        'id': 'moolai',
        'name': 'Moolai',
        'latitude': Decimal('9.727000'),
        'longitude': Decimal('79.958000'),
        'aliases': ['mulai'],
    },
    {
        'id': 'navali',
        'name': 'Navali',
        'latitude': Decimal('9.728000'),
        'longitude': Decimal('79.981000'),
        'aliases': ['navaly'],
    },
    {
        'id': 'navanthurai',
        'name': 'Navanthurai',
        'latitude': Decimal('9.655000'),
        'longitude': Decimal('80.008000'),
        'aliases': ['navanthurai road'],
    },
    {
        'id': 'nallur',
        'name': 'Nallur',
        'latitude': Decimal('9.674300'),
        'longitude': Decimal('80.031900'),
        'aliases': ['nalloor'],
    },
    {
        'id': 'neervely',
        'name': 'Neervely',
        'latitude': Decimal('9.746000'),
        'longitude': Decimal('80.072000'),
        'aliases': ['neerveli'],
    },
    {
        'id': 'pandatharippu',
        'name': 'Pandatharippu',
        'latitude': Decimal('9.770000'),
        'longitude': Decimal('79.990000'),
        'aliases': ['pandatharippu junction'],
    },
    {
        'id': 'point-pedro',
        'name': 'Point Pedro',
        'latitude': Decimal('9.825000'),
        'longitude': Decimal('80.232000'),
        'aliases': ['paruthithurai'],
    },
    {
        'id': 'puttur',
        'name': 'Puttur',
        'latitude': Decimal('9.734000'),
        'longitude': Decimal('80.087000'),
        'aliases': ['puthur'],
    },
    {
        'id': 'sandilipay',
        'name': 'Sandilipay',
        'latitude': Decimal('9.755000'),
        'longitude': Decimal('79.994000'),
        'aliases': ['sandilippai', 'sandilipai'],
    },
    {
        'id': 'sillalai',
        'name': 'Sillalai',
        'latitude': Decimal('9.790000'),
        'longitude': Decimal('79.973000'),
        'aliases': ['silalai'],
    },
    {
        'id': 'siruppiddy',
        'name': 'Siruppiddy',
        'latitude': Decimal('9.755000'),
        'longitude': Decimal('80.052000'),
        'aliases': ['siruppiddi'],
    },
    {
        'id': 'suthumalai',
        'name': 'Suthumalai',
        'latitude': Decimal('9.735000'),
        'longitude': Decimal('79.990000'),
        'aliases': ['suthumallai'],
    },
    {
        'id': 'tellippalai',
        'name': 'Tellippalai',
        'latitude': Decimal('9.781000'),
        'longitude': Decimal('80.011000'),
        'aliases': ['telippalai', 'thellippalai'],
    },
    {
        'id': 'thavady',
        'name': 'Thavady',
        'latitude': Decimal('9.704000'),
        'longitude': Decimal('80.000000'),
        'aliases': ['thavadi'],
    },
    {
        'id': 'thirunelveli',
        'name': 'Thirunelveli',
        'latitude': Decimal('9.695000'),
        'longitude': Decimal('80.033900'),
        'aliases': ['tirunelveli', 'thirunalveli', 'thirunelweli', 'thirunaveli'],
    },
    {
        'id': 'uduvil',
        'name': 'Uduvil',
        'latitude': Decimal('9.737000'),
        'longitude': Decimal('80.016000'),
        'aliases': ['uduwil'],
    },
    {
        'id': 'urumpirai',
        'name': 'Urumpirai',
        'latitude': Decimal('9.724000'),
        'longitude': Decimal('80.042000'),
        'aliases': ['urumpiray'],
    },
    {
        'id': 'vaddukoddai',
        'name': 'Vaddukoddai',
        'latitude': Decimal('9.744000'),
        'longitude': Decimal('79.952000'),
        'aliases': ['vaddukodai', 'vaddukkoddai', 'vatukottai'],
    },
    {
        'id': 'valalai',
        'name': 'Valalai',
        'latitude': Decimal('9.770000'),
        'longitude': Decimal('80.095000'),
        'aliases': [],
    },
    {
        'id': 'vasavilan',
        'name': 'Vasavilan',
        'latitude': Decimal('9.776000'),
        'longitude': Decimal('80.062000'),
        'aliases': ['vasavillan'],
    },
    {
        'id': 'vannarpannai',
        'name': 'Vannarpannai',
        'latitude': Decimal('9.673000'),
        'longitude': Decimal('80.015000'),
        'aliases': ['vannarponnai', 'vannai'],
    },
]

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
    'jaffan': 'Jaffna',
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


def normalize_area_key(value):
    text = normalize_address_text(value).lower()
    text = re.sub(r'[^a-z0-9]+', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()


def _area_distance_km(area):
    return Decimal(str(haversine_distance_km(
        RESTAURANT_LAT,
        RESTAURANT_LNG,
        area['latitude'],
        area['longitude'],
    ))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def _delivery_area_charge(area, distance_km):
    fixed_fee = SPECIAL_DELIVERY_AREA_FEES.get(area['id'])
    if fixed_fee is not None:
        return fixed_fee
    return get_delivery_charge(distance_km)


def _delivery_area_is_allowed(area, distance_km):
    return _delivery_area_charge(area, distance_km) is not None


def _serialize_delivery_area(area):
    distance_km = _area_distance_km(area)
    charge = _delivery_area_charge(area, distance_km)
    return {
        'id': area['id'],
        'name': area['name'],
        'aliases': area.get('aliases', []),
        'latitude': str(area['latitude']),
        'longitude': str(area['longitude']),
        'distance_km': float(distance_km),
        'delivery_fee': str(charge.quantize(MONEY_SCALE, rounding=ROUND_HALF_UP)) if charge else None,
        'delivery_fee_label': format_delivery_charge(charge) if charge else 'Outside delivery zone',
    }


def get_allowed_delivery_areas():
    areas = [
        _serialize_delivery_area(area)
        for area in DELIVERY_AREAS
        if _delivery_area_is_allowed(area, _area_distance_km(area))
    ]
    return sorted(areas, key=lambda item: (item['name'].lower(), item['distance_km']))


def find_delivery_area(value):
    key = normalize_area_key(value)
    if not key:
        return None

    for area in DELIVERY_AREAS:
        names = [area['id'], area['name'], *area.get('aliases', [])]
        if key in {normalize_area_key(name) for name in names}:
            return area
    return None


def resolve_delivery_area(city_area='', full_address=''):
    candidates = []
    if city_area:
        candidates.append(city_area)
    if full_address:
        candidates.extend(reversed([part.strip() for part in str(full_address).split(',') if part.strip()]))

    for candidate in candidates:
        area = find_delivery_area(candidate)
        if area:
            distance_km = _area_distance_km(area)
            if not _delivery_area_is_allowed(area, distance_km):
                raise DjangoValidationError('Sorry, this delivery area is outside our delivery zone (max 20 km).')
            return area

    raise DjangoValidationError('Please select a delivery area from the allowed areas list.')


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
    distance = Decimal(str(distance_km))
    for max_distance, charge in DELIVERY_FEE_BRACKETS:
        if distance <= max_distance:
            return charge
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
    city_area='',
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
    area = resolve_delivery_area(city_area=city_area, full_address=full_address)
    if source == LOCATION_SOURCE_CURRENT:
        lat = normalize_coordinate(latitude, 'Latitude')
        lng = normalize_coordinate(longitude, 'Longitude')
        if lat is None or lng is None:
            raise DjangoValidationError('Current location is required to calculate the delivery fee.')
    else:
        lat = area['latitude']
        lng = area['longitude']
        source = LOCATION_SOURCE_ADDRESS

    distance_km = Decimal(str(haversine_distance_km(RESTAURANT_LAT, RESTAURANT_LNG, lat, lng))).quantize(
        Decimal('0.01'),
        rounding=ROUND_HALF_UP,
    )
    delivery_fee = _delivery_area_charge(area, distance_km)
    if delivery_fee is None:
        raise DjangoValidationError('Sorry, your location is outside our delivery zone (max 20 km).')

    return {
        'delivery_fee': delivery_fee.quantize(MONEY_SCALE, rounding=ROUND_HALF_UP),
        'distance_km': distance_km,
        'label': format_delivery_charge(delivery_fee),
        'latitude': lat,
        'longitude': lng,
        'location_source': source,
    }
