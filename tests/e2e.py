"""End to end, through the screen, in the browser: a whole game played the way a table would, on a phone-sized window.

Usage: python3 tests/e2e.py [dark|light]   (needs dist/ built: npm run build)
Opens dist/index.html from the disk, with the network blocked: the page must not need anything from outside to work.
Chance is taken out of the way by stacking the roles and the deck through window.__APP.S (invented test data); every
action is still a tap on the screen. Screenshots go to tests/shots/.
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cov
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / 'tests' / 'shots'; SHOTS.mkdir(exist_ok=True)
THEME = sys.argv[1] if len(sys.argv) > 1 else 'dark'
assert THEME in ('dark', 'light'), THEME
KEY = 'secrethitler.v1'
NAMES = ['Ana', 'Bia', 'Caio', 'Duda', 'Edu', 'Fê', '<b>Gil</b>']

with sync_playwright() as p:
    b = p.chromium.launch()
    # the main run asks for less motion, as a device can: nothing waits for an animation, so every tap acts at once.
    # A short run with motion on, at the end, checks the animations themselves.
    ctx = b.new_context(viewport=dict(width=393, height=852), device_scale_factor=2, color_scheme=THEME, locale='pt-BR', timezone_id='America/Sao_Paulo', has_touch=True, is_mobile=True, reduced_motion='reduce')
    ctx.route('**/*', lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    cov.start(pg)
    pg.goto((ROOT / 'dist' / 'index.html').as_uri()); pg.wait_for_function('window.__APP && window.__APP.S')
    txt = lambda sel: pg.text_content(sel).replace('\xa0', ' ')      # the words in the page; CSS may show them in capitals
    overflow = lambda: pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
    shot = lambda name: pg.screenshot(path=str(SHOTS / name), full_page=True)
    G = lambda: pg.evaluate('window.__APP.S.game')
    wait = lambda: pg.wait_for_function('window.__APP && window.__APP.S')

    # ---------- the table ----------
    assert pg.locator('#empty').count() == 1 and pg.locator('[data-act=start]').is_disabled(), txt('#view')
    assert pg.locator('select').count() == 0, 'no select of the system: its list is drawn by the device, with colours of its own'
    pg.click('[data-act=addname]'); assert 'Escreve um nome' in txt('#msg')
    for i, n in enumerate(NAMES):
        pg.fill('#name', n)
        if i % 2: pg.press('#name', 'Enter')
        else: pg.click('[data-act=addname]')
    assert pg.locator('#names li').count() == 7 and pg.locator('#names b b').count() == 0 and '<b>Gil</b>' in txt('#names'), 'names, and markup shown as text'
    pg.fill('#name', 'ana'); pg.click('[data-act=addname]'); assert 'já está na mesa' in txt('#msg')
    pg.locator('#names li', has_text='Fê').locator('[data-act=rmname]').click()
    assert pg.locator('#names li').count() == 6 and 'Começar com 6' in txt('[data-act=start]')
    pg.fill('#name', 'Fê'); pg.click('[data-act=addname]')
    for extra in ('H', 'I', 'J'): pg.fill('#name', extra); pg.click('[data-act=addname]')
    pg.fill('#name', 'K'); pg.click('[data-act=addname]'); assert 'de 5 a 10' in txt('#msg')
    for extra in ('H', 'I', 'J'): pg.click(f'[aria-label="Tirar {extra}"]')
    assert overflow() == 0, 'nothing wider than the phone'
    shot(f's1-mesa-{THEME}.png')

    # the theme: the device's by default, or the one chosen, which stays
    rgb = lambda: [int(v) for v in re.findall(r'\d+', pg.evaluate('getComputedStyle(document.body).backgroundColor'))[:3]]
    dark = lambda: max(rgb()) < 60
    assert dark() == (THEME == 'dark') and pg.locator('[data-act=theme][data-t=auto]').get_attribute('aria-pressed') == 'true', rgb()
    other = 'light' if THEME == 'dark' else 'dark'
    pg.click(f'[data-act=theme][data-t={other}]'); assert dark() == (other == 'dark') and pg.evaluate('document.documentElement.dataset.theme') == other
    cov.reload(pg); wait(); assert dark() == (other == 'dark'), 'the chosen theme stays'
    assert pg.locator('#names li').count() == 7, 'the table is kept on the device'
    pg.click('[data-act=theme][data-t=auto]'); assert dark() == (THEME == 'dark') and pg.evaluate('document.documentElement.dataset.theme') is None
    # the style: the poster by default, or art deco, which stays
    look = lambda: pg.evaluate('document.documentElement.dataset.look')
    assert look() == 'poster' and pg.locator('[data-act=look][data-l=poster]').get_attribute('aria-pressed') == 'true'
    pg.click('[data-act=look][data-l=deco]'); assert look() == 'deco' and dark() == (THEME == 'dark')
    cov.reload(pg); wait(); assert look() == 'deco', 'the chosen style stays'
    shot(f's0-deco-{THEME}.png')
    pg.click('[data-act=look][data-l=poster]'); assert look() == 'poster' and 'look' not in json.loads(pg.evaluate(f'localStorage.getItem("{KEY}")'))
    # sound and vibration: on by default, off when chosen, and that stays
    saved = lambda: json.loads(pg.evaluate(f'localStorage.getItem("{KEY}")'))
    assert pg.locator('[data-act=fx][data-v=on]').get_attribute('aria-pressed') == 'true'
    pg.click('[data-act=fx][data-v=off]'); assert saved().get('quiet') is True and pg.locator('[data-act=fx][data-v=off]').get_attribute('aria-pressed') == 'true'
    pg.click('[data-act=fx][data-v=on]'); assert 'quiet' not in saved()
    # opened from the disk there is no service worker, and the screen says so
    assert 'não fica guardado' in txt('#version') and pg.locator('[data-act=checkupdate]').count() == 0, txt('#version')

    # ---------- roles, each behind the gate ----------
    pg.click('[data-act=start]')
    g = G(); assert g['phase'] == 'reveal' and len(g['players']) == 7
    for i in range(7):
        assert 'Passe o celular para' in txt('#phase') and pg.locator('#role').count() == 0, 'the role is not on screen before the tap'
        pg.click('[data-act=open]')
        me = G()['players'][i]
        assert pg.locator('#role svg.art').count() == 1, 'the role card shows its illustration'
        assert pg.locator('#role').count() == 1 and {'liberal': 'LIBERAL', 'fascista': 'FASCISTA', 'hitler': 'HITLER'}[me['role']] in txt('#role').upper(), txt('#phase')
        if me['role'] == 'fascista':
            hitler = next(p['name'] for p in G()['players'] if p['role'] == 'hitler')
            assert hitler in txt('#allies .ally.H'), txt('#phase')
            others = [p['name'] for j, p in enumerate(G()['players']) if p['role'] == 'fascista' and j != i]
            assert all(o in txt('#allies .ally.F') for o in others) and hitler not in txt('#allies .ally.F'), txt('#allies')
        if i == 0: shot(f's2-papel-{THEME}.png')
        pg.click('[data-act=hiderole]')
    assert G()['phase'] == 'nominate'

    # stack the table so the game below is the same every time: Ana is Hitler, Bia and Caio fascists; Duda presides
    pg.evaluate('''() => { const g = window.__APP.S.game; g.players.forEach((p, i) => { p.role = i === 0 ? 'hitler' : i < 3 ? 'fascista' : 'liberal'; }); g.pres = 3; }''')
    pg.evaluate(f'localStorage.setItem("{KEY}", JSON.stringify(window.__APP.S))')
    cov.reload(pg); wait()
    assert G()['pres'] == 3 and 'Duda' in txt('#phase') and 'Duda' in txt('#status'), 'the game in course comes back after a reload'
    assert pg.locator('#board .slot.new').count() == 0, 'a reload stamps nothing'
    stack = lambda deck: pg.evaluate('(d) => { window.__APP.S.game.deck = d.split(""); }', deck)

    def nominate(i):
        pg.click(f'#phase [data-act=nominate][data-i="{i}"]'); assert G()['phase'] == 'vote'
    def votes(elected):
        pg.click(f'[data-act=elect][data-v="{1 if elected else 0}"]')
    def hand(role, keep):
        """Through the gate, the president or the chancellor throws away a law that is not `keep` if there is one."""
        assert pg.locator('#phase .law').count() == 0 and 'Passe o celular para' in txt('#phase'), 'the laws are not on screen before the tap'
        pg.click('[data-act=open]')
        h = G()['hand']; k = next((j for j, l in enumerate(h) if l != keep), 0)
        assert pg.locator('#phase .law').count() == len(h) and pg.locator(f'[data-act={role}discard]').is_disabled()
        pg.click(f'#phase [data-act=pick][data-k="{k}"]')
    def govern(chanc, law):
        nominate(chanc); votes(True); assert G()['phase'] == 'president', G()['log'][-1]
        hand('p', law); pg.click('[data-act=pdiscard]'); assert G()['phase'] == 'chancellor'
        hand('c', law); pg.click('[data-act=cdiscard]')
        assert pg.locator('#board .slot.new').count() == (0 if G()['phase'] == 'over' else 1), 'the new law stamps onto the board'

    # three governments rejected: the top law goes in by itself
    # help for the phase, open and closed
    pg.click('[data-act=help]'); assert 'escolhe quem vai ser o chanceler' in txt('#helptext')
    pg.click('[data-act=help]'); assert pg.locator('#helptext').count() == 0
    # a nomination and a vote result can be taken back, until something else happens
    nominate(4); assert pg.locator('#undo').count() == 1
    pg.click('#undo'); assert G()['phase'] == 'nominate' and G()['chanc'] is None and pg.locator('#undo').count() == 0
    nominate(4); votes(False)
    assert pg.evaluate('document.getElementById("stamp").hidden') is False and 'Rejeitado' in txt('#stamp'), 'the vote result is stamped on the screen'
    assert G()['tracker'] == 1 and pg.locator('#tracker.bump').count() == 1, 'the tracker shakes when it moves'
    pg.click('#undo'); assert G()['phase'] == 'vote' and G()['tracker'] == 0 and G()['chanc'] == 4
    votes(False); assert G()['tracker'] == 1 and G()['pres'] == 4 and 'rejeitado' in txt('#toast')
    nominate(5); votes(False)
    stack('LFFLFFLL')
    nominate(6); votes(False)
    g = G(); assert g['laws'] == {'L': 1, 'F': 0} and g['tracker'] == 0 and g['pres'] == 6 and 'Lei liberal aprovada' in txt('#toast'), g['log'][-3:]
    # a government: 3 laws, 2, one enacted
    stack('FFLFFLFFL'); govern(0, 'F')
    assert G()['laws']['F'] == 1 and G()['pres'] == 0 and 'Lei fascista aprovada' in txt('#toast')
    # term limits: the last government cannot come back as chancellor
    assert pg.locator('#phase [data-act=nominate][data-i="0"]').count() == 0 and pg.locator('#phase [data-act=nominate][data-i="6"]').count() == 0 and 'último governo' in txt('#phase')
    assert overflow() == 0; shot(f's3-mesa-de-jogo-{THEME}.png')

    # 2nd fascist law: Ana sees Caio's party
    stack('FFLFFL'); govern(1, 'F'); assert G()['phase'] == 'investigate'
    pg.click('#phase [data-act=investigate][data-i="2"]')
    assert pg.locator('#party').count() == 0; pg.click('[data-act=open]'); assert pg.locator('#party svg.art').count() == 1 and 'FASCISTA' in txt('#party').upper() and 'Caio' in txt('#party')
    pg.click('[data-act=endpower]'); assert G()['phase'] == 'nominate' and G()['pres'] == 1
    # 3rd, at a table of 7: Bia calls a special election and makes Edu president; then the order goes on after Bia
    stack('FFLFFL'); govern(3, 'F'); assert G()['phase'] == 'special' and 'eleição especial' in txt('#phase')
    assert pg.locator('#phase [data-act=special][data-i="1"]').count() == 0, 'not the president herself'
    pg.click('#phase [data-act=special][data-i="4"]'); assert G()['pres'] == 4 and G()['back'] == 1 and 'Edu é o próximo presidente' in txt('#toast')
    nominate(6); votes(False); assert G()['pres'] == 2 and G()['back'] is None
    # 4th: Caio eliminates Gil (Fê went back in at the end of the table)
    stack('FFLFFL'); govern(4, 'F'); assert G()['phase'] == 'execute'
    assert pg.locator('[data-act=execute]').is_disabled()
    pg.click('#phase [data-act=pickp][data-i="5"]'); assert 'Eliminar <b>Gil</b>' in txt('[data-act=execute]')
    pg.click('[data-act=execute]'); assert G()['players'][5]['alive'] is False and '<b>Gil</b> foi eliminado' in txt('#toast') and pg.locator('#players li.dead').count() == 1
    # 5th: Duda eliminates Bia
    stack('FFLFFL'); govern(6, 'F'); assert G()['phase'] == 'execute' and G()['laws']['F'] == 5
    pg.click('#phase [data-act=pickp][data-i="1"]'); pg.click('[data-act=execute]'); assert G()['pres'] == 4

    # veto: refused, then the chancellor must enact one
    stack('LLFLLF'); nominate(2); votes(True)
    hand('p', 'L'); pg.click('[data-act=pdiscard]')
    pg.click('[data-act=open]'); pg.click('[data-act=askveto]'); assert G()['phase'] == 'veto' and 'quer vetar' in txt('#phase')
    pg.click('[data-act=veto][data-v="0"]'); assert G()['phase'] == 'chancellor' and 'Veto recusado' in txt('#toast')
    hand('c', 'L'); assert pg.locator('[data-act=askveto]').count() == 0 and 'recusou o veto' in txt('#phase')
    pg.click('[data-act=cdiscard]'); assert G()['laws'] == {'L': 2, 'F': 5} and G()['pres'] == 6
    # veto: accepted, and it counts as a failed government
    stack('LLFLLF'); nominate(3); votes(True)
    hand('p', 'L'); pg.click('[data-act=pdiscard]'); pg.click('[data-act=open]'); pg.click('[data-act=askveto]')
    pg.click('[data-act=veto][data-v="1"]'); assert G()['tracker'] == 1 and G()['laws'] == {'L': 2, 'F': 5} and 'Veto aceito' in txt('#toast')

    # Hitler elected chancellor with 3 or more fascist laws: the fascists win
    assert G()['pres'] == 0; nominate(2); votes(False); assert G()['pres'] == 2
    nominate(0); votes(True)
    g = G(); assert g['phase'] == 'over' and g['winner'] == 'F' and 'fascistas venceram' in txt('#phase')
    assert pg.locator('#confetti i').count() > 0 and pg.locator('#phase .cheer svg.art').count() == 1, 'confetti and the winners cheering'
    assert 'Ana investigou Caio: era fascista' in ' '.join(txt('#summary').split()), txt('#summary')
    assert 'eliminou' in txt('#summary') and 'rejeitados' in txt('#summary') and 'Caos' in txt('#summary') and 'vetaram' in txt('#summary'), txt('#summary')
    assert pg.locator('#players .role').count() == 7 and 'Hitler' in txt('#players'), 'the roles are shown at the end'
    assert overflow() == 0; shot(f's4-fim-{THEME}.png')

    # again with the same table, then ending a game halfway
    pg.click('[data-act=again]'); assert G()['phase'] == 'reveal' and G()['laws'] == {'L': 0, 'F': 0}
    pg.click('[data-act=end]'); assert G() is not None and 'Toque de novo' in txt('[data-act=end]')
    pg.click('[data-act=end]'); assert G() is None and pg.locator('#table').count() == 1 and pg.locator('#names li').count() == 7
    saved = json.loads(pg.evaluate(f'localStorage.getItem("{KEY}")')); assert saved['game'] is None and len(saved['names']) == 7

    # the liberals win by eliminating Hitler
    pg.click('[data-act=start]')
    pg.evaluate('''() => { const g = window.__APP.S.game; g.players.forEach((p, i) => { p.role = i === 0 ? 'hitler' : i < 3 ? 'fascista' : 'liberal'; }); g.phase = 'nominate'; g.pres = 3; g.laws = { L: 0, F: 3 }; }''')
    pg.evaluate(f'localStorage.setItem("{KEY}", JSON.stringify(window.__APP.S))'); cov.reload(pg); wait()
    stack('FFLFFL')
    nominate(4); votes(True); hand('p', 'F'); pg.click('[data-act=pdiscard]'); hand('c', 'F'); pg.click('[data-act=cdiscard]')
    assert G()['phase'] == 'execute'
    pg.click('#phase [data-act=pickp][data-i="0"]'); pg.click('[data-act=execute]')
    assert G()['winner'] == 'L' and 'liberais venceram' in txt('#phase')
    pg.click('[data-act=table]'); assert G() is None and pg.locator('#table').count() == 1

    # a table of 5: Hitler knows the fascist, and the 3rd fascist law lets the president see the next 3 laws
    pg.locator('#names li', has_text='Fê').locator('[data-act=rmname]').click()
    pg.locator('#names li', has_text='Gil').locator('[data-act=rmname]').click()
    pg.click('[data-act=start]'); assert len(G()['players']) == 5
    pg.evaluate('''() => { window.__APP.S.game.players.forEach((p, i) => { p.role = i === 0 ? 'hitler' : i === 1 ? 'fascista' : 'liberal'; }); }''')
    pg.evaluate(f'localStorage.setItem("{KEY}", JSON.stringify(window.__APP.S))'); cov.reload(pg); wait()
    pg.click('[data-act=open]'); assert 'Seu fascista' in txt('#allies') and 'Bia' in txt('#allies .ally.F'), txt('#phase')
    # a secret closes by itself when the app leaves the screen, or when the phone is put face down
    pg.evaluate('''() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); delete document.hidden; }''')
    assert pg.locator('#role').count() == 0 and 'saiu da tela' in txt('#toast'), 'hidden when the app goes away'
    pg.click('[data-act=open]'); pg.evaluate("window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { beta: 175 }))")
    assert pg.locator('#role').count() == 0 and 'virado para baixo' in txt('#toast'), 'hidden when the phone is face down'
    pg.click('[data-act=open]')
    for i in range(5):
        if i: pg.click('[data-act=open]')
        pg.click('[data-act=hiderole]')
    assert 'espiar' in txt('#board') and 'partido' not in txt('#board') and 'eleição' not in txt('#board'), txt('#board')
    pg.evaluate('''() => { const g = window.__APP.S.game; g.pres = 3; g.laws = { L: 0, F: 2 }; }''')
    pg.evaluate(f'localStorage.setItem("{KEY}", JSON.stringify(window.__APP.S))'); cov.reload(pg); wait()
    stack('FFLFFL'); govern(4, 'F'); assert G()['phase'] == 'peek'
    pg.click('[data-act=open]'); top = G()['deck'][:3]
    assert [('L' if 'LIBERAL' in t.upper() else 'F') for t in pg.locator('#peek .law').all_inner_texts()] == top
    pg.click('[data-act=endpower]'); assert G()['pres'] == 4

    cov.stop(pg, f'e2e-{THEME}')
    assert not errs, errs

    # ---------- with motion on: the animations play, and taps wait for the falling card ----------
    mctx = b.new_context(viewport=dict(width=393, height=852), color_scheme=THEME, locale='pt-BR', reduced_motion='no-preference')
    mctx.route('**/*', lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
    mp = mctx.new_page(); merrs = []
    mp.on('pageerror', lambda e: merrs.append(str(e)))
    cov.start(mp)
    mp.goto((ROOT / 'dist' / 'index.html').as_uri()); mp.wait_for_function('window.__APP && window.__APP.S')
    for n in NAMES[:5]: mp.fill('#name', n); mp.press('#name', 'Enter')
    mp.click('[data-act=start]')
    mp.click('[data-act=open]'); assert mp.locator('.turn.go .back').count() == 1, 'the role card turns over'
    mp.click('[data-act=hiderole]')
    for _ in range(4): mp.click('[data-act=open]'); mp.click('[data-act=hiderole]')
    mp.locator('#phase [data-act=nominate]').first.click(); mp.click('[data-act=elect][data-v="1"]')
    assert mp.locator('#stamp.go').count() == 1 and 'Eleito' in mp.text_content('#stamp')
    mp.click('[data-act=open]'); assert mp.locator('.flip .hand .law').count() == 3, 'the laws are dealt'
    mp.click('#phase [data-act=pick][data-k="0"]'); mp.click('[data-act=pdiscard]')
    assert mp.locator('#phase .law.toss').count() == 1 and mp.evaluate('window.__APP.S.game.phase') == 'president', 'the card falls before the game moves on'
    mp.click('[data-act=pdiscard]')                                                   # a tap while it falls changes nothing
    mp.wait_for_function("window.__APP.S.game.phase === 'chancellor'", timeout=3000)
    assert mp.evaluate('window.__APP.S.game.discard.length') == 1, 'one discard, not two'
    cov.stop(mp, f'e2e-motion-{THEME}')
    assert not merrs, merrs
    b.close()
print(f'e2e ok ({THEME}): mesa, papéis atrás do portão, eleição, caos, leis, limite de mandato, poderes, veto, eleição especial, mesa de 5 (Hitler conhece o fascista, espiar), desfazer, ajuda, segredo que se esconde sozinho, resumo da partida, animações, fim de jogo pelos dois lados, guardado no aparelho, tema, sem estouro de largura e sem erro de script')
