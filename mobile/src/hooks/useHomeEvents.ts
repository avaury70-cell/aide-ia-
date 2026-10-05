import { useEffect, useRef } from "react";

import type { HomeEvent } from "../api/types";
import { WS_URL } from "../config";
import { useAuth } from "../context/AuthContext";

/** S'abonne au flux temps réel du backend, avec reconnexion automatique. */
export function useHomeEvents(onEvent: (event: HomeEvent) => void) {
  const { token } = useAuth();
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    if (!token) return;
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let delay = 1000;
    let closed = false;

    const connect = () => {
      socket = new WebSocket(`${WS_URL}/ws?token=${encodeURIComponent(token)}`);
      socket.onopen = () => {
        delay = 1000;
      };
      socket.onmessage = (msg) => {
        try {
          handler.current(JSON.parse(String(msg.data)) as HomeEvent);
        } catch {
          // message illisible ignoré
        }
      };
      socket.onclose = () => {
        if (closed) return;
        retry = setTimeout(connect, delay);
        delay = Math.min(delay * 2, 30000);
      };
    };
    connect();

    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  }, [token]);
}
