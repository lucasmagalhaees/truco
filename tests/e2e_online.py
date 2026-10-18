"""End to end, online: two phones in the same room, through the screen, against the room server.

Usage: python3 tests/e2e_online.py [dark|light] [dormindo]   (needs dist/ built: npm run build; and npm ci, for the ws package)
Starts tests/room_server.mjs on this machine (the same core and messages as server/worker.ts on Cloudflare, without
the storage and the alarms) with the computer players thinking 30 ms, and opens two phone-sized pages from the disk: the
host creates a room, the friend opens the invitation link and joins, they play. Every action is a tap on the screen;
the only thing set by the test is the server's address (ui.server). Nothing else on the network is reached.
With "dormindo" the server runs with HIBERNATE=1: the room goes to JSON and back through Core.readRoom between every two
events, as on Cloudflare when the Durable Object sleeps, so the same game proves that nothing is lost on the way.
"""
import json, os, pathlib, re, subprocess, sys, traceback
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cov
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / 'tests' / 'shots'; SHOTS.mkdir(exist_ok=True)
THEME = sys.argv[1] if len(sys.argv) > 1 else 'dark'
SLEEP = 'dormindo' in sys.argv[2:]
TAG = THEME + ('-dormindo' if SLEEP else '')             # names of screenshots and coverage files, so runs do not overwrite each other
PAGE = (ROOT / 'dist' / 'index.html').as_uri()

