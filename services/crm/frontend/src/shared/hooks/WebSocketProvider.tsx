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
  ready: boolean;
};

const WSContext = createContext<WSContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { tenant, user } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const listeners = useRef<((data: any) => void)[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tenant?.id || !user?.id) return;

const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const backendHost = window.location.host; // ? always use current host

console.log("?? window.location", window.location);
console.log("?? Backend host:", backendHost);

const wsUrl = `${protocol}://${backendHost}/ws/inbox/?tenant=${tenant.id}&user_id=${user.id}`;
console.log("?? Connecting WebSocket to:", wsUrl);

ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setReady(true);
      console.log("? WebSocket connected");
    };

    ws.current.onclose = (event) => {
      console.warn(`? WebSocket disconnected (code: ${event.code})`);
      setReady(false);
    };

    ws.current.onerror = (error) => {
      console.error("?? WebSocket error:", error);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("?? Incoming WS message:", data);
        listeners.current.forEach((cb) => cb(data));
      } catch (err) {
        console.error("? Failed to parse WS:", err, event.data);
      }
    };

    return () => {
      console.log("?? Closing WebSocket connection");
      ws.current?.close();
      ws.current = null;
      setReady(false);
    };
  }, [tenant?.id, user?.id]);

  const addListener = (callback: (data: any) => void) => {
    listeners.current.push(callback);
    return () => {
      listeners.current = listeners.current.filter((cb) => cb !== callback);
    };
  };

  return (
    <WSContext.Provider value={{ ws, addListener, ready }}>
      {children}
    </WSContext.Provider>
  );
};

export function useWS() {
  const ctx = useContext(WSContext);
  if (!ctx) throw new Error("useWS must be used inside WebSocketProvider");
  return ctx;
}
