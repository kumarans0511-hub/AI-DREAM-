import threading
import time
from datetime import datetime


class DreamScheduler:
    """
    Background scheduler for orchestrating periodic and on-demand dream cycles
    using MemoryDreamer.
    """

    def __init__(
        self,
        dreamer,
        interval_seconds: int = 3600,
        dry_run: bool = True
    ):
        """
        Initialize the DreamScheduler.

        :param dreamer: An instance of MemoryDreamer.
        :param interval_seconds: Time between automated background dream cycles in seconds (default: 3600).
        :param dry_run: Default safety mode for dream cycles (default: True).
        """
        self.dreamer = dreamer
        self.interval_seconds = interval_seconds
        self.dry_run = dry_run

        self._thread = None
        self._stop_event = threading.Event()
        self.last_run_time = None
        self.last_result = None

    # =========================================================================
    # BACKGROUND WORKER LOOP
    # =========================================================================
    def _worker_loop(self):
        """
        Internal loop executed by the daemon background thread.
        Waits for interval_seconds between cycles until stopped.
        """
        while not self._stop_event.is_set():
            # Wait for interval_seconds or until stop_event is triggered
            stopped = self._stop_event.wait(self.interval_seconds)
            if stopped:
                break

            # Execute scheduled dream cycle
            try:
                self.trigger_now(dry_run=self.dry_run)
            except Exception as e:
                print(f"[DreamScheduler] Background dream cycle error: {e}")

    # =========================================================================
    # LIFECYCLE CONTROL
    # =========================================================================
    def start(self):
        """
        Start the background scheduler thread in daemon mode.
        If already running, does nothing.
        """
        if self._thread is not None and self._thread.is_alive():
            return

        self._stop_event.clear()
        self._thread = threading.Thread(
            target=self._worker_loop,
            name="DreamSchedulerThread",
            daemon=True
        )
        self._thread.start()

    def stop(self):
        """
        Signal the background thread to stop cleanly.
        """
        if self._thread is None:
            return

        self._stop_event.set()
        if self._thread.is_alive():
            self._thread.join(timeout=2.0)
        self._thread = None

    # =========================================================================
    # ON-DEMAND EXECUTION & STATUS
    # =========================================================================
    def trigger_now(self, dry_run: bool = None) -> dict:
        """
        Immediately execute a single dream cycle on-demand.

        :param dry_run: Optional override for the dry_run setting.
        :return: Structured result dictionary from MemoryDreamer.
        """
        is_dry_run = self.dry_run if dry_run is None else dry_run

        try:
            result = self.dreamer.run_dream_cycle(dry_run=is_dry_run)
        except Exception as e:
            result = {
                "status": "error",
                "error": str(e),
                "dry_run": is_dry_run
            }

        self.last_run_time = datetime.now().isoformat()
        self.last_result = result

        return result

    def get_status(self) -> dict:
        """
        Return the current operational status of the scheduler.
        """
        is_running = bool(self._thread is not None and self._thread.is_alive())

        return {
            "is_running": is_running,
            "interval_seconds": self.interval_seconds,
            "dry_run": self.dry_run,
            "last_run_time": self.last_run_time,
            "last_result": self.last_result
        }