def serve(port=0):
    proc = subprocess.Popen(['node', str(ROOT / 'tests' / 'room_server.mjs'), str(port), '30'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                            env={**os.environ, 'HIBERNATE': '1' if SLEEP else '0'})
    line = proc.stdout.readline()
    m = re.search(r'ws://127\.0\.0\.1:(\d+)', line)
    if not m or SLEEP != ('(hibernando)' in line):
        proc.kill(); sys.exit(f'o servidor de salas não subiu como devia (dormindo={SLEEP}): {line}{proc.stdout.read()}')
    return proc, m.group(0), int(m.group(1))
srv, SERVER, PORT = serve()

def on_failure(kind, value, tb):
    traceback.print_exception(kind, value, tb)
    if os.environ.get('GITHUB_ACTIONS') == 'true':
        here = next((f for f in reversed(traceback.extract_tb(tb)) if f.filename.endswith('e2e_online.py')), None)
        print(f'::error title=e2e online {TAG}::linha {here.lineno if here else "?"}: {here.line if here else ""} -> {kind.__name__}: {str(value)[:500]}'.replace('\n', ' '))
    if srv.poll() is not None:                             # the server died: say why (in sleep mode, readRoom refusing the room)
        print(f'o servidor de salas parou (código {srv.returncode}): {srv.stdout.read()[-2000:]}')
    srv.kill()
sys.excepthook = on_failure

with sync_playwright() as p:
    b = p.chromium.launch()
    errs = []
    # the friend's phone goes through a switch on its connection to the room: on, it passes; cut, every attempt is held
    # and then closed by cut_off() (a handler cannot close the socket itself: the sync API would wait on itself)
    line_ = dict(cut=False, open=[], held=[])
    def through(ws):
        if line_['cut']: line_['held'].append(ws); return
        ws.connect_to_server(); line_['open'].append(ws)
    def cut_off(pg, until, timeout=20000):
        for _ in range(timeout // 100):
            while line_['held']: line_['held'].pop().close()
            if pg.evaluate(until): return
            pg.wait_for_timeout(100)
        raise AssertionError(f'never: {until}')
    def phone(switch=False):
        ctx = b.new_context(viewport=dict(width=393, height=852), device_scale_factor=2, color_scheme=THEME, locale='pt-BR', has_touch=True, is_mobile=True, reduced_motion='reduce')
        ctx.route('**/*', lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
        if switch: ctx.route_web_socket(re.compile(r'^ws://127\.0\.0\.1:\d+/salas/'), through)
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        cov.start(pg)
        return pg
    def at(pg, url=PAGE):
        pg.goto(url); pg.wait_for_function('window.__APP && window.__APP.S')
        pg.evaluate(f'window.__APP.ui.server = "{SERVER}"')
        pg.click('[data-act=level][data-v=medio]')              # a repaint, now that the server is known
    txt = lambda pg, sel: pg.text_content(sel).replace('\xa0', ' ')
    V = lambda pg: pg.evaluate('window.__APP.room')
    G = lambda pg: (V(pg) or {}).get('game')
    WIDE = "() => { const W = document.documentElement.clientWidth; return [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > W + 0.5).map(e => `${e.tagName}#${e.id}.${e.className} r=${e.getBoundingClientRect().right.toFixed(1)}`).slice(0, 8); }"
    overflow = lambda pg: pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')

    # ---------- without a server, the card says so ----------
    off = phone(); off.goto(PAGE); off.wait_for_function('window.__APP && window.__APP.S')
    assert off.locator('#onlineoff').count() == 1 and off.locator('[data-act=createroom]').is_disabled()
    cov.stop(off, f'e2e-online-off-{TAG}'); off.context.close()

    # ---------- the host creates a room ----------
    host = phone(); at(host)
    # no name: the field says so right there, with the focus in it, and nothing connects; typing takes the mark away
    host.click('[data-act=createroom]')
    assert txt(host, '#oname-err') == 'Escreve seu nome.' and host.is_visible('#oname-err') and host.get_attribute('#oname', 'aria-invalid') == 'true'
    assert host.evaluate('document.activeElement.id') == 'oname' and host.locator('.field.bad #oname').count() == 1
    assert host.locator('#lobby').count() == 0 and host.evaluate('JSON.parse(localStorage.getItem("truco.v1") || "{}").online') is None
    host.screenshot(path=str(SHOTS / f'o0-sem-nome-{TAG}.png'))
    host.click('[data-act=joinroom]'); assert txt(host, '#oname-err') == 'Escreve seu nome.' and host.locator('#ocode-err').is_hidden()
    host.type('#oname', 'Lucas'); assert host.locator('#oname-err').is_hidden() and host.get_attribute('#oname', 'aria-invalid') is None and host.locator('.field.bad').count() == 0
    host.click('[data-act=createroom]')
    host.wait_for_selector('#lobby #code')
    code = txt(host, '#code'); assert re.fullmatch(r'[A-Z0-9]{5}', code), code
    assert f'?sala={code}' in txt(host, '#link') and 'Começar só com as IAs' in txt(host, '[data-act=startroom]')
    assert 'Lucas' in txt(host, '#lseat0') and 'IA (Biu)' in txt(host, '#lseat1') and 'IA (Cida)' in txt(host, '#lseat2')
    assert host.evaluate('JSON.parse(localStorage.getItem("truco.v1")).online.code') == code, 'the room is kept, to come back to it'
    host.click('[data-act=copylink]'); host.wait_for_function('!document.getElementById("toast").hidden')

    # ---------- the friend opens the link and joins ----------
    guest = phone(switch=True); at(guest, f'{PAGE}?sala={code}')
    assert code in txt(guest, '#invite') and guest.input_value('#ocode') == code
    guest.fill('#oname', '<b>Amigo</b>'); guest.click('[data-act=joinroom]')
    guest.wait_for_selector('#lobby #code')
    assert 'Esperando quem criou a sala' in txt(guest, '#lobby') and guest.locator('[data-act=startroom]').count() == 0
    assert '<b>Amigo</b>' in txt(guest, '#lseat0') and 'Lucas' in txt(guest, '#lseat3') and guest.locator('#lobby b b').count() == 0, 'the name shows as text'
    assert '?sala=' not in guest.url, 'the invitation leaves the address once inside'
    host.wait_for_function('document.getElementById("lseat1").textContent.includes("Amigo")')
    assert 'Começar com 2 pessoas' in txt(host, '[data-act=startroom]')
    assert overflow(host) == 0 and overflow(guest) == 0
    host.screenshot(path=str(SHOTS / f'o1-sala-{TAG}.png'), full_page=True)

    # a wrong code, and a room that is already playing, are refused
    third = phone(); at(third)
    third.fill('#oname', 'Zé'); third.fill('#ocode', 'AB'); third.click('[data-act=joinroom]')
    assert txt(third, '#ocode-err') == 'O código tem 5 letras.' and third.get_attribute('#ocode', 'aria-invalid') == 'true' and third.evaluate('document.activeElement.id') == 'ocode'
    assert third.locator('#lobby').count() == 0 and third.locator('#oname-err').is_hidden()

    # ---------- three people: the host chooses how they play (two against one, and who plays with a computer) ----------
    third.fill('#ocode', code); third.click('[data-act=joinroom]'); third.wait_for_selector('#lobby #format')
    host.wait_for_selector('#format [data-act=roomalone]')
    assert host.locator('#format [data-act=roomformat][data-f=duplas].on').count() == 1
    assert host.locator('#format [data-act=roomformat][data-f=tres]').is_disabled() and 'em breve' in txt(host, '#format [data-f=tres]')
    assert 'Zé' in txt(host, '#lseat2') and txt(guest, '#format b') == 'Você' and txt(third, '#format b') == '<b>Amigo</b>', 'by default the third sits with the host; the second plays with the computer'
    assert guest.locator('#format button').count() == 0 and third.locator('#format button').count() == 0, 'only the host chooses'
    host.click('#format [data-act=roomalone][data-s="0"]')                # the host plays with the computer: the other two pair up
    guest.wait_for_function('document.getElementById("lseat2").textContent.includes("Zé")')
    third.wait_for_function('document.getElementById("lseat2").textContent.includes("Amigo")')
    assert 'Sua dupla' in txt(guest, '#lseat2') and 'Lucas' in txt(guest, '#lseat1') + txt(guest, '#lseat3') and 'IA (Cida)' in txt(host, '#lseat2')
    assert 'Lucas' in txt(third, '#format b') and overflow(host) == 0 and overflow(third) == 0
    host.screenshot(path=str(SHOTS / f'o1b-tres-pessoas-{TAG}.png'), full_page=True)
    third.click('[data-act=leaveroom]'); third.wait_for_selector('#online')
    host.wait_for_function('!document.getElementById("format")')
    assert '<b>Amigo</b>' in txt(host, '#lseat1') and 'Começar com 2 pessoas' in txt(host, '[data-act=startroom]')

    # ---------- the game: each sees only their own cards, from their own seat ----------
    host.click('[data-act=startroom]')
    host.wait_for_function('window.__APP.room && window.__APP.room.game'); guest.wait_for_function('window.__APP.room && window.__APP.room.game')
    hg, gg = G(host), G(guest)
    assert hg['humans'] == [0, 1] and gg['humans'] == [0, 3], (hg['humans'], gg['humans'])
    assert hg['names'] == ['Lucas', '<b>Amigo</b>', 'Cida', 'Toinho'] and gg['names'] == ['<b>Amigo</b>', 'Cida', 'Toinho', 'Lucas']
    mine_h = [c for c in hg['hands'][0]]; mine_g = [c for c in gg['hands'][0]]
    assert all(c != '??' for c in mine_h + mine_g) and all(c == '??' for h in hg['hands'][1:] for c in h) and all(c == '??' for h in gg['hands'][1:] for c in h)
    # the cards on the host's screen, outside the ranking (which lists all 40)
    host_cards = host.evaluate('[...document.querySelectorAll("#table [data-c], #hand [data-c], #action [data-c]")].map(e => e.dataset.c)')
    assert not set(mine_g) & set(host_cards) - {hg['vira']}, 'the friend\'s cards are not in the host\'s page'
    assert host.locator('[data-c="??"]').count() == 0 and guest.locator('[data-c="??"]').count() == 0, 'hidden cards are drawn face down'
    assert 'Amigo' in txt(host, '#seat1') and 'Lucas' in txt(guest, '#seat3') and 'Cida' in txt(guest, '#seat1')
    third.fill('#ocode', code); third.click('[data-act=joinroom]')
    third.wait_for_function('!document.getElementById("toast").hidden && document.getElementById("toast").textContent.includes("já começou")')
    third.wait_for_selector('#online'); assert third.evaluate('JSON.parse(localStorage.getItem("truco.v1")).online') is None
    cov.stop(third, f'e2e-online-third-{TAG}'); third.context.close()

    def whose(pg):
        g = G(pg)
        return g and pg.evaluate('(g) => window.__APP.Core.whoActs(g)', g) == 0 and g['phase'] in ('play', 'truco', 'eleven')
    def settle():
        host.wait_for_function('(() => { const r = window.__APP.room, g = r && r.game; if (!g) return false; const w = window.__APP.Core.whoActs(g); return g.phase === "handEnd" || g.phase === "over" || (w !== null && g.humans.includes(w)); })()', timeout=20000)
        guest.wait_for_timeout(60)
    def move(pg):
        g = G(pg)
        if g['phase'] == 'truco': pg.click('[data-act=answer][data-v=accept]')
        elif g['phase'] == 'eleven': pg.click('[data-act=eleven][data-v="1"]')
        else: pg.click('#hand [data-act=play] >> nth=0')
        pg.wait_for_function('(n) => JSON.stringify(window.__APP.room.game) !== n', arg=json.dumps(g))

    # play until it is the friend's turn with a truco to ask, then the friend asks and the host runs
    asked = False
    for _ in range(60):
        settle()
        hg = G(host)
        if hg['phase'] in ('handEnd', 'over'): break
        if whose(guest) and G(guest)['phase'] == 'play' and guest.locator('[data-act=truco]').count():
            guest.click('[data-act=truco]'); asked = True
            host.wait_for_function('(() => { const g = window.__APP.room.game; return g.phase === "truco" && g.ask && g.ask.by === 1; })()')
            assert 'Amigo' in txt(host, '#action') and re.search(r'pediu (truco|seis|nove|doze)', txt(host, '#action')) and host.locator('#tip').count() == 0, ('no whisper from a partner whose cards are hidden', txt(host, '#action'))
            host.click('[data-act=answer][data-v=run]'); break
        move(host if whose(host) else guest)
    host.wait_for_function('["handEnd", "over"].includes(window.__APP.room.game.phase)'); guest.wait_for_function('["handEnd", "over"].includes(window.__APP.room.game.phase)')
    hg, gg = G(host), G(guest)
    assert hg['score'] == [gg['score'][1], gg['score'][0]], (hg['score'], gg['score'])
    if asked: assert hg['score'][1] >= 1 and 'correu' in txt(host, '#action') and 'Eles correram' in ' '.join(gg['log']) or 'correu' in ' '.join(gg['log']), gg['log'][-3:]
    host.screenshot(path=str(SHOTS / f'o2-mao-{TAG}.png'), full_page=True)
    guest.screenshot(path=str(SHOTS / f'o2-mao-amigo-{TAG}.png'), full_page=True)
    assert overflow(host) == 0 and overflow(guest) == 0
    guest.click('[data-act=next]')
    host.wait_for_function('window.__APP.room.game.n === 2')

    # ---------- the friend drops out and comes back to the same seat ----------
    cov.keep(guest); guest.reload(); guest.wait_for_function('window.__APP && window.__APP.S'); guest.evaluate(f'window.__APP.ui.server = "{SERVER}"')
    guest.wait_for_function('window.__APP.room && window.__APP.room.game && window.__APP.room.game.n === 2', timeout=20000)
    assert G(guest)['humans'] == [0, 3] and G(guest)['names'][0] == '<b>Amigo</b>', 'back at the same seat'
    host.wait_for_function('!document.getElementById("netstatus") || !document.getElementById("netstatus").textContent.includes("saiu")')

    # ---------- the friend's connection drops: a strip says it is coming back, then that it gave up, with a button ----------
    line_['cut'] = True
    for ws in line_['open']: ws.close()
    line_['open'].clear()
    guest.wait_for_selector('#netbar:not(.off)')
    _bar = (txt(guest, '#netbar'), overflow(guest)); assert _bar == ('Caiu a conexão, voltando…', 0), (_bar, guest.evaluate(WIDE))
    guest.screenshot(path=str(SHOTS / f'o3-caiu-{TAG}.png'))
    host.wait_for_selector('#netstatus [data-act=botseat]')            # the seat is kept; the host could hand it over
    assert 'Amigo' in txt(host, '#netstatus') and 'saiu da sala' in txt(host, '#netstatus')
    cut_off(guest, '!!document.querySelector("#netbar.off [data-act=retryroom]")')
    assert 'Sem conexão.' in txt(guest, '#netbar') and 'Tentar de novo' in txt(guest, '#netbar [data-act=retryroom]')
    guest.screenshot(path=str(SHOTS / f'o4-sem-conexao-{TAG}.png'))
    line_['cut'] = False
    guest.click('#netbar [data-act=retryroom]')
    guest.wait_for_function('window.__APP.room && !document.getElementById("netbar")', timeout=10000)
    assert G(guest)['humans'] == [0, 3], 'back at the same seat'
    host.wait_for_function('!document.getElementById("netstatus")')

    # ---------- the friend leaves for good: the computer takes the seat at once ----------
    guest.click('[data-act=leaveroom]'); assert 'Toque de novo' in txt(guest, '[data-act=leaveroom]')
    guest.click('[data-act=leaveroom]'); guest.wait_for_selector('#online')
    host.wait_for_function('window.__APP.room.game.humans.length === 1')
    assert G(host)['humans'] == [0] and host.locator('#netstatus').count() == 0 and host.locator('[data-act=botseat]').count() == 0
    assert any('saiu; a IA joga no lugar.' in x for x in G(host)['log']), G(host)['log'][-3:]
    settle()                                                   # the computer plays the friend's seat now
    assert host.evaluate('(g) => window.__APP.Core.whoActs(g)', G(host)) in (0, None)

    # ---------- the server forgets the room (as Cloudflare does after a day with nobody): the phone says so and goes home ----------
    srv.kill(); srv.wait()
    host.wait_for_selector('#netbar')
    srv, _, _ = serve(PORT)
    for _ in range(40):
        if host.locator('#online').count(): break
        if host.locator('#netbar.off [data-act=retryroom]').count(): host.click('#netbar [data-act=retryroom]')
        host.wait_for_timeout(250)
    host.wait_for_selector('#online')
    assert 'A sala anterior acabou.' in txt(host, '#toast') and V(host) is None
    assert host.evaluate('JSON.parse(localStorage.getItem("truco.v1")).online') is None
    cov.stop(host, f'e2e-online-host-{TAG}'); cov.stop(guest, f'e2e-online-guest-{TAG}')
    assert not errs, errs
    b.close()
srv.kill()
print(f'e2e online ok ({TAG}): sem servidor desligado, criar sala, link de convite, entrar, nome como texto, lugares, código errado, sala já começada recusada, cada um só vê as próprias cartas e se vê embaixo, partida pelos dois celulares, truco do amigo, placar espelhado, próxima mão, erro no campo sem nome e com código errado, cair e voltar ao mesmo lugar, faixa de conexão caída e sem conexão com o botão, sair pondo a IA na hora, sala apagada pelo servidor, sem estouro de largura e sem erro de script')
