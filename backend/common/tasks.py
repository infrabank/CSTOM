from celery import shared_task


@shared_task
def hello_world():
    """Test task to verify Celery setup."""
    return "Hello from Celery!"
