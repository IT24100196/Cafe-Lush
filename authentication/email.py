from django.core.mail import send_mail


def send_transactional_email(subject, message, recipient_list):
    return send_mail(
        subject=subject,
        message=message,
        from_email=None,
        recipient_list=recipient_list,
        fail_silently=False,
    )
