import time
import logging


logger = logging.getLogger(
    "dream.system"
)


class ActivityMonitor:

    def __init__(self):

        self.last_activity = time.time()


    def update_activity(self):

        self.last_activity = time.time()



    def get_idle_minutes(self):

        try:

            seconds = (
                time.time()
                -
                self.last_activity
            )

            return round(
                seconds / 60,
                2
            )

        except Exception as e:

            logger.error(
                f"Idle check failed: {e}"
            )

            return 0