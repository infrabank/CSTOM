import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cstom.settings")

app = Celery("cstom")

app.config_from_object("django.conf:settings", namespace="CELERY")

app.autodiscover_tasks()

# Celery Beat schedule for periodic tasks
app.conf.beat_schedule = {
    "generate-inspection-tasks-daily": {
        "task": "inspections.tasks.generate_inspection_tasks",
        "schedule": crontab(hour=0, minute=0),  # Run daily at 00:00
    },
    "send-inspection-reminders-daily": {
        "task": "inspections.tasks.send_inspection_reminders",
        "schedule": crontab(hour=9, minute=0),  # Run daily at 09:00
    },
    "check-sla-violations-hourly": {
        "task": "sla.tasks.check_sla_violations",
        "schedule": crontab(minute=0),  # Run every hour at :00
    },
}


@app.task(bind=True)
def debug_task(self):
    print(f"Request: {self.request!r}")
