from django.core.management.base import BaseCommand

from hotel_pos_backend.media_utils import sync_seed_media


class Command(BaseCommand):
    help = 'Copy bundled media files into MEDIA_ROOT for production deployments.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--overwrite',
            action='store_true',
            help='Replace existing files in MEDIA_ROOT.',
        )

    def handle(self, *args, **options):
        copied = sync_seed_media(skip_existing=not options['overwrite'])
        self.stdout.write(self.style.SUCCESS(f'Synced {copied} media file(s).'))
