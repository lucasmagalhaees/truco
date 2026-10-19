"""Docs-versus-code check: what the documentation states must be true of the repository.

Usage: python3 tests/docs_check.py
Documentation written from memory drifts. This script pins the claims that can be checked mechanically: links, listed
files, modules, constants, storage keys, versions and rules of the code. No browser, no network. A number quoted in
CLAUDE.md gets a line in CONSTANTS; a rule of the code that can be read off the source gets a check().
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
read = lambda rel: (ROOT / rel).read_text(encoding='utf-8')
fails, n = [], 0

def check(name, cond, detail=''):
    global n
    n += 1
    if not cond:
        fails.append(f'{name}{": " + str(detail) if detail else ""}')

SRC = sorted((ROOT / 'src').rglob('*.ts'))
CORE = [p for p in SRC if '/src/core/' in p.as_posix()]
code = '\n'.join(p.read_text(encoding='utf-8') for p in SRC)
spec, readme, contributing = read('CLAUDE.md'), read('README.md'), read('CONTRIBUTING.md')
MD = [p for p in ROOT.rglob('*.md') if not any(x in p.as_posix() for x in ('.git/', 'node_modules'))]

# 1. every relative link in every markdown file points at something that exists
for md in MD:
    for target in re.findall(r'\]\(([^)\s]+)\)', md.read_text(encoding='utf-8')):
        if re.match(r'^(https?:|mailto:|#)', target):
            continue
        check(f'link in {md.relative_to(ROOT)}', (md.parent / target.split('#')[0]).resolve().exists(), target)

# 2. every path in the README "Estrutura" block exists
block = re.search(r'## Estrutura\s+```\n(.*?)```', readme, re.S)
check('README has an "Estrutura" block', bool(block))
for line in (block.group(1).splitlines() if block else []):
    if line.strip():
        check('README lists a path that exists', (ROOT / line.split()[0]).exists(), line.split()[0])

# 3. files the docs name in backticks exist
for rel in set(re.findall(r'`((?:src|tests|docs|scripts|\.github|\.claude)/[\w./-]+)`', spec + readme + contributing)):
    if rel.endswith('...') or rel.startswith(('tests/shots', 'tests/.build', 'tests/.coverage')):
        continue                      # branch-name patterns, and output that only exists after a test run
    check('documented path exists', (ROOT / rel).exists(), rel)

# 4. numbers quoted in the spec are the numbers in the code: (regex over src/, text that must be in CLAUDE.md)
CONSTANTS = [
    (r'const CHECK_EVERY = 30 \* 60e3;', 'a cada 30 min com ele aberto (`CHECK_EVERY`)'),
    (r'export const WIN_POINTS = 12;', 'Vence quem fizer 12 pontos (`WIN_POINTS`)'),
    (r'export const HAND_SIZE = 3;', '3 cartas para cada um (`HAND_SIZE`)'),
    (r'export const VALUES = \[1, 3, 6, 9, 12\];', 'A mão vale 1; truco 3, seis 6, nove 9, doze 12 (`VALUES`)'),
    (r'export const ELEVEN = 11, ELEVEN_VALUE = 3;', 'com 11 pontos (`ELEVEN`)'),
    (r"export const RANKS = \['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'\] as const;", 'sequência 4 5 6 7 Q J K A 2 3 (`RANKS`)'),
    (r"export const SUITS = \['o', 'e', 'c', 'p'\] as const;", 'ouros < espadas < copas < paus (`SUITS`)'),
    (r"export const THINK: Record<Speed, number> = \{ calma: 1500, normal: 900, rapida: 400 \};", 'calma 1,5 s, normal 0,9 s, rápida 0,4 s (`THINK`)'),
    (r'export const ROUND_PAUSE = 700;', 'mais 0,7 s depois de uma rodada fechada (`ROUND_PAUSE`)'),
    (r"export const HAND_PAUSE: Record<Speed, number> = \{ calma: 4500, normal: 3000, rapida: 2000 \};", 'calma 4,5 s, normal 3 s, rápida 2 s (`HAND_PAUSE`)'),
    (r'export const ROOM_HAND_PAUSE = 3000;', 'depois de 3 s (`ROOM_HAND_PAUSE`)'),
    (r'export const HOST_NEXT_AFTER = 4000;', 'depois de mais 4 s (`HOST_NEXT_AFTER`)'),
    (r"export const TEAMS_CHECKED = '14/10/2026';", 'conferidos em `TEAMS_CHECKED`'),
    (r'export const ROOM_THINK = 900, ROOM_ROUND_PAUSE = 700;', 'depois de 0,9 s (`ROOM_THINK`), mais 0,7 s depois de uma rodada fechada (`ROOM_ROUND_PAUSE`)'),
    (r'export const NAME_MAX = 16, CODE_LEN = 5;', 'um código de 5 letras (`CODE_LEN`)'),
    (r'export const MSG_MAX = 1024;', 'mensagem acima de 1024 bytes (`MSG_MAX`) fecha a conexão com 1009'),
    (r'export const RATE_BURST = 20, RATE_PER_S = 5;', 'até 20 mensagens de uma vez e ganha 5 por segundo (`RATE_BURST`, `RATE_PER_S`)'),
    (r'export const EXTREME_SAMPLES = 100;', 'nas mãos ocultas, `EXTREME_SAMPLES` vezes'),
    (r'export const CONN_MAX = 12;', 'até 12 conexões ao mesmo tempo (`CONN_MAX`)'),
    (r'export const CLOSE_BIG = 1009, CLOSE_FAST = 1008;', 'passou disso fecha com 1008'),
    (r"export const ROOM_SERVER = 'wss://truco-salas.lucasbarbosa1738.workers.dev';", 'O endereço dele é `wss://truco-salas.lucasbarbosa1738.workers.dev` (`ROOM_SERVER` no `vite.config.js`)'),
    (r'export const H2H_MAX = 200;', 'os `H2H_MAX` confrontos mais recentes, 200'),
    (r"export const SEATS = \['Você', 'Biu', 'Cida', 'Toinho'\];", 'Você e Cida contra Biu e Toinho (`SEATS`)'),
]
for pattern, phrase in CONSTANTS:
    check(f'code has {pattern}', re.search(pattern, code + read('src/sw.js') + read('vite.config.js')) is not None)
    check(f'spec says "{phrase}"', phrase in spec)
verify = read('scripts/verify.sh')
check('the coverage minimums are the ones the spec gives', '--min-functions 95 --min-chars 90' in verify and '95% das funções e 90% do código' in spec)

# 5. every module is in the architecture tables of the spec
for p in SRC:
    rel = p.relative_to(ROOT).as_posix()
    check('module is documented in CLAUDE.md', f'`{rel}`' in spec, rel)
check('the service worker is documented', '`src/sw.js`' in spec)

# 6. the core is pure: no page, no network, no storage
for p in CORE:
    src = p.read_text(encoding='utf-8')
    for token in ('document.', 'window.', 'localStorage', 'sessionStorage', 'fetch(', 'navigator.', 'XMLHttpRequest', "from '../app"):
        check(f'{p.name} does not touch {token}', token not in src)

# 7. TypeScript as the spec says: strict, no unused names, nothing switched off
ts = json.loads(read('tsconfig.json'))['compilerOptions']
check('tsconfig is strict', ts.get('strict') is True and ts.get('noUnusedLocals') is True)
check('no @ts-ignore or @ts-nocheck anywhere', '@ts-ignore' not in code and '@ts-nocheck' not in code)

# 8. exact versions of the build, and the spec names them
dev = json.loads(read('package.json'))['devDependencies']
check('build tools pinned to exact versions', all(re.fullmatch(r'\d+\.\d+\.\d+', v) for v in dev.values()), dev)
check('the spec names the versions in package.json', f"Vite {dev.get('vite')} com TypeScript {dev.get('typescript')}" in spec, dev)

# 9. the dark palette is the same where the device asks for it and where the person chooses it
css = read('src/styles.css')
a = re.search(r':root:not\(\[data-theme="light"\]\)\{(.*?)\}', css, re.S); b = re.search(r':root\[data-theme="dark"\]\{(.*?)\}', css, re.S)
norm = lambda m: re.sub(r'\s+', '', m.group(1)) if m else None
check('the two copies of the dark palette are identical', a and b and norm(a) == norm(b))

# 10. the commit stamp: put in the page by the build, read by the production check
check('the page has the commit stamp the build fills in', '<meta name="app-commit" content="__APP_COMMIT__">' in read('index.html') and "replace('__APP_COMMIT__', commit())" in read('vite.config.js') and 'VERCEL_GIT_COMMIT_SHA' in read('vite.config.js'))
prod = read('scripts/check_production.py')
check('the production check reads that stamp', 'app-commit' in prod)
url = re.search(r"DEFAULT_URL = '([^']+)'", prod)
check('the production address is the same in the check and in the spec', url and url.group(1).rstrip('/') in spec, url and url.group(1))

# 11. what the app keeps on the device is documented
for key in set(re.findall(r"LS\.(?:get|set)\('([^']+)'", code)):
    check('localStorage key is documented', f'`{key}`' in spec, key)

# 12. no select of the system: its list is drawn by the device, with colours of its own
check('no <select> in the app', '<select' not in code and '<select' not in read('index.html') and 'Nenhum seletor do sistema' in spec)

# 13. the service worker: the version the build stamps, the cache the spec names, and nothing kept from elsewhere by default
sw = read('src/sw.js')
check('the worker carries the version placeholder the build replaces', sw.count("'__APP_VERSION__'") == 1 and "replace('__APP_VERSION__', version)" in read('vite.config.js'))
check('the cache of the page is the one the spec names', "'truco-page-'" in sw and '`truco-page-<versão>`' in spec)
check('a new version waits for the tap', "event.data === 'activate'" in sw and 'skipWaiting' in sw and sw.count('skipWaiting') == 1)

# 14. the test handle, and the checks the branch protection asks for
main = read('src/main.ts')
check('window.__APP is what the spec says', 'window.__APP = { Core, ui, get S() { return S; }, get room() { return net.view; } };' in main and '`{Core, ui, S, room}`' in spec)
ci = read('.github/workflows/ci.yml')
check('the checks the main branch requires exist in CI', 'name: checks' in ci and "name: e2e (${{ matrix.theme }})" in ci and 'theme: [dark, light]' in ci and '`checks`, `e2e (dark)` e `e2e (light)`' in spec)

for f in fails:
    print('FAIL', f)
print(f'{n - len(fails)}/{n} documentation claims hold')
sys.exit(1 if fails else 0)
