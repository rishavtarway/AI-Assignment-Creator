'use client';
import { useEffect, useRef } from 'react';
import { useAssignmentStore } from '@/store/assignmentStore';
import axios from 'axios';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function useWebSocket(assignmentId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const { updateAssignmentStatus } = useAssignmentStore();

  useEffect(() => {
    mountedRef.current = true;

    function connect() {
      if (!mountedRef.current) return;

      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (assignmentId) {
            ws.send(JSON.stringify({ type: 'subscribe', assignmentId }));
          }
        };

        ws.onmessage = async (evt) => {
          if (!mountedRef.current) return;
          try {
            const msg = JSON.parse(evt.data);
            if (msg.type === 'assignment_update' && msg.assignmentId) {
              if (msg.status === 'completed') {
                const { data } = await axios.get(`${API}/api/assignments/${msg.assignmentId}`);
                if (mountedRef.current) updateAssignmentStatus(msg.assignmentId, data.data);
              } else {
                updateAssignmentStatus(msg.assignmentId, {
                  status: msg.status,
                  ...(msg.error ? { error: msg.error } : {}),
                });
              }
            }
          } catch {}
        };

        ws.onclose = () => {
          if (!mountedRef.current) return;
          reconnectRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => ws.close();
      } catch {}
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional close
        wsRef.current.close();
      }
    };
  }, [assignmentId]); // re-run when assignmentId changes

  return wsRef;
}
