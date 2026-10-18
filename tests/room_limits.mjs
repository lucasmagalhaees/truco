// The room server's limits against abuse, over a real socket: starts tests/room_server.mjs on this machine (the same
// core limits as server/worker.ts) and checks that a message too big and a flood are cut, that a room stops taking
// connections at CONN_MAX, and that a person playing normally is never cut.
//   node tests/room_limits.mjs
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import WebSocket from 'ws';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srv = spawn(process.execPath, [path.join(root, 'tests', 'room_server.mjs'), '0', '50'], { stdio: ['ignore', 'pipe', 'inherit'] });
const base = await new Promise((ok, no) => {
  let buf = '';
  srv.stdout.on('data', d => { buf += d; const m = buf.match(/salas em (ws:\/\/\S+)/); if (m) ok(m[1]); });
  srv.on('exit', c => no(new Error(`room server exited (${c})`)));
  setTimeout(() => no(new Error('room server did not start')), 60000);
});
// the limits come from the core the server just built, not from numbers copied here
const { Core: LIMITS } = await import(pathToFileURL(path.join(root, 'tests', '.build', 'room', 'core.mjs')).href);

const fails = []; let n = 0;
const check = (name, ok, got) => { n++; if (!ok) fails.push(`${name}: ${got}`); };
const open = code => new Promise((ok, no) => {
  const ws = new WebSocket(`${base}/salas/${code}`);
  ws.once('open', () => ok(ws)); ws.once('unexpected-response', (q, res) => no(new Error(String(res.statusCode)))); ws.once('error', no);
});
const closed = ws => new Promise(ok => { if (ws.readyState === WebSocket.CLOSED) ok(null); ws.once('close', c => ok(c)); setTimeout(() => ok('still open'), 3000); });
const join = (ws, name) => ws.send(JSON.stringify({ t: 'join', name, token: `tok-${name}-0123456789`, level: 'facil' }));

try {
  // a message past MSG_MAX closes the connection with 1009
  let ws = await open('BGHJK');
  ws.send(JSON.stringify({ t: 'join', name: 'x'.repeat(LIMITS.MSG_MAX), token: 'y'.repeat(16) }));
  let code = await closed(ws);
  check('too big: closed with 1009', code === 1009, code);

  // a flood closes the connection with 1008
  ws = await open('BGHJM');
  for (let k = 0; k < LIMITS.RATE_BURST * 3; k++) ws.send('{"t":"start"}');
  code = await closed(ws);
  check('flood: closed with 1008', code === 1008, code);

  // a person playing normally: a join and then a message every 300 ms, never cut, always answered
  ws = await open('BGHJN');
  const got = []; ws.on('message', d => got.push(JSON.parse(String(d))));
  join(ws, 'Calma');
  for (let k = 0; k < 12; k++) { await new Promise(r => setTimeout(r, 300)); ws.send('{"t":"start"}'); }
  await new Promise(r => setTimeout(r, 300));
  check('normal play: still open', ws.readyState === WebSocket.OPEN, ws.readyState);
  check('normal play: the room answered', got.some(x => x.t === 'room' && x.code === 'BGHJN'), JSON.stringify(got.slice(0, 2)));
  ws.close();

  // a room takes CONN_MAX connections and refuses the next one with 429; other rooms are not affected
  const many = [];
  for (let k = 0; k < LIMITS.CONN_MAX; k++) many.push(await open('BGHJP'));
  let refused = null;
  try { many.push(await open('BGHJP')); } catch (e) { refused = e.message; }
  check(`full room: connection ${LIMITS.CONN_MAX + 1} refused with 429`, refused === '429', refused);
  const other = await open('BGHJQ');
  check('full room: another room still takes connections', other.readyState === WebSocket.OPEN, other.readyState);
  other.close();
  // once one leaves, there is room again
  many[0].close(); await closed(many[0]); await new Promise(r => setTimeout(r, 100));
  let back = null;
  try { many[0] = await open('BGHJP'); back = 'open'; } catch (e) { back = e.message; }
  check('full room: after one leaves, a new connection gets in', back === 'open', back);
  for (const w of many) w.close();

  // a room code that is not one: no room is made
  let bad = null;
  try { await open('ab0de'); bad = 'open'; } catch (e) { bad = e.message; }
  check('bad code: refused with 404', bad === '404', bad);
} catch (e) {
  fails.push(`crashed: ${e.stack || e}`);
} finally {
  srv.kill();
}

if (fails.length) { console.log(fails.join('\n')); console.log(`${n - fails.length}/${n} room limit checks passed`); process.exit(1); }
console.log(`${n}/${n} room limit checks passed (too big, flood, normal play, full room, bad code)`);
process.exit(0);
