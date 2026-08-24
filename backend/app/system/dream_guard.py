import logging

from .hardware_monitor import HardwareMonitor
from .activity_monitor import ActivityMonitor


logger = logging.getLogger(
    "dream.system"
)



class DreamGuard:


    def __init__(self):

        self.hardware = HardwareMonitor()

        self.activity = ActivityMonitor()



    def check(self):

        hardware_state = (
            self.hardware
            .get_system_state()
        )


        idle_time = (
            self.activity
            .get_idle_minutes()
        )


        battery = hardware_state["battery"]


        reasons = []


        ready = True



        # Battery check

        if (
            battery["percentage"]
            and
            battery["percentage"] < 30
            and
            not battery["charging"]
        ):

            ready = False

            reasons.append(
                "Battery too low"
            )



        # CPU check

        cpu = hardware_state["cpu_usage"]

        if cpu and cpu > 80:

            ready = False

            reasons.append(
                "High CPU usage"
            )



        # User activity check

        if idle_time < 20:

            ready = False

            reasons.append(
                "User is active"
            )



        return {

            "ready": ready,

            "score":
                self.calculate_score(
                    hardware_state,
                    idle_time
                ),

            "hardware":
                hardware_state,

            "idle_minutes":
                idle_time,

            "reasons":
                reasons
        }



    def calculate_score(
        self,
        hardware,
        idle
    ):

        score = 100


        battery = hardware["battery"][
            "percentage"
        ]


        cpu = hardware["cpu_usage"]



        if battery < 30:

            score -= 20


        if cpu > 70:

            score -= 20


        if idle < 20:

            score -= 30



        return max(
            score,
            0
        )