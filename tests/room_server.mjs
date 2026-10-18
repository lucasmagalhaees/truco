// A room server on this machine, for the tests: the same core (src/core/online.ts) and the same messages as the one on
// Cloudflare (server/worker.ts), over a plain WebSocket server. The Cloudflare one adds only storage and alarms.
//   node tests/room_server.mjs [port] [think-ms]     prints "salas em ws://127.0.0.1:<port>" once it listens
// think-ms fixes how long the computer players think (default: the core's ROOM_THINK and ROOM_ROUND_PAUSE).
// With HIBERNATE=1 the room is never kept as an object between two events: it is written out as JSON after every change
// and read back with Core.readRoom before every message, close and computer move, as the Durable Object does when it
// sleeps and wakes. A saved room that readRoom refuses stops this server, so the test fails loudly.
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';
import { WebSocketServer } from 'ws';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'tests', '.build', 'room');
await build({ root, configFile: false, logLevel: 'silent', build: { outDir, emptyOutDir: true, minify: false, target: 'node22', lib: { entry: path.join(root, 'src', 'core', 'index.ts'), formats: ['es'], fileName: () => 'core.mjs' } } });
const { Core } = await import(pathToFileURL(path.join(outDir, 'core.mjs')).href);

const port = Number(process.argv[2] || 0), think = process.argv[3] !== undefined ? Number(process.argv[3]) : null;
const HIBERNATE = process.env.HIBERNATE === '1';
const rooms = new Map();                       // code -> { saved | room, sockets: Set<ws>, timer }
/** The room as it is now: the object itself, or (sleeping) read back from what was saved, like worker.ts's load. */
function load(r, code) {
  if (!HIBERNATE) return r.room;
  if (r.saved === undefined) return Core.newRoom(code);
  const room = Core.readRoom(JSON.parse(r.saved));
  if (!room) { console.error(`readRoom refused the saved room ${code}: ${r.saved}`); process.exit(2); }
  return room;
}
/** Keep the room: as it is, or (sleeping) only as JSON, like worker.ts's save. */
function save(r, room) { if (HIBERNATE) r.saved = JSON.stringify(room); else r.room = room; }
const send = (ws, x) => { try { ws.send(JSON.stringify(x)); } catch (e) { /* gone */ } };
function tell(r, room) { for (const ws of r.sockets) { const v = ws.token ? Core.roomView(room, ws.token) : null; if (v) send(ws, v); } }
/** Save, tell every phone, and set the next computer move (the worker's alarm, which reads the room back too). */
function changed(r, room) {
  save(r, room); tell(r, room);
  clearTimeout(r.timer);
  const d = Core.aiDelay(room);
  if (d === null) return;
  r.timer = setTimeout(() => {
    const now = load(r, r.code);
    if (Core.aiDelay(now) === null) return;
    changed(r, Core.aiStep(now, Math.random));
  }, think ?? d);
}

const server = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }); res.end('truco: servidor de salas no ar'); });
const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (req, socket, head) => {
  const m = (req.url || '').match(/^\/salas\/([A-Z0-9]+)$/);
  if (!m || !Core.isCode(m[1])) { socket.write('HTTP/1.1 404 Not Found\r\n\r\n'); socket.destroy(); return; }
  const code = m[1], r = rooms.get(code) || { code, room: Core.newRoom(code), sockets: new Set(), timer: null };
  if (Core.roomFull(r.sockets.size)) { socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n'); socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, ws => {
    rooms.set(code, r); r.sockets.add(ws); ws.token = null; ws.bucket = Core.newBucket(Date.now());
    ws.on('message', data => {
      // the same limits as server/worker.ts, before the rules see anything
      if (Core.tooBig(data.length)) return ws.close(Core.CLOSE_BIG, 'mensagem grande demais');
      const step = Core.allow(ws.bucket, Date.now()); ws.bucket = step.bucket;
      if (!step.ok) return ws.close(Core.CLOSE_FAST, 'mensagens demais');
      const msg = Core.readMsg(String(data));
      if (!msg) return send(ws, { t: 'error', why: 'Mensagem desconhecida.' });
      if (msg.t === 'join') ws.token = msg.token;
      if (!ws.token) return send(ws, { t: 'error', why: 'Entre na sala primeiro.' });
      const room = load(r, code), out = Core.handle(room, ws.token, msg, Math.random);
      if (out.error) send(ws, { t: 'error', why: out.error });
      if (out.room === room) { const v = Core.roomView(room, ws.token); if (v) send(ws, v); return; }
      changed(r, out.room);
    });
    ws.on('close', () => {
      r.sockets.delete(ws);
      if (!ws.token || [...r.sockets].some(o => o.token === ws.token)) return;
      const room = load(r, code), out = Core.handle(room, ws.token, { t: 'leave' }, Math.random);
      if (out.room !== room) changed(r, out.room);
    });
  });
});
server.listen(port, '127.0.0.1', () => console.log(`salas em ws://127.0.0.1:${server.address().port}${HIBERNATE ? ' (hibernando)' : ''}`));
