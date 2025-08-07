import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Conversation, Message } from '../types';

export function useInboxWebSocket({
  tenantId,
  onNewConversation,
  onNewMessage,
}: {
  tenantId: number | undefined;
  onNewConversation: (conv: Conversation) => void;
  onNewMessage: (msg: Message) => void;
}) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const backendHost = 'localhost:8000';
    const wsUrl = `${protocol}://${backendHost}/ws/inbox/?tenant=${tenantId}`;

    if (wsRef.current) {
      wsRef.current.close(); // close any previous connection
    }

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('✅ WebSocket connected:', wsUrl);
      setTimeout(() => {
        socket.send(JSON.stringify({ message: 'Hello from frontend!' }));
      }, 100);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📩 WS message:', data);

        if (data.type === 'new_conversation' && data.message?.conversation) {
          onNewConversation(data.message.conversation);
        } else if (data.type === 'new_message' && data.message) {
          onNewMessage(data.message);
        } else {
          console.log('ℹ️ Unknown message type:', data.type);
        }
      } catch (err) {
        console.error('❌ WS parse error:', err, event.data);
      }
    };

    socket.onerror = (e) => {
      console.error('⚠️ WebSocket error:', e);
    };

    socket.onclose = (e) => {
      console.warn(`🔌 WebSocket disconnected with code: ${e.code}`);
    };

    return () => {
      socket.close();
    };
  }, [tenantId]);
}
