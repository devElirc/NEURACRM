import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "../../auth/AuthProvider";

type WSContextType = {
  ws: React.MutableRefObject<WebSocket | null>;
  addListener: (callback: (data: any) => void) => () => void;
};

const WSContext = createContext<WSContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { tenant, user } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const hasConnected = useRef(false);
  const listeners = useRef<((data: any) => void)[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tenant?.id) return;
    if (hasConnected.current) return;

    hasConnected.current = true;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const isDev = import.meta.env.MODE === "development";

    const backendHost = isDev ? "127.0.0.1:8000" : window.location.host;

    const wsUrl = `${protocol}://${backendHost}/ws/inbox/?tenant=${tenant.id}&user_id=${user?.id}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setReady(true);

      setTimeout(() => {
        ws.current?.send(
          JSON.stringify({ message: "Hello from frontend!" })
        );
      }, 100);
    };

    ws.current.onclose = (event) => {
      console.warn(`❌ WebSocket disconnected (code: ${event.code})`);
      setReady(false);
      hasConnected.current = false;
    };

    ws.current.onerror = (error) => {
      console.error("⚠️ WebSocket error:", error);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 Incoming WS message:", data);

        listeners.current.forEach((cb) => cb(data)); // broadcast
      } catch (err) {
        console.error("❌ Failed to parse WebSocket:", err, event.data);
      }
    };

    return () => {
      console.log("🔌 Closing WebSocket connection");
      ws.current?.close();
      ws.current = null;
      hasConnected.current = false;
      setReady(false);
    };
  }, [tenant?.id]);

  const addListener = (callback: (data: any) => void) => {
    listeners.current.push(callback);
    return () => {
      listeners.current = listeners.current.filter((cb) => cb !== callback);
    };
  };

  return (
    <WSContext.Provider value={{ ws, addListener }}>
      {children}
    </WSContext.Provider>
  );
};

export function useWS() {
  const ctx = useContext(WSContext);
  if (!ctx) throw new Error("useWS must be used inside WebSocketProvider");
  return ctx;
}
