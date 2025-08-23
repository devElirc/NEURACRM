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
        conversation_messages: list of all messages (strings)
        settings_dict: {tone: 'professional', length: 'medium'}
        """
        tone = settings_dict.get('tone', 'professional')
        length = settings_dict.get('length', 'medium')

        # Build conversation context
        conversation_text = "\n".join([f"Customer: {msg}" for msg in conversation_messages])
        prompt = f"""
You are a helpful customer support AI. Reply professionally.
Conversation context:
{conversation_text}

Requirements:
- Tone: {tone}
- Length: {length}
- Provide a concise and helpful response
"""

        # Call new API
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
            "reasoning": "Generated based on full conversation context with requested tone and length."
        }
