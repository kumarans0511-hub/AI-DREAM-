import psutil
import logging

logger = logging.getLogger("dream.system")


class HardwareMonitor:

    def get_battery(self):
        try:
            battery = psutil.sensors_battery()

            if battery is None:
                return {
                    "percentage": 100,
                    "charging": True
                }

            return {
                "percentage": battery.percent,
                "charging": battery.power_plugged
            }

        except Exception as e:
            logger.error(f"Battery check failed: {e}")

            return {
                "percentage": None,
                "charging": None
            }


    def get_cpu_usage(self):

        try:
            return psutil.cpu_percent(
                interval=1
            )

        except Exception as e:
            logger.error(
                f"CPU check failed: {e}"
            )

            return None


    def get_memory_usage(self):

        try:
            memory = psutil.virtual_memory()

            return memory.percent

        except Exception as e:

            logger.error(
                f"Memory check failed: {e}"
            )

            return None



    def get_system_state(self):

        battery = self.get_battery()

        return {
            "battery": battery,
            "cpu_usage": self.get_cpu_usage(),
            "memory_usage": self.get_memory_usage()
        }