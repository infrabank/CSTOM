"""
Email utility functions for sending notifications.

Supports both plain text and HTML emails with template rendering.
Uses Django's email backend configured via environment variables.
"""

import logging
from typing import Optional

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_notification_email(
    recipient: str,
    subject: str,
    body: str,
    html_template: Optional[str] = None,
    context: Optional[dict] = None,
) -> bool:
    """
    Send a notification email to a recipient.

    Args:
        recipient: Email address of the recipient
        subject: Email subject line
        body: Plain text email body
        html_template: Optional path to HTML template (e.g., 'emails/notification.html')
        context: Optional context dict for template rendering

    Returns:
        True if email sent successfully, False otherwise

    Example:
        send_notification_email(
            recipient='user@example.com',
            subject='Welcome to CSTOM',
            body='Welcome to our platform!',
            html_template='emails/welcome.html',
            context={'user_name': 'John'}
        )
    """
    try:
        email = EmailMultiAlternatives(
            subject=subject,
            body=body,
            from_email=None,  # Uses DEFAULT_FROM_EMAIL from settings
            to=[recipient],
        )

        # Attach HTML version if template provided
        if html_template and context is not None:
            try:
                html_content = render_to_string(html_template, context)
                email.attach_alternative(html_content, "text/html")
            except Exception as e:
                logger.warning(
                    f"Failed to render HTML template {html_template}: {str(e)}"
                )

        email.send(fail_silently=False)
        logger.info(f"Email sent successfully to {recipient}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {recipient}: {str(e)}")
        return False


def send_bulk_notification_email(
    recipients: list[str],
    subject: str,
    body: str,
    html_template: Optional[str] = None,
    context: Optional[dict] = None,
) -> tuple[int, int]:
    """
    Send notification emails to multiple recipients.

    Args:
        recipients: List of email addresses
        subject: Email subject line
        body: Plain text email body
        html_template: Optional path to HTML template
        context: Optional context dict for template rendering

    Returns:
        Tuple of (successful_count, failed_count)
    """
    successful = 0
    failed = 0

    for recipient in recipients:
        if send_notification_email(recipient, subject, body, html_template, context):
            successful += 1
        else:
            failed += 1

    logger.info(
        f"Bulk email sent: {successful} successful, {failed} failed out of {len(recipients)}"
    )
    return successful, failed
