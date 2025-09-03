from openai import OpenAI
from django.conf import settings

class AIService:
    """
    Backend AI service wrapper.
    Handles conversation context and OpenAI API calls.
    """
    def __init__(self):
        # Use Django settings or hardcode your key
        self.client = OpenAI(api_key=getattr(settings, "OPENAI_API_KEY", "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"))

    def generate_reply(self, conversation_messages, settings_dict):
        """
        Generate an AI reply based on conversation history and settings.

        Args:
            conversation_messages (list[str]): All messages in the conversation.
            settings_dict (dict): Settings like {"tone": "professional", "length": "medium"}.

        Returns:
            dict: Structured AI reply with content, confidence, suggestions, and reasoning.
        """
        tone = settings_dict.get("tone", "professional")
        length = settings_dict.get("length", "medium")

        # Build conversation context
        conversation_text = "\n".join(
            [f"Customer: {msg}" for msg in conversation_messages]
        )

        prompt = f"""
        You are a helpful customer support AI. Reply professionally.

        Conversation context:
        {conversation_text}

        Requirements:
        - Tone: {tone}
        - Length: {length}
        - Provide a concise and helpful response.
        """

        # Call OpenAI API
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",  # or "gpt-4o"
            messages=[
                {"role": "system", "content": "You are a helpful customer support assistant."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=300,
            temperature=0.5,
        )

        content = response.choices[0].message.content.strip()

        return {
            "id": f"ai-reply-{response.id}",
            "content": content,
            "confidence": 0.95,
            "suggestions": [
                "Add a personal touch by mentioning their name",
                "Include a follow-up question to ensure satisfaction",
            ],
            "reasoning": "Generated based on full conversation context with requested tone and length.",
        }


