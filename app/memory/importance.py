class ImportanceScorer:

    def score(self, memory):

        text = memory.lower()

        if "name" in text:
            return 10

        elif "study" in text or "education" in text:
            return 9

        elif "project" in text:
            return 9

        elif "goal" in text:
            return 9

        elif "interest" in text or "like" in text:
            return 7

        elif "device" in text:
            return 6

        else:
            return 3