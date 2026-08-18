class ImportanceScorer:

    def score(self, memory):

        text = memory.lower()

        # Identity and important personal facts
        if (
            "name" in text
            or "age" in text
            or "birthday" in text
            or "born" in text
        ):
            return 10

        # Family, pets, and relationships
        elif (
            "dog" in text
            or "pet" in text
            or "family" in text
            or "parent" in text
            or "friend" in text
            or "relationship" in text
        ):
            return 9

        # Education and career
        elif (
            "study" in text
            or "education" in text
            or "college" in text
            or "school" in text
            or "career" in text
            or "job" in text
        ):
            return 9

        # Projects and goals
        elif "project" in text:
            return 9

        elif "goal" in text:
            return 9

        # Interests, hobbies, activities, and preferences
        elif (
            "interest" in text
            or "like" in text
            or "love" in text
            or "enjoy" in text
            or "hobby" in text
            or "hobbies" in text
            or "favorite" in text
            or "activity" in text
            or "playing" in text
            or "plays" in text
        ):
            return 7

        # Devices and technology
        elif (
            "device" in text
            or "phone" in text
            or "laptop" in text
            or "computer" in text
        ):
            return 6

        # Default: temporary / low importance
        else:
            return 3