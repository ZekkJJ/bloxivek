import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

interface ExtWebSocket extends WebSocket {
  guildId?: string;
  isAlive: boolean;
}

let wss: WebSocketServer;

export function initWebSocket(server: Server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: ExtWebSocket, req) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    // Expecting URL like /?guild_id=12345
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const guildId = url.searchParams.get('guild_id');
    
    if (guildId) {
      ws.guildId = guildId;
    }

    ws.on('message', (message) => {
      // Handle incoming messages if needed
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const extWs = ws as ExtWebSocket;
      if (!extWs.isAlive) return extWs.terminate();
      extWs.isAlive = false;
      extWs.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });
}

export function broadcastToGuild(guildId: string, eventType: string, payload: any) {
  if (!wss) return;
  
  const message = JSON.stringify({ type: eventType, payload });
  
  wss.clients.forEach((client) => {
    const extWs = client as ExtWebSocket;
    if (extWs.readyState === WebSocket.OPEN && extWs.guildId === guildId) {
      extWs.send(message);
    }
  });
}
