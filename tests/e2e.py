"""End to end, through the screen, in the browser: the home screen, training, the real-table assistant and games
against the computer, on a phone-sized window.

Usage: python3 tests/e2e.py [dark|light]   (needs dist/ built: npm run build)
Opens dist/index.html from the disk, with the network blocked: the page must not need anything from outside to work.
Chance is taken out of the way by stacking hands through window.__APP.S (invented test data) and, where a bluff is
wanted, by fixing Math.random; the computer players think for a fixed 20 ms (ui.wait). The microphone is a stand-in
that "hears" a fixed sentence. Every action of the person is a tap on the screen. Screenshots go to tests/shots/.
"""
import json, os, pathlib, re, sys, traceback
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cov
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / 'tests' / 'shots'; SHOTS.mkdir(exist_ok=True)
THEME = sys.argv[1] if len(sys.argv) > 1 else 'dark'
assert THEME in ('dark', 'light'), THEME
KEY = 'truco.v1'
# a stand-in microphone: says what window.__say holds, then stops
FAKE_MIC = '''window.__say = "vira sete de copas minha mão zap três de ouros e rei de espadas";
window.SpeechRecognition = window.webkitSpeechRecognition = class { start() { setTimeout(() => { this.onresult && this.onresult({ results: [[{ transcript: window.__say }]] }); this.onend && this.onend(); }, 30); } stop() { this.onend && this.onend(); } };'''

LAST_STATE = {'game': None}
def on_failure(kind, value, tb):
    """On GitHub the job log lives where not every reader can reach it; the failing line, the error and the game at that
    moment also go out as an annotation of the job, which the checks API serves."""
    traceback.print_exception(kind, value, tb)
    if os.environ.get('GITHUB_ACTIONS') == 'true':
        here = next((f for f in reversed(traceback.extract_tb(tb)) if f.filename.endswith('e2e.py')), None)
        game = json.dumps(LAST_STATE['game'], ensure_ascii=False)[:900] if LAST_STATE['game'] else 'sem partida'
        msg = f'linha {here.lineno if here else "?"}: {here.line if here else ""} -> {kind.__name__}: {str(value)[:400]} | jogo: {game}'
        print(f'::error title=e2e {THEME}::' + msg.replace('\n', ' ').replace('%', '%25'))
sys.excepthook = on_failure

