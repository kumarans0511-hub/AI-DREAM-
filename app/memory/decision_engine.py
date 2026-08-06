class DecisionEngine:

    def decide(self, importance: int):

        if importance >= 9:
            return "STORE"

        elif importance >= 7:
            return "STORE"

        elif importance >= 5:
            return "REVIEW"

        elif importance >= 3:
            return "TEMPORARY"

        else:
            return "IGNORE"