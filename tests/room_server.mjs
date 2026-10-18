// A room server on this machine, for the tests: the same core (src/core/online.ts) and the same messages as the one on
// Cloudflare (server/worker.ts), over a plain WebSocket server. The Cloudflare one adds only storage and alarms.
//   node tests/room_server.mjs [port] [think-ms]     prints "salas em ws://127.0.0.1:<port>" once it listens
// think-ms fixes how long the computer players think (default: the core's ROOM_THINK and ROOM_ROUND_PAUSE).
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
const rooms = new Map();                       // code -> { room, sockets: Set<ws>, timer }
const send = (ws, x) => { try { ws.send(JSON.stringify(x)); } catch (e) { /* gone */ } };
function tell(r) { for (const ws of r.sockets) { const v = ws.token ? Core.roomView(r.room, ws.token) : null; if (v) send(ws, v); } }
function later(r) {
  clearTimeout(r.timer);
  const d = Core.aiDelay(r.room);
  if (d === null) return;
  r.timer = setTimeout(() => { r.room = Core.aiStep(r.room, Math.random); tell(r); later(r); }, think ?? d);
}

const server = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }); res.end('truco: servidor de salas no ar'); });
const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (req, socket, head) => {
  const m = (req.url || '').match(/^\/salas\/([A-Z0-9]+)$/);
  if (!m || !Core.isCode(m[1])) { socket.write('HTTP/1.1 404 Not Found\r\n\r\n'); socket.destroy(); return; }
  const code = m[1], r = rooms.get(code) || { room: Core.newRoom(code), sockets: new Set(), timer: null };
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
      const out = Core.handle(r.room, ws.token, msg, Math.random);
      if (out.error) send(ws, { t: 'error', why: out.error });
      if (out.room === r.room) { const v = Core.roomView(r.room, ws.token); if (v) send(ws, v); return; }
      r.room = out.room; tell(r); later(r);
    });
    ws.on('close', () => {
      r.sockets.delete(ws);
      if (!ws.token || [...r.sockets].some(o => o.token === ws.token)) return;
      const out = Core.handle(r.room, ws.token, { t: 'leave' }, Math.random);
      if (out.room !== r.room) { r.room = out.room; tell(r); later(r); }
    });
  });
});
server.listen(port, '127.0.0.1', () => console.log(`salas em ws://127.0.0.1:${server.address().port}`));