with sync_playwright() as p:
    b = p.chromium.launch()
    # the main run asks for less motion, as a device can: nothing waits for an animation. A short run with motion on,
    # at the end, checks the animations themselves.
    ctx = b.new_context(viewport=dict(width=393, height=852), device_scale_factor=2, color_scheme=THEME, locale='pt-BR', timezone_id='America/Sao_Paulo', has_touch=True, is_mobile=True, reduced_motion='reduce')
    ctx.route('**/*', lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
    ctx.add_init_script(FAKE_MIC)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    cov.start(pg)
    pg.goto((ROOT / 'dist' / 'index.html').as_uri()); pg.wait_for_function('window.__APP && window.__APP.S')
    txt = lambda sel: pg.text_content(sel).replace('\xa0', ' ')
    overflow = lambda: pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
    shot = lambda name: pg.screenshot(path=str(SHOTS / name), full_page=True)
    def G():
        g = pg.evaluate('window.__APP.S.game'); LAST_STATE['game'] = g and {k: g[k] for k in ('phase', 'turn', 'starter', 'rounds', 'table', 'hands', 'value', 'ask', 'score', 'vira')}
        return g
    S = lambda: pg.evaluate('window.__APP.S')
    def ready():
        pg.wait_for_function('window.__APP && window.__APP.S'); pg.evaluate('window.__APP.ui.wait = 20')
    def reload():
        cov.reload(pg); ready()
    ready()

    # ---------- the start screen: five tabs at the bottom, each a tree of screens with a way back ----------
    route = lambda: pg.get_attribute('#panel', 'data-route')
    def tab(t):
        pg.click(f'#tabs [data-act=tab][data-v={t}]'); pg.wait_for_selector(f'#panel[data-route="{t}"]')
    def into(path):
        pg.click(f'[data-act=go][data-v="{path}"]'); pg.wait_for_selector(f'#panel[data-route="{path}"]')
    def back(want):
        pg.click('#panel [data-act=back]'); pg.wait_for_selector(f'#panel[data-route="{want}"]')
    # who sits at the table, without the teams in parentheses (D15 added them; they are checked on their own below)
    full_lineup = lambda: txt('#tablenow')
    lineup = lambda: re.sub(r' \([^)]*\)', '', full_lineup()).replace('Você e', 'você e')
    assert route() == 'jogar' and pg.locator('#start').count() == 1 and pg.locator('select').count() == 0, 'no select of the system'
    assert pg.locator('#tabs [role=tab]').count() == 5 and pg.get_attribute('#tab-jogar', 'aria-selected') == 'true' and pg.locator('#tabs [aria-selected=true]').count() == 1
    assert 'Nenhuma partida terminada' in txt('#tally')
    icon = pg.evaluate("""() => new Promise(ok => { const l = document.querySelector('link[rel=icon]'); if (!l) return ok(null); const i = new Image(); i.onload = () => ok(i.naturalWidth); i.onerror = () => ok(0); i.src = l.href; })""")
    assert icon and icon > 0, 'the page has an icon, and it loads'
    touch = pg.get_attribute('link[rel=apple-touch-icon]', 'href'); assert touch and (ROOT / 'dist' / touch).is_file(), touch
    pg.click('[data-act=level][data-v=dificil]'); assert S()['level'] == 'dificil' and 'Lembra de cada carta' in txt('#leveltext')
    pg.click('[data-act=level][data-v=extremo]'); assert S()['level'] == 'extremo' and 'Conta as cartas' in txt('#leveltext') and overflow() == 0
    pg.click('[data-act=level][data-v=facil]'); assert 'quase não blefa' in txt('#leveltext')
    pg.click('[data-act=level][data-v=medio]')
    assert overflow() == 0; shot(f'e1-inicio-{THEME}.png')
    # the keyboard: arrows move between the tabs and open them
    pg.focus('#tab-jogar'); pg.keyboard.press('ArrowRight'); pg.wait_for_selector('#panel[data-route="treinar"]')
    assert pg.evaluate('document.activeElement.id') == 'tab-treinar' and 'Nenhum exercício' in txt('#trainstats')
    pg.keyboard.press('End'); pg.wait_for_selector('#panel[data-route="ajustes"]'); pg.keyboard.press('Home'); pg.wait_for_selector('#panel[data-route="jogar"]')

    # the theme: the device's by default, or the one chosen, which stays
    tab('ajustes')
    rgb = lambda: [int(v) for v in re.findall(r'\d+', pg.evaluate('getComputedStyle(document.body).backgroundColor'))[:3]]
    dark = lambda: max(rgb()) < 60
    assert dark() == (THEME == 'dark') and pg.locator('[data-act=theme][data-v=auto]').get_attribute('aria-pressed') == 'true', rgb()
    other = 'light' if THEME == 'dark' else 'dark'
    pg.click(f'[data-act=theme][data-v={other}]'); assert dark() == (other == 'dark')
    reload(); assert dark() == (other == 'dark'), 'the chosen theme stays'
    assert route() == 'ajustes', 'the open tab stays too (in the address and in this browser)'
    pg.click('[data-act=theme][data-v=auto]'); assert dark() == (THEME == 'dark') and pg.evaluate('document.documentElement.dataset.theme') is None
    assert pg.get_attribute('[data-act=auto][data-v=on]', 'aria-pressed') == 'true' and 'auto' not in S() and '3 s' in txt('#autotext'), '"Avançar sozinho" is on by default'
    for act, v, key, want in (('speed', 'rapida', 'speed', 'rapida'), ('speed', 'normal', 'speed', None), ('fx', 'off', 'quiet', True), ('fx', 'on', 'quiet', None), ('hints', 'off', 'hints', False), ('hints', 'on', 'hints', None), ('auto', 'off', 'auto', False), ('auto', 'on', 'auto', None)):
        pg.click(f'[data-act={act}][data-v={v}]'); assert S().get(key) == want, (act, v, S())
    pg.click('[data-act=speed][data-v=calma]'); assert '4,5 s' in txt('#autotext'), 'the pause follows the speed'
    pg.click('[data-act=speed][data-v=normal]')
    # the games below go hand by hand with "Próxima mão" (the setting off: as before D15); one stretch further down has it on
    pg.click('[data-act=auto][data-v=off]'); assert S()['auto'] is False and pg.get_attribute('[data-act=auto][data-v=off]', 'aria-pressed') == 'true'
    assert 'não fica guardado' in txt('#version') and pg.locator('[data-act=checkupdate]').count() == 0, txt('#version')
    def colorby(v):
        tab('ajustes'); pg.click(f'[data-act=colorby][data-v={v}]')

    # ---------- the theme: a team, names, colours, rivals across themes ----------
    top_bg = lambda: pg.evaluate('getComputedStyle(document.querySelector(".top")).backgroundColor')
    eles_bg = lambda: pg.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--rival").trim()')
    plain_top = top_bg()
    tab('equipe'); assert 'você e Cida contra Biu e Toinho' in lineup()
    into('equipe/time')
    kinds = pg.locator('#kinds .entry b').all_inner_texts()
    assert [t.strip().lower() for t in kinds] == ['futebol', 'animes', 'jogos', 'filmes'], kinds     # the kinds come from the catalogue
    into('equipe/time/futebol')                                  # one universe in the kind: straight to the teams
    assert pg.locator('#teams .item').count() == 20 and txt('#screentitle') == 'Série A 2026'
    pg.click('#teams [data-act=team][data-v="futebol/flamengo"]'); pg.wait_for_selector('#panel[data-route="equipe"]')
    assert S()['team'] == 'futebol/flamengo' and top_bg() == 'rgb(200, 16, 46)', top_bg()
    # the direct rival comes in with the team (D16): Flamengo brings Fluminense, and the sentence says it
    assert S()['rival'] == 'futebol/fluminense' and S()['rivalAuto'] is True, S().get('rival')
    assert 'Pedro' in txt('#squad') and 'Você e Pedro (Flamengo) contra Germán Cano e Ganso (Fluminense, rival direto)' in full_lineup(), full_lineup()
    assert 'Fluminense (rival direto)' in txt('#steps'), txt('#steps')
    pg.go_back(); pg.wait_for_selector('#panel[data-route="ajustes"]')          # choosing took the screens on the way off the history: back is the tab before
    pg.go_forward(); pg.wait_for_selector('#panel[data-route="equipe"]')
    # the star is renamed (with the direct rival in, the other two of the team are not at the table)
    pg.click('[data-act=editplayers]'); pg.fill('#pl0', '<b>Gerson</b>'); pg.click('[data-act=saveplayers]')
    assert S()['custom'] == {'futebol/flamengo': ['<b>Gerson</b>', 'Arrascaeta', 'Léo Ortiz']} and '<b>Gerson</b>' in lineup() and pg.locator('#tablenow b b').count() == 0, 'a name typed shows as text'
    pg.click('[data-act=editplayers]'); pg.click('[data-act=resetplayers]'); assert 'custom' not in S() and 'Germán Cano' in lineup()
    # one button goes through the three suggested rivals, and back to the first; the tree waits behind "Escolher outra"
    into('equipe/rivais')
    assert 'Rival direto 1 de 3: Fluminense — o Fla-Flu' in txt('#rivalnow') and pg.locator('#kinds').count() == 0 and pg.locator('#suggestbtn').count() == 1, txt('#panel')
    shot(f'e9-rival-sugerido-{THEME}.png')
    seen = []
    for _ in range(3):
        pg.click('#suggestbtn'); seen.append((S()['rival'], txt('#rivalnow')))
    assert [r for r, _ in seen] == ['futebol/vasco', 'futebol/botafogo', 'futebol/fluminense'] and 'Rival direto 2 de 3: Vasco — o Clássico dos Milhões' in seen[0][1] and 'Rival direto 3 de 3: Botafogo' in seen[1][1] and 'Rival direto 1 de 3: Fluminense' in seen[2][1], seen
    assert S()['rivalAuto'] is True and overflow() == 0
    pg.click('#panel [data-act=mode][data-v=own]'); assert 'rival' not in S() and 'rivalAuto' not in S()
    assert 'Rival direto sugerido: Fluminense' in txt('#rivalhint') and pg.locator('#kinds').count() == 1
    back('equipe'); assert 'os outros dois da equipe Flamengo' in full_lineup() and 'Nenhuma' in txt('#steps'), ('no rival team: the other two of your own, and it says so', full_lineup())
    # the same button sits on the Equipe screen itself, right under the two steps
    got = []
    for _ in range(3):
        pg.click('#panel[data-route="equipe"] #suggestbtn'); got.append(S()['rival'])
    assert got == ['futebol/fluminense', 'futebol/vasco', 'futebol/botafogo'] and 'Botafogo' in txt('#steps') and overflow() == 0, got
    into('equipe/rivais'); pg.click('#suggestbtn'); assert S()['rival'] == 'futebol/fluminense'
    pg.click('#otherrival'); pg.wait_for_selector('#kinds'); into('equipe/rivais/futebol')
    assert pg.locator('#teams [data-act=rival][data-v="futebol/flamengo"]').count() == 0, 'your own team is not a rival'
    pg.click('#teams [data-act=rival][data-v="futebol/palmeiras"]'); pg.wait_for_selector('#panel[data-route="equipe"]')
    assert 'você e Pedro contra Vitor Roque e Flaco López' in lineup()
    # team against team (D15): your team, then the other team whole, then the sentence
    assert 'Você e Pedro (Flamengo) contra Vitor Roque e Flaco López (Palmeiras)' in full_lineup(), full_lineup()
    assert pg.locator('#steps .entry').count() == 2 and 'Palmeiras' in txt('#steps') and 'Pedro é a sua dupla' in txt('#steps')
    assert overflow() == 0; shot(f'e1-time-{THEME}.png'); shot(f'e8-equipe-x-equipe-{THEME}.png')
    into('equipe/rivais'); assert 'Adversária agora: Palmeiras' in txt('#panel') and pg.locator('#panel [data-act=mode][data-v=own]').count() == 1; back('equipe')
    reload(); assert S()['team'] == 'futebol/flamengo' and S()['rival'] == 'futebol/palmeiras' and top_bg() == 'rgb(200, 16, 46)', 'the team stays on the device'
    tab('jogar'); assert 'você e Pedro contra Vitor Roque e Flaco López' in lineup(), 'Jogar says who sits at the table too'
    pg.evaluate('window.__APP.ui.wait = 1e6'); pg.click('[data-act=new]'); g = G()
    assert g['names'] == ['Você', 'Vitor Roque', 'Pedro', 'Flaco López'] and g['sides'] == ['futebol/flamengo', 'futebol/palmeiras']
    assert 'Vitor Roque' in txt('#seat1') and 'Pedro' in txt('#seat2') and 'Flaco López' in txt('#seat3') and pg.is_hidden('#tabs'), 'the game takes the whole screen'
    assert pg.evaluate('getComputedStyle(document.querySelector(".chip.eles")).backgroundColor') == 'rgb(0, 100, 55)', 'the rival\'s colour on "Eles"'
    assert txt('#chip0').startswith('Nós: Flamengo') and txt('#chip1').startswith('Eles: Palmeiras') and 'Nós: Flamengo' in txt('#matchup') and 'Eles: Palmeiras' in txt('#matchup'), ('the teams by name on the score and over the table', txt('#score'))
    assert overflow() == 0; shot(f'e1-rivais-{THEME}.png')
    pg.click('[data-act=end]'); pg.click('[data-act=end]'); pg.evaluate('window.__APP.ui.wait = 20')
    assert route() == 'jogar' and pg.is_visible('#tabs'), 'ending a game lands on Jogar'
    # an anime team against a football club: kind, then universe, then team; then a rival from another theme
    tab('equipe'); into('equipe/time'); into('equipe/time/anime')
    packs = [x.strip().lower() for x in pg.locator('#packs .entry b').all_inner_texts()]
    assert packs == ['blue lock', 'naruto clássico', 'dragon ball', 'avatar: a lenda de aang'], packs
    into('equipe/time/anime/naruto'); assert txt('#screentitle') == 'Naruto Clássico'
    # the browser's back goes one screen back, and forward again
    pg.go_back(); pg.wait_for_selector('#panel[data-route="equipe/time/anime"]')
    pg.go_back(); pg.wait_for_selector('#panel[data-route="equipe/time"]')
    pg.go_forward(); pg.wait_for_selector('#panel[data-route="equipe/time/anime"]')
    back('equipe/time'); into('equipe/time/anime'); into('equipe/time/anime/naruto')
    pg.click('#teams [data-act=team][data-v="naruto/time-7"]'); pg.wait_for_selector('#panel[data-route="equipe"]')
    assert S()['team'] == 'naruto/time-7' and top_bg() == 'rgb(244, 123, 32)', top_bg()
    assert 'Naruto' in txt('#squad') and 'líder' in txt('#squad')
    # a rival chosen by hand (Palmeiras) stays when the team changes; the suggestion is there as an option
    assert S()['rival'] == 'futebol/palmeiras' and 'rivalAuto' not in S(), S().get('rival')
    into('equipe/rivais'); assert 'Adversária agora: Palmeiras, escolhida por você' in txt('#rivalnow') and 'Rival direto sugerido: Irmãos da Areia — Naruto × Gaara no Exame Chunin' in txt('#rivalhint'), txt('#suggest')
    pg.click('#suggestbtn'); assert S()['rival'] == 'naruto/areia' and 'Rival direto 1 de 3: Irmãos da Areia' in txt('#rivalnow')
    back('equipe'); assert 'Você e Naruto (Time 7) contra Gaara e Kankuro (Irmãos da Areia, rival direto)' in full_lineup(), full_lineup()
    shot(f'e9-rival-anime-{THEME}.png')
    into('equipe/rivais'); pg.click('#otherrival'); into('equipe/rivais/futebol'); pg.click('#teams [data-act=rival][data-v="futebol/santos"]'); pg.wait_for_selector('#panel[data-route="equipe"]')
    assert 'você e Naruto contra Neymar e Gabigol' in lineup() and 'Você e Naruto (Time 7) contra Neymar e Gabigol (Santos)' in full_lineup(), full_lineup()
    assert eles_bg() == '#f2f2f2', eles_bg()
    shot(f'e1-anime-{THEME}.png')
    # the colours follow the choice: the pack's, the team's, or the star's own ("Eles" by the rival's first the same way)
    rgb_of = lambda h: 'rgb(%d, %d, %d)' % tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
    want = lambda k: pg.evaluate(f'window.__APP.Core.colorsOf("{k}")[0]')
    for by, mine, theirs in (('char', 'naruto/time-7/0', 'futebol/santos/0'), ('pack', 'naruto', 'futebol'), ('team', 'naruto/time-7', 'futebol/santos')):
        colorby(by); assert top_bg() == rgb_of(want(mine)) and eles_bg() == want(theirs), (by, top_bg(), eles_bg())
    colorby('pack'); tab('jogar'); pg.evaluate('window.__APP.ui.wait = 1e6'); pg.click('[data-act=new]'); g = G()
    assert g['names'] == ['Você', 'Neymar', 'Naruto', 'Gabigol'] and g['sides'] == ['naruto', 'futebol'], g['sides']
    pg.click('[data-act=end]'); pg.click('[data-act=end]'); pg.evaluate('window.__APP.ui.wait = 20')
    colorby('team'); assert 'colorBy' not in S()
    # "Mais jeitos de montar a mesa" is gone (D19): not on the Equipe tab, and its old addresses fall back to a known screen
    tab('equipe'); assert pg.locator('[data-v^="equipe/mais"], #modes').count() == 0 and 'Mais jeitos' not in txt('#panel')
    pg.evaluate('location.hash = "#equipe/mais/montar"'); pg.wait_for_selector('#panel[data-route="equipe"]'); assert pg.locator('#slots, #picker').count() == 0
    pg.click('#club [data-act=team][data-v=""]'); assert 'team' not in S() and top_bg() == plain_top and 'Biu' in lineup()

    # ---------- ranking and glossary ----------
    tab('treinar'); into('treinar/ranking')
    pg.click('#gloss [data-act=vira][data-r="3"]')
    assert pg.locator('#glossrank li').count() == 13 and pg.locator('#glossrank li.man').count() == 4
    assert pg.locator('#glossrank li').first.locator('[data-c="4p"]').count() == 1 and 'zap' in txt('#glossrank li:first-child')
    assert 'manilha é 4' in txt('#gloss')
    back('treinar'); into('treinar/glossario'); assert 'Picafumo' in txt('#terms') and 'Cangar' in txt('#terms')
    back('treinar'); into('treinar/regras'); assert 'Baralho de 40 cartas' in txt('#rules')
    back('treinar')

    # ---------- training ----------
    pg.click('[data-act=drill][data-k=manilha]'); assert pg.locator('#drill').count() == 1 and pg.is_hidden('#tabs')
    d = pg.evaluate('window.__APP.ui.drill')
    pg.click(f'#drill [data-act=guess][data-v="{d["answer"]}"]')
    assert 'Isso!' in txt('#verdict') and S()['train'] == {'ok': 1, 'total': 1, 'best': 1}
    assert pg.locator('#drill [data-act=guess]:not([disabled])').count() == 0, 'one answer per question'
    pg.click('#drill [data-act=drill]'); d = pg.evaluate('window.__APP.ui.drill')
    wrong = next(o for o in d['options'] if o != d['answer'])
    pg.click(f'#drill [data-act=guess][data-v="{wrong}"]'); assert 'Não foi dessa vez' in txt('#verdict') and S()['train']['total'] == 2
    assert pg.locator('#drill .is-right').count() == 1 and pg.locator('#drill .is-wrong').count() == 1
    pg.click('[data-act=home]'); assert route() == 'treinar', 'out of a drill, back on Treinar'
    pg.click('[data-act=drill][data-k=manilha]'); assert pg.locator('#drill').count() == 1 and '#treinar/exercicio' in pg.url
    pg.go_back(); pg.wait_for_selector('#train'); assert route() == 'treinar' and pg.is_visible('#tabs'), 'the browser\'s back closes a drill'
    pg.click('[data-act=drill][data-k=round]')
    d = pg.evaluate('window.__APP.ui.drill'); assert pg.locator('#drill .dp').count() == 4
    pg.click(f'#drill [data-act=guess][data-v="{d["answer"]}"]'); assert 'Isso!' in txt('#verdict') and pg.locator('#drillrank li').count() == 13
    assert overflow() == 0; shot(f'e2-treino-{THEME}.png')
    pg.click('[data-act=brand]'); assert pg.locator('#train').count() == 1, 'the name at the top goes home from training'
    assert 'Acertos: 2 de 3' in txt('#trainstats') and 'Melhor sequência: 1' in txt('#trainstats')

    # ---------- the real table ----------
    tab('real'); pg.click('[data-act=real]'); assert 'Diga primeiro a vira' in txt('#realsay')
    def pick(target, card):
        pg.click(f'#real [data-act=sheet][data-v={target}]'); assert pg.locator('#sheet').count() == 1
        pg.click(f'#sheet button[data-c="{card}"]'); assert pg.locator('#sheet').count() == 0
    pick('vira', '6o'); assert 'manilha 7' in txt('#real').replace('\n', ' ')
    pg.click('#real [data-act=sheet][data-v=hand]'); assert pg.locator('#sheet button[data-c="6o"]').is_disabled(), 'a card already told is off'
    assert pg.locator('#sheet button[data-c="7p"] .pc.man').count() == 1, 'with the vira known the manilhas stand out'
    pg.click('[data-act=closesheet]'); assert pg.locator('#sheet').count() == 0
    for c in ('7p', '3o', 'Ke'): pick('hand', c)
    assert 'garantida' in txt('#real') and 'perde pra 3' in txt('#real') and 'não perde pra nenhuma' in txt('#realsay')
    for c in ('2p', '7c'): pick('table', c)
    assert 'a mais forte é 7 de copas' in txt('#realsay') and 'a mais barata que leva é 7 de paus (zap)' in txt('#realsay')
    assert pg.locator('#real .adv.best').count() == 1 and pg.locator('#realranking li').count() == 13
    assert overflow() == 0; shot(f'e3-mesa-real-{THEME}.png')
    pg.click('#real .realtable [data-act=untell][data-c="7c"]'); assert S()['real']['table'] == ['2p']
    pg.click('[data-act=nextround]'); assert S()['real']['gone'] == ['2p'] and S()['real']['table'] == []
    reload(); pg.click('[data-act=real]'); assert S()['real']['hand'] == ['7p', '3o', 'Ke'], 'the real table is kept on the device'
    pg.click('[data-act=resetreal]'); assert S()['real']['vira'] is None
    pg.click('[data-act=listen]'); pg.wait_for_function('window.__APP.S.real.hand.length === 3')
    assert S()['real']['vira'] == '7c' and S()['real']['hand'] == ['Qp', '3o', 'Ke'] and 'Ouvi:' in txt('#heard'), S()['real']
    pg.evaluate('window.__say = "bom dia"'); pg.click('[data-act=listen]'); pg.wait_for_function('!document.getElementById("toast").hidden')
    assert 'Não entendi' in txt('#toast')
    pg.click('#real [data-act=home]'); assert pg.locator('#realcard').count() == 1
    pg.click('[data-act=real]'); assert pg.locator('#real').count() == 1
    pg.go_back(); pg.wait_for_selector('#realcard'); assert route() == 'real' and S()['real']['hand'], 'the browser\'s back closes the assistant, which keeps the table'
    tab('jogar')

    # ---------- a game: a random start, played through the screen until the hand ends ----------
    pg.click('[data-act=new]'); g = G(); assert g and g['n'] == 1 and len(g['hands'][0]) == 3 and g['level'] == 'medio'
    def settle():
        pg.wait_for_function('(() => { const g = window.__APP.S.game; return !g || window.__APP.Core.whoActs(g) === 0 || g.phase === "handEnd" || g.phase === "over"; })()', timeout=20000)
    def finish_hand():
        for _ in range(40):
            settle(); g = G()
            if g['phase'] in ('handEnd', 'over'): return g
            if g['phase'] == 'eleven': pg.click('[data-act=eleven][data-v="1"]')
            elif g['phase'] == 'truco': pg.click('[data-act=answer][data-v=accept]')
            else: pg.click('#hand [data-act=play] >> nth=0')
        raise AssertionError('the hand did not end')
    before = G()['score']; g = finish_hand()
    assert g['phase'] == 'handEnd' and sum(g['score']) - sum(before) == (g['result']['points']), g['result']
    assert 'Fim da mão' in txt('#action') and pg.locator('[data-act=next]').count() == 1
    pg.click('[data-act=next]'); assert G()['n'] == 2

    def stack(game):
        """Puts a stacked game in place and reloads, so the screen starts from it. Chance is fixed high: nobody bluffs
        and every computer player plays by its rules, so the stacked game always goes the same way."""
        pg.evaluate('(g) => { const a = window.__APP; const base = a.Core.newGame(a.Core.seeded(1), "medio"); a.S.game = { ...base, log: [], ...g }; localStorage.setItem("truco.v1", JSON.stringify(a.S)); }', game)
        reload(); pg.evaluate('window.__realRandom = Math.random; Math.random = () => 0.99')

    # ---------- truco accepted, and a round taken by the suit (zap over copas) ----------
    stack({'vira': '4o', 'dealer': 3, 'starter': 0, 'turn': 0, 'hands': [['5c', '4e', '6o'], ['5p', '4c', '6e'], ['Ke', '7o', 'Qe'], ['Jo', 'Jc', '6c']]})
    assert pg.locator('#hand .pc.man').count() == 1 and 'copas' in txt('#hand') and pg.locator('#hand .pc small').count() == 3, 'rodinhas: the manilha and the places'
    assert 'manilha: 5' in txt('#vira')
    # you ask: the card says so by name, your chair stands out, and the one who answers for them is named (D15)
    pg.evaluate('window.__APP.ui.wait = 1e6'); pg.click('[data-act=truco]')
    assert txt('#asked') == 'Você pediu TRUCO!' and txt('#answerer') == 'Responde: Biu' and pg.locator('#seat0.asking .asktag').count() == 1 and pg.locator('#seat1.answering').count() == 1, (txt('#action'))
    assert txt('#stamp').startswith('TRUCO!') and txt('#stamp small') == 'Você pediu TRUCO!', txt('#stamp')
    shot(f'e8-pedido-voce-{THEME}.png')
    reload(); pg.evaluate('Math.random = () => 0.99')         # the test's long wait is gone after a reload: Biu answers now, same chance as above
    settle()
    g = G()
    assert g['phase'] == 'play' and g['shout'] == {'seat': 1, 'word': 'aceito'}, (g['phase'], g['shout'])     # Biu (zap in hand) accepts
    assert txt('#said') == 'Biu aceitou. A mão vale 3.' and txt('#stamp small') == 'Biu aceitou', (txt('#said'), txt('#stamp'))
    assert g['value'] == 3 and g['phase'] == 'play' and g['raisedBy'] == 0 and 'Aceito' in txt('#seat1') + txt('#seat1 .bubble') or g['value'] == 3, g
    assert pg.locator('[data-act=truco]').count() == 0, 'no raising twice in a row'
    pg.click('#hand [data-act=play][data-k="0"]')
    while True:                     # the others may raise on the way (a bluffed seis, say): accept and go on
        settle(); g = G()
        if g['rounds'] or g['phase'] != 'truco': break
        pg.click('[data-act=answer][data-v=accept]')
    pg.wait_for_function('window.__APP.S.game.rounds.length >= 1')
    assert G()['rounds'][0] == 1 and any('ganha no naipe' in l for l in G()['log']), G()['log'][-6:]
    g = finish_hand(); assert g['phase'] in ('handEnd', 'over') and g['value'] >= 3
    # the explanation of that round, on a table where it is your turn (nothing moves meanwhile)
    stack({'vira': '4o', 'dealer': 3, 'starter': 0, 'turn': 0, 'rounds': [1], 'hands': [['4e', '6o'], ['4c', '6e'], ['7o', 'Qe'], ['Jc', '6c']],
           'last': {'plays': [{'seat': 0, 'card': '5c'}, {'seat': 1, 'card': '5p'}, {'seat': 2, 'card': 'Ke'}, {'seat': 3, 'card': 'Jo'}], 'winner': 1}})
    assert 'decide o naipe' in txt('#explain') and 'zap > copas' in txt('#explain'), txt('#explain')
    assert pg.locator('#center .slot.won').count() == 1 and pg.locator('#status .dots i.eles').count() == 1
    assert overflow() == 0; shot(f'e4-naipe-{THEME}.png')

    # ---------- a tied third round (cangou): it goes to whoever took the first ----------
    stack({'vira': '7c', 'dealer': 3, 'starter': 0, 'turn': 0, 'rounds': [0, 1], 'hands': [['3o'], ['3e'], ['4o'], ['4c']]})
    pg.click('#hand [data-act=play][data-k="0"]'); g = finish_hand()
    assert g['rounds'] == [0, 1, -1] and g['result']['team'] == 0 and any('cangou' in l for l in g['log']), (g['rounds'], g['log'][-3:])

    # ---------- a bluff: Biu asks truco on nothing, you run, he shows his cards ----------
    stack({'vira': '4o', 'dealer': 3, 'starter': 0, 'turn': 0, 'hands': [['4e', '2e', 'Ac'], ['6e', '7o', 'Qe'], ['Ke', '7c', 'Jc'], ['Jo', '4c', '6c']]})
    pg.evaluate('Math.random = () => 0.01')       # chance says: bluff
    pg.click('#hand [data-act=play][data-k="0"]'); settle(); g = G(); assert g['phase'] == 'truco' and g['ask']['by'] == 1 and g['ask'].get('bluff') is True, g['phase']
    assert txt('#asked') == 'Biu pediu TRUCO!' and 'Cida cochicha' in txt('#tip') and 'TRUCO' in txt('#seat1 .bubble').upper(), txt('#action')
    assert txt('#answerer') == 'Responde: você, pela sua dupla.' and pg.locator('#seat1.asking .asktag').count() == 1 and 'PEDIU TRUCO' in txt('#seat1 .asktag').upper(), 'the chair of who asked stands out'
    assert txt('#stamp small') == 'Biu pediu TRUCO!', txt('#stamp')
    assert overflow() == 0; shot(f'e8-pedido-nome-{THEME}.png')
    # the whole game fits the window with no scrolling (D19): with the raise open, the vira, the whole hand and the buttons
    # to answer are inside the window, and the page does not scroll; also with the "versão nova" strip showing
    FIT = """() => { const H = innerHeight, W = innerWidth, out = [];
      const sel = ['#vira', '#hand', ...[...document.querySelectorAll('#hand .hc, [data-act=answer]')].map((e, i) => (e.dataset.fit = i, `[data-fit="${i}"]`))];
      for (const q of sel) { const e = document.querySelector(q); if (!e) { out.push(q + ' missing'); continue; } const r = e.getBoundingClientRect();
        if (r.top < 0 || r.bottom > H + 0.5 || r.left < 0 || r.right > W + 0.5 || r.height === 0) out.push(`${q} ${Math.round(r.top)}..${Math.round(r.bottom)} of ${H}`); }
      const se = document.scrollingElement; if (se.scrollHeight > H) out.push(`page scrolls: ${se.scrollHeight} > ${H}`);
      if (document.querySelectorAll('[data-act=answer]').length !== 3) out.push('answer buttons');
      return out; }"""
    for w, h in ((393, 852), (360, 640), (1920, 1080)):
        pg.set_viewport_size({'width': w, 'height': h}); pg.wait_for_timeout(50)
        assert G()['phase'] == 'truco' and pg.evaluate(FIT) == [], (w, h, pg.evaluate(FIT))
        assert overflow() == 0, (w, h); shot(f'e10-cabe-{w}x{h}-{THEME}.png')
        pg.evaluate("""() => { const u = document.getElementById('update'); u.hidden = false; u.innerHTML = '<div class="wrap"><span>Saiu uma versão nova do app.</span><button class="btn">Atualizar agora</button></div>'; }""")
        assert pg.evaluate(FIT) == [], ('with the new-version strip', w, h, pg.evaluate(FIT))
        pg.evaluate("() => { const u = document.getElementById('update'); u.hidden = true; u.innerHTML = ''; }")
    pg.set_viewport_size({'width': 393, 'height': 852})
    pg.evaluate('Math.random = window.__realRandom')
    pg.click('[data-act=answer][data-v=run]')
    assert txt('#stamp').startswith('Era blefe!') and txt('#stamp small') == 'Você correu', txt('#stamp')
    g = G(); assert g['phase'] == 'handEnd' and g['score'][1] == 1 and 'Era blefe!' in txt('#shown') and pg.locator('#shown .pc').count() == 3, g['result']
    assert overflow() == 0; shot(f'e5-blefe-{THEME}.png')

    # ---------- raises back and forth: you truco, Biu (a monster) asks seis, you nove, he doze; you run, they take 9 ----------
    stack({'vira': '4o', 'dealer': 3, 'starter': 0, 'turn': 0, 'hands': [['3o', '2e', 'Ac'], ['5p', '5c', '3e'], ['Ke', '7c', 'Jc'], ['Jo', '4c', '6c']]})
    pg.click('[data-act=truco]'); settle(); g = G()
    assert g['phase'] == 'truco' and g['ask'] == {'by': 1, 'value': 6, 'to': 0} and g['value'] == 3, g['ask']
    assert txt('#asked') == 'Biu pediu SEIS de volta!' and pg.locator('#seat1.asking').count() == 1 and pg.locator('#seat0.asking').count() == 0, txt('#asked')
    assert 'Nove!' in txt('[data-act=answer][data-v=raise]')
    pg.evaluate('window.__APP.ui.wait = 1e6'); pg.click('[data-act=answer][data-v=raise]')       # Biu waits: the stamp on screen is yours
    assert txt('#stamp small') == 'Você pediu NOVE de volta!', txt('#stamp')
    reload(); pg.evaluate('Math.random = () => 0.99')
    settle(); g = G()
    assert g['ask']['value'] == 12 and g['value'] == 9, g['ask']            # he went to doze over your nove
    assert txt('#asked') == 'Biu pediu DOZE de volta!', txt('#asked')
    assert pg.locator('[data-act=answer][data-v=raise]').count() == 0, 'nothing above doze'
    pg.click('[data-act=answer][data-v=run]'); assert G()['score'][1] == 9 and 'Correu' not in ''

    # ---------- a hand of eleven: you see Cida's cards; run once, then play ----------
    stack({'score': [11, 5], 'phase': 'handEnd', 'result': {'team': 0, 'points': 1, 'why': 'x'}, 'dealer': 0})
    pg.click('[data-act=next]'); g = G(); assert g['phase'] == 'eleven' and g['eleven'] == 0
    assert pg.locator('#partner .pc').count() == 3 and 'Mão de onze' in txt('#action')
    pg.click('[data-act=eleven][data-v="0"]'); assert G()['score'] == [11, 6] and G()['phase'] == 'handEnd'
    pg.click('[data-act=next]'); pg.click('[data-act=eleven][data-v="1"]'); g = G()
    assert g['phase'] == 'play' and g['value'] == 3 and pg.locator('[data-act=truco]').count() == 0
    # the other pair at 11 decides by itself
    stack({'score': [3, 11], 'phase': 'handEnd', 'result': {'team': 1, 'points': 1, 'why': 'x'}, 'dealer': 0})
    pg.click('[data-act=next]'); pg.wait_for_function('window.__APP.S.game.phase !== "eleven"')

    # ---------- a hand of iron: both at 11, blind ----------
    stack({'score': [11, 11], 'phase': 'handEnd', 'result': {'team': 1, 'points': 1, 'why': 'x'}, 'dealer': 3})
    pg.click('[data-act=next]'); g = G()
    assert g['blind'] and g['value'] == 1 and pg.locator('#hand .pc.back').count() == 3 and 'Mão de ferro' in txt('#view')
    pg.click('#hand [data-act=play][data-k="2"]'); pg.wait_for_function('window.__APP.S.game.played.length >= 1')
    assert len(G()['hands'][0]) == 2
    shot(f'e6-ferro-{THEME}.png')

    # ---------- "Avançar sozinho" on (D15): the end of a hand stays a moment, no button, then the next hand comes by itself ----------
    pg.click('[data-act=end]'); pg.click('[data-act=end]'); tab('ajustes'); pg.click('[data-act=auto][data-v=on]'); assert 'auto' not in S()
    stack({'vira': '7c', 'dealer': 3, 'starter': 0, 'turn': 0, 'rounds': [0, 1], 'hands': [['3o'], ['3e'], ['4o'], ['4c']]})
    pg.evaluate('window.__APP.ui.wait = 700')                  # the pause to read, fixed for the test (and the computer players' thinking)
    pg.click('#hand [data-act=play][data-k="0"]'); pg.wait_for_function('window.__APP.S.game.phase === "handEnd"', timeout=10000)
    assert pg.locator('[data-act=next]').count() == 0 and pg.is_visible('#autonext') and 'sozinha' in txt('#autonext') and 'Nós 1' in txt('#score'), 'the hand ends with the result and the score, and no button'
    assert pg.locator('#center .pc').count() == 4, 'the last cards stay on the table during the pause'
    shot(f'e8-avancar-sozinho-{THEME}.png')
    pg.wait_for_function('window.__APP.S.game.n === 2', timeout=5000); g = G()
    assert g['phase'] in ('play', 'eleven') and g['score'] == [1, 0] and len(g['hands'][0]) == 3, 'the next hand was dealt by itself'

    # ---------- the end of a game: you take the last hand, confetti, the summary, the tally ----------
    stack({'vira': '7c', 'score': [11, 3], 'value': 1, 'dealer': 3, 'starter': 0, 'turn': 0, 'rounds': [0], 'hist': [{'team': 1, 'points': 3, 'how': 'Eles levaram a mão.', 'value': 3}], 'hands': [['Qp'], ['4e'], ['5e'], ['6e']]})
    reload()
    assert 'Nós 11' in txt('#score') and pg.locator('#hand [data-act=play]').count() == 1
    pg.click('#hand [data-act=play][data-k="0"]'); settle(); pg.wait_for_function('window.__APP.S.game.phase === "over"')
    g = G(); assert g['winner'] == 0 and g['score'] == [12, 3]
    pg.wait_for_timeout(300); assert G()['phase'] == 'over' and pg.locator('[data-act=again]').count() == 1, 'with "Avançar sozinho" on, the end of a game still waits'
    assert 'Vocês venceram' in txt('#action') and pg.locator('#summary li').count() == 2 and pg.evaluate('document.getElementById("confetti").children.length') > 0
    assert S()['tally'] == {'w': 1, 'l': 0}
    assert overflow() == 0; shot(f'e7-fim-{THEME}.png')
    pg.click('[data-act=home]'); assert 'Neste aparelho: 1 vitória e 0 derrotas' in txt('#tally')
    # without rodinhas the table is a plain table
    tab('ajustes'); pg.click('[data-act=hints][data-v=off]'); tab('jogar'); pg.click('[data-act=new]')
    settle(); assert pg.locator('#explain').count() == 0 and pg.locator('#hand .pc small').count() == 0 and pg.locator('#rank').count() == 0
    pg.click('[data-act=end]'); assert G() is not None and 'Toque de novo' in txt('[data-act=end]')
    pg.click('[data-act=end]'); assert G() is None and pg.locator('#start').count() == 1
    tab('ajustes'); pg.click('[data-act=hints][data-v=on]'); tab('jogar')
    saved = json.loads(pg.evaluate(f'localStorage.getItem("{KEY}")')); assert saved['game'] is None and saved['tally']['w'] == 1

    # ---------- every screen of the tree: by its address, no screen absurdly tall, a capture of each ----------
    tall = {}
    for r in ('jogar', 'jogar/online', 'treinar', 'treinar/ranking', 'treinar/glossario', 'treinar/regras', 'real', 'equipe', 'equipe/time',
              'equipe/time/futebol', 'equipe/time/anime', 'equipe/time/anime/naruto', 'equipe/time/jogos', 'equipe/rivais', 'ajustes'):
        pg.evaluate(f'location.hash = "#{r}"'); pg.wait_for_selector(f'#panel[data-route="{r}"]')
        assert (r.count('/') > 0) == (pg.locator('#panel [data-act=back]').count() == 1), f'a way back below the root of a tab: {r}'
        h = pg.evaluate('document.documentElement.scrollHeight'); tall[r] = round(h / 852, 1)
        assert h <= 3 * 852 and overflow() == 0, (r, h)
        shot(f'e0-{r.replace("/", "-")}-{THEME}.png')
    # the team lists keep the app's colours: a team's colours only in the small strip of each line
    pg.evaluate('location.hash = "#equipe/time/futebol"'); pg.wait_for_selector('#panel[data-route="equipe/time/futebol"]')
    bgs = pg.evaluate('[...new Set([...document.querySelectorAll("#teams .item")].map(e => getComputedStyle(e).backgroundColor))]')
    assert len(bgs) == 1, ('one background for every team line', bgs)
    print('alturas (em telas de 852 px):', tall)
    cov.stop(pg, f'e2e-{THEME}')
    assert not errs, errs

    # ---------- with motion on: the hand is dealt, a card flies in, TRUCO! is stamped ----------
    mctx = b.new_context(viewport=dict(width=393, height=852), color_scheme=THEME, locale='pt-BR', reduced_motion='no-preference')
    mctx.route('**/*', lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
    mp = mctx.new_page(); merrs = []
    mp.on('pageerror', lambda e: merrs.append(str(e)))
    cov.start(mp)
    mp.goto((ROOT / 'dist' / 'index.html').as_uri()); mp.wait_for_function('window.__APP && window.__APP.S'); mp.evaluate('window.__APP.ui.wait = 1e6')
    mp.click('[data-act=new]'); assert mp.locator('#hand .hc.deal').count() == 3, 'a new hand is dealt in a fan'
    mp.evaluate('''() => { const a = window.__APP; Object.assign(a.S.game, { vira: "4o", starter: 0, turn: 0, phase: "play", hands: [["5c", "4e", "6o"], ["5p", "4c", "6e"], ["Ke", "7o", "Qe"], ["Jo", "Jc", "6c"]] }); a.ui.wait = 20; }''')
    mp.evaluate('Math.random = () => 0.99')                      # the same chance every run: Biu (zap in hand) accepts the truco
    mp.click('[data-act=end]')                                    # a repaint with nothing new: the hand is not dealt again
    assert mp.locator('#hand .hc.deal').count() == 0
    # every stamp shown is recorded: since D15 the answer is stamped too ("Aceito!"), and it may come before a look at the screen
    mp.evaluate('''() => { window.__stamps = []; const s = document.getElementById("stamp"); new MutationObserver(() => { if (s.classList.contains("go")) window.__stamps.push(s.textContent); }).observe(s, { attributes: true, attributeFilter: ["class"] }); }''')
    mp.click('[data-act=truco]'); mp.wait_for_function('window.__stamps.length >= 1')
    assert mp.evaluate('window.__stamps')[0] == 'TRUCO!Você pediu TRUCO!', mp.evaluate('window.__stamps')
    mp.wait_for_function('window.__APP.S.game.phase === "play"')
    mp.evaluate('window.__APP.ui.wait = 1e6')                    # the others wait: the card on the table is yours
    mp.click('#hand [data-act=play][data-k="1"]'); assert 'out' in (mp.get_attribute('#hand [data-k="1"]', 'class') or ''), 'the card lifts off the hand'
    mp.wait_for_function('window.__APP.S.game.played.length >= 1')
    mp.wait_for_selector('#center .slot.fly')
    cov.stop(mp, f'e2e-motion-{THEME}')
    assert not merrs, merrs
    b.close()
print(f'e2e ok ({THEME}): quem pediu pelo nome (cartão, cadeira, carimbo, quem responde, de volta, aceitou, correu), avançar sozinho ligado e desligado (o fim da partida espera), equipe contra equipe (resumo, nomes no placar e na mesa), abas embaixo e telas em árvore (ir, voltar, voltar do navegador, teclado, endereço, o voltar do navegador fechando o treino e o assistente, a altura de cada tela, as listas sem a cor das equipes no fundo), ícone, início, sua equipe (abas do catálogo, nomes, cores, nomes trocados, rivais entre temas, anime contra clube, cores do tema, da equipe e da dupla, sem Mais jeitos de montar a mesa), níveis, tema e ajustes, ranking e glossário, treino (certo e errado), mesa real pela grade e pela voz, partida pela tela, rodada ganha no naipe, cangada, truco aceito, blefe com cartas mostradas, seis e doze, mão de onze dos dois lados, mão de ferro às cegas, fim de jogo com confete e resumo, sem rodinhas, encerrar no meio, guardado no aparelho, animações com movimento, a partida inteira na janela sem rolar (393×852, 360×640, 1920×1080, com e sem o aviso de versão nova), sem estouro de largura e sem erro de script')
