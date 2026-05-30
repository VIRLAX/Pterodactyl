import type { Response } from "express";

interface SSEClient {
  res: Response;
  userId: number;
}

const clients = new Set<SSEClient>();

export function addSSEClient(res: Response, userId: number): () => void {
  const client: SSEClient = { res, userId };
  clients.add(client);
  return () => clients.delete(client);
}

export function broadcast(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.res.write(payload);
    } catch {
      clients.delete(client);
    }
  }
}

export function getClientCount(): number {
  return clients.size;
}
