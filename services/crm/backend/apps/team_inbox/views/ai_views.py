from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..services.ai_service import AIService
from ..models import Message

ai_service = AIService()

class AIReplyView(APIView):
    """
    Generate AI reply for a conversation.
    """

    def post(self, request, *args, **kwargs):
        conversation_id = request.data.get("conversation_id")
        settings_dict = request.data.get("settings", {"tone": "professional", "length": "medium"})

        if not conversation_id:
            return Response(
                {"error": "conversation_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        messages_qs = Message.objects.filter(conversation_id=conversation_id).order_by("timestamp")
        conversation_messages = [m.content for m in messages_qs]

        if not conversation_messages:
            return Response(
                {"error": "No messages found for this conversation"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            ai_response = ai_service.generate_reply(conversation_messages, settings_dict)
            return Response(ai_response, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
