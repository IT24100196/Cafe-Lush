from pathlib import Path
from shutil import copy2

from django.conf import settings


def build_existing_media_url(field_file, request=None):
    if not field_file:
        return None

    try:
        if not field_file.storage.exists(field_file.name):
            return None
        url = field_file.url
    except Exception:
        return None

    return request.build_absolute_uri(url) if request else url


def sync_seed_media(*, skip_existing=True):
    source_root = Path(getattr(settings, 'MEDIA_SEED_ROOT', settings.BASE_DIR / 'media')).resolve()
    target_root = Path(settings.MEDIA_ROOT).resolve()

    if source_root == target_root or not source_root.exists():
        return 0

    copied = 0
    for source_path in source_root.rglob('*'):
        if not source_path.is_file():
            continue

        relative_path = source_path.relative_to(source_root)
        target_path = target_root / relative_path
        if skip_existing and target_path.exists():
            continue

        target_path.parent.mkdir(parents=True, exist_ok=True)
        copy2(source_path, target_path)
        copied += 1

    return copied
