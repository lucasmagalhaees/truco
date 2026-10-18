# Verificação

O que foi verificado, como e quando; e o que não foi. Um item só entra em "Verificado" com o comando (ou a observação) e a data.

## Verificado

| Afirmação | Como | Quando |
|---|---|---|
| As regras (força das cartas, naipe, cangada, mão, pedidos, mão de onze e de ferro, fim de jogo), as IAs dos três níveis, o treino, o assistente da mesa real e o estado salvo passam nos casos sem página | `node tests/core.mjs` | 14/10/2026 |
| Partidas IA contra IA terminam em todos os níveis, sem travar, e o estado de cada passo é lido de volta | simulação de 6.000 partidas com o núcleo (D3) | 14/10/2026 |
| A página gerada passa nos mesmos casos | `python3 tests/unit.py` | 14/10/2026 |
| A documentação bate com o código, inclusive os números das regras | `python3 tests/docs_check.py` | 14/10/2026 |
| Pela tela, nos dois temas, no Chromium em tamanho de celular: treino, ranking, mesa real (grade e voz simulada), partida, naipe, cangada, pedidos até o doze, blefe mostrado, mão de onze e de ferro, fim de jogo; 16 execuções seguidas sem falha | `python3 tests/e2e.py dark` e `light` | 14/10/2026 |
| O app abre sem internet e troca de versão com um toque, no Chromium | `python3 tests/pwa.py` | 14/10/2026 |
| Cobertura de 96,8% das funções e 97,3% do código | `scripts/verify.sh` | 14/10/2026 |
| A produção (https://turco-six.vercel.app) servindo o merge do PR #1 (`fa495e3`, carimbo `app-commit` da página) | página lida pela web | 14/10/2026 |

| Duas pessoas numa sala, cada uma no seu navegador, pelo servidor local: cada uma só vê as próprias cartas, partida pela tela, truco, cair e voltar, IA no lugar de quem saiu (nos dois temas) | `python3 tests/e2e_online.py dark` e `light` | 17/10/2026 |
| O servidor de salas monta para a Cloudflare e os tipos dele fecham | `npx wrangler@4.145.0 deploy --dry-run` e `tsc -p server` | 17/10/2026 |

| O servidor de salas na Cloudflare (https://truco-salas.lucasbarbosa1738.workers.dev): sala criada e achada pelo código, a sala parada 40 min e de pé de novo (hibernação), cada página só com as próprias cartas, uma mão inteira jogada pelas duas páginas com a Cida e o Toinho jogando no servidor (alarmes), placar espelhado, aviso e "IA no lugar" quando o amigo saiu | duas abas da produção (commit `8bd35c5`) no navegador do Lucas, apontadas para o servidor por `ui.server` | 17/10/2026 || Os limites do servidor de salas, no servidor local: mensagem grande fechada com 1009, enxurrada fechada com 1008, quem joga normal não é cortado, sala com 12 conexões recusa a 13ª com 429 e as outras salas seguem, código inválido dá 404 | `node tests/room_limits.mjs` e os casos de `allow`, `tooBig` e `roomFull` em `tests/unit.cases.mjs` | 17/10/2026 |

## Não verificado

| Afirmação | Por que não | Como verificar |
|---|---|---|
| O reconhecimento de voz entendendo cartas faladas | Os testes leem texto; ninguém falou no microfone ainda | Abrir a mesa real no celular, tocar em "Falar a carta" e dizer "vira sete de copas" |
| O service worker no Safari do iPhone e no app instalado na Tela de Início | Os testes rodam no Chromium | Abrir a produção no iPhone, ligar o modo avião e abrir de novo |
| Os limites contra abuso no servidor da Cloudflare (1009, 1008, 429) | Daqui não alcanço o workers.dev; os testes usam o servidor local, com o mesmo núcleo | Depois do merge e do deploy pelo workflow `Salas`, mandar uma mensagem grande por um socket aberto na produção e ver a conexão fechar |
| Jogar online pelo 4G | Os testes rodam na mesma máquina | Jogar uma partida com um amigo fora do Wi-Fi |
| Os três jogadores de cada clube ainda estarem no clube | Elencos mudam; a fonte são prévias de julho a outubro de 2026 (D6) | Conferir o time da pessoa e trocar no app o que estiver velho |
| Se o difícil é difícil para uma pessoa | A medição foi IA contra IA | Jogar umas partidas e anotar |
