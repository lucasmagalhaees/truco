/* The room server, on Cloudflare: a Worker that sends each room code to its own Durable Object, and the Durable Object
   that keeps that room. All the rules are the core's (src/core/online.ts): this file only moves messages, saves the
   room, tells every phone its own view and wakes the computer players up with an alarm.
   WebSocket Hibernation: while nobody moves, the object sleeps and is not billed; the room is read back from storage
   on every wake. Deployed by .github/workflows/salas.yml (wrangler.toml at the root). */
import { DurableObject } from 'cloudflare:workers';
import { Core } from '../src/core';
import type { Bucket, Room as RoomState } from '../src/core';

interface Env { ROOMS: DurableObjectNamespace<Room> }
/** What each connection carries through hibernation: its room, its person once they joined, and its message allowance. */
interface Tag { code: string; token: string | null; bucket?: Bucket }
/** A room with nobody connected is forgotten after this long. */
const IDLE_FORGET = 24 * 60 * 60e3;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url), m = url.pathname.match(/^\/salas\/([A-Z0-9]+)$/);
    if (url.pathname === '/') return new Response('truco: servidor de salas no ar', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    if (!m || !Core.isCode(m[1])) return new Response('sala não encontrada', { status: 404 });
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('a sala só fala por WebSocket', { status: 426 });
    return env.ROOMS.get(env.ROOMS.idFromName(m[1])).fetch(req);
  }
};

export class Room extends DurableObject<Env> {
  async fetch(req: Request): Promise<Response> {
    const code = new URL(req.url).pathname.split('/').pop() as string;
    if (Core.roomFull(this.ctx.getWebSockets().length)) return new Response('sala cheia de conexões', { status: 429 });
    const pair = new WebSocketPair(), [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ code, token: null, bucket: Core.newBucket(Date.now()) } satisfies Tag);
    return new Response(null, { status: 101, webSocket: client });
  }

  private async load(code: string): Promise<RoomState> {
    return Core.readRoom(await this.ctx.storage.get('room')) ?? Core.newRoom(code);
  }
  private async save(room: RoomState): Promise<void> {
    await this.ctx.storage.put('room', room);
    await this.ctx.storage.put('seen', Date.now());
  }
  /** Every phone gets the room as its person sees it. */
  private tell(room: RoomState): void {
    for (const ws of this.ctx.getWebSockets()) {
      const tag = ws.deserializeAttachment() as Tag, view = tag.token ? Core.roomView(room, tag.token) : null;
      if (view) try { ws.send(JSON.stringify(view)); } catch (e) { /* that phone is gone; its close event follows */ }
    }
  }
  /** The next computer move, or forgetting the room once nobody is left in it. */
  private async later(room: RoomState): Promise<void> {
    const d = Core.aiDelay(room);
    await this.ctx.storage.setAlarm(Date.now() + (d ?? IDLE_FORGET));
  }

  async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data).length : data.byteLength;
    if (Core.tooBig(bytes)) { ws.close(Core.CLOSE_BIG, 'mensagem grande demais'); return; }
    const tag = ws.deserializeAttachment() as Tag, step = Core.allow(tag.bucket ?? Core.newBucket(Date.now()), Date.now()); // connections from before the limits have no bucket
    tag.bucket = step.bucket; ws.serializeAttachment(tag);
    if (!step.ok) { ws.close(Core.CLOSE_FAST, 'mensagens demais'); return; }
    const msg = Core.readMsg(typeof data === 'string' ? data : new TextDecoder().decode(data));
    if (!msg) { ws.send(JSON.stringify({ t: 'error', why: 'Mensagem desconhecida.' })); return; }
    if (msg.t === 'join') { tag.token = msg.token; ws.serializeAttachment(tag); }
    if (!tag.token) { ws.send(JSON.stringify({ t: 'error', why: 'Entre na sala primeiro.' })); return; }
    const room = await this.load(tag.code), out = Core.handle(room, tag.token, msg, Math.random);
    if (out.error) ws.send(JSON.stringify({ t: 'error', why: out.error }));
    if (out.room === room) { const v = Core.roomView(room, tag.token); if (v) ws.send(JSON.stringify(v)); return; }
    await this.save(out.room);
    this.tell(out.room);
    await this.later(out.room);
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const tag = ws.deserializeAttachment() as Tag;
    if (!tag.token) return;
    // the same person may have another phone (or a new tab) still connected
    const still = this.ctx.getWebSockets().some(o => o !== ws && (o.deserializeAttachment() as Tag).token === tag.token);
    if (still) return;
    const room = await this.load(tag.code), out = Core.handle(room, tag.token, { t: 'leave' }, Math.random);
    if (out.room === room) return;
    await this.save(out.room);
    this.tell(out.room);
    await this.later(out.room);
  }
  async webSocketError(ws: WebSocket): Promise<void> { await this.webSocketClose(ws); }

  async alarm(): Promise<void> {
    const raw = await this.ctx.storage.get('room'), room = Core.readRoom(raw);
    if (!room) return;
    if (!this.ctx.getWebSockets().length && Date.now() - ((await this.ctx.storage.get<number>('seen')) ?? 0) >= IDLE_FORGET) { await this.ctx.storage.deleteAll(); return; }
    if (Core.aiDelay(room) === null) { await this.later(room); return; }
    const next = Core.aiStep(room, Math.random);
    await this.save(next);
    this.tell(next);
    await this.later(next);
  }
}
