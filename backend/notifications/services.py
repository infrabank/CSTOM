"""Notification system services."""

from django.core.mail import send_mail
from django.conf import settings

from .models import Notification, NotificationPreference


def create_notification(recipient, notification_type, title, content):
    """
    Create a notification for a user.

    Args:
        recipient: User object to receive the notification
        notification_type: Type of notification (must be in TYPE_CHOICES)
        title: Notification title
        content: Notification content

    Returns:
        Notification instance
    """
    notification = Notification.objects.create(
        recipient=recipient,
        type=notification_type,
        title=title,
        content=content,
    )

    # Send email if enabled in preferences
    preference = NotificationPreference.objects.filter(user=recipient).first()
    if preference and preference.email_enabled:
        send_notification_email(notification)

    return notification


def send_notification_email(notification):
    """
    Send notification via email.

    Args:
        notification: Notification instance to send
    """
    try:
        recipient = notification.recipient
        subject = f"[{notification.get_type_display()}] {notification.title}"
        message = f"{notification.content}\n\nNotification ID: {notification.id}"

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient.email],
            fail_silently=True,
        )
    except Exception as e:
        # Log error but don't raise - email sending is optional
        print(f"Failed to send notification email: {str(e)}")
