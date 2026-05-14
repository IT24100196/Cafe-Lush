import base64
from email.mime.base import MIMEBase

import requests
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.mail.backends.base import BaseEmailBackend


def _clean_setting(value):
    return str(value or '').strip().strip('"').strip("'")


class ResendEmailBackend(BaseEmailBackend):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.api_key = _clean_setting(getattr(settings, 'RESEND_API_KEY', ''))
        self.api_url = _clean_setting(
            getattr(settings, 'RESEND_API_URL', 'https://api.resend.com/emails')
        ) or 'https://api.resend.com/emails'
        self.timeout = getattr(settings, 'EMAIL_TIMEOUT', 10)

    def open(self):
        return True

    def close(self):
        return None

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        if not self.api_key:
            raise ImproperlyConfigured(
                'RESEND_API_KEY is required when using the Resend email backend.'
            )

        sent = 0
        for message in email_messages:
            try:
                if self._send(message):
                    sent += 1
            except Exception:
                if not self.fail_silently:
                    raise
        return sent

    def _send(self, message):
        if not message.recipients():
            return False

        payload = self._build_payload(message)
        response = requests.post(
            self.api_url,
            headers={
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json',
                'User-Agent': 'Cafe-Lush/1.0',
            },
            json=payload,
            timeout=self.timeout,
        )
        if response.status_code >= 400:
            raise RuntimeError(
                f'Resend email failed: {response.status_code} {response.text}'
            )
        return True

    def _build_payload(self, message):
        to_list = list(getattr(message, 'to', None) or [])
        cc_list = list(getattr(message, 'cc', None) or [])
        bcc_list = list(getattr(message, 'bcc', None) or [])
        recipients = list(message.recipients() or [])

        if not to_list and recipients:
            to_list = recipients[:1]
            leftovers = recipients[1:]
            if leftovers:
                bcc_list.extend(leftovers)

        payload = {
            'from': message.from_email or settings.DEFAULT_FROM_EMAIL,
            'to': to_list,
            'subject': message.subject or '',
        }

        if cc_list:
            payload['cc'] = cc_list
        if bcc_list:
            payload['bcc'] = bcc_list

        reply_to = list(getattr(message, 'reply_to', None) or [])
        if reply_to:
            payload['reply_to'] = reply_to

        html_body, text_body = self._extract_bodies(message)
        if html_body is not None:
            payload['html'] = html_body
        if text_body is not None:
            payload['text'] = text_body
        if 'html' not in payload and 'text' not in payload:
            payload['text'] = ''

        extra_headers = {
            key: value
            for key, value in getattr(message, 'extra_headers', {}).items()
            if key and value and key.lower() not in {'content-type', 'mime-version'}
        }
        if extra_headers:
            payload['headers'] = extra_headers

        attachments = self._extract_attachments(message)
        if attachments:
            payload['attachments'] = attachments

        return payload

    def _extract_bodies(self, message):
        html_body = None
        text_body = None

        if getattr(message, 'content_subtype', 'plain') == 'html':
            html_body = message.body
        else:
            text_body = message.body

        for alternative in getattr(message, 'alternatives', []):
            content = getattr(alternative, 'content', None)
            mimetype = getattr(alternative, 'mimetype', None)
            if content is None and isinstance(alternative, (list, tuple)) and len(alternative) >= 2:
                content, mimetype = alternative[0], alternative[1]

            if mimetype == 'text/html' and html_body is None:
                html_body = content
            elif mimetype == 'text/plain' and text_body is None:
                text_body = content

        return html_body, text_body

    def _extract_attachments(self, message):
        attachments = []
        for attachment in getattr(message, 'attachments', []):
            if isinstance(attachment, MIMEBase):
                filename = attachment.get_filename() or 'attachment'
                content = attachment.get_payload(decode=True) or b''
                entry = {
                    'filename': filename,
                    'content': base64.b64encode(content).decode('ascii'),
                }
                content_id = attachment.get('Content-ID')
                if content_id:
                    entry['contentId'] = content_id.strip('<>')
                attachments.append(entry)
                continue

            filename = getattr(attachment, 'filename', None)
            content = getattr(attachment, 'content', None)
            if filename is None and isinstance(attachment, (list, tuple)) and len(attachment) >= 2:
                filename, content = attachment[0], attachment[1]

            if filename is None:
                continue

            if isinstance(content, str):
                content = content.encode('utf-8')
            elif content is None:
                content = b''

            attachments.append({
                'filename': filename,
                'content': base64.b64encode(content).decode('ascii'),
            })

        return attachments
