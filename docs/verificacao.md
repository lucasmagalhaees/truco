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
| Sala com 3 pessoas: só quem criou escolhe o formato, antes de começar; no "2 contra 1" quem foi escolhido joga com a IA e os outros dois sentam de frente e se veem como dupla (na sala e na partida, de cada lugar); "3 duplas" começa com as três pessoas nos lugares 0, 1 e 2, cada uma vendo a mesa de 6 do próprio lugar; com 4 pessoas o formato não pesa; sala antiga sem o campo abre como mesa de 4 | casos "three people…" em `tests/unit.cases.mjs` (`node tests/core.mjs`) e o trecho de três celulares de `python3 tests/e2e_online.py` | 18/10/2026 |
| Três duplas pela tela, com três celulares no servidor local: mesa de 6 sem passar da largura de 393 px (também com nomes longos e balões nas laterais), placar com três números, cada celular só com as próprias cartas, o truco do amigo respondido pelas duas duplas (uma aceita, a outra corre e sai da mão, com "saiu da mão" nas cadeiras dela), e uma partida inteira de 3 duplas pela sala até 12 nos casos do núcleo | trecho final de `python3 tests/e2e_online.py` e casos "three pairs…" em `tests/unit.cases.mjs` | 18/10/2026 |
| O balão de fala das cadeiras laterais não passa da borda da tela (era a causa da tela 1 px mais larga que aparecia às vezes no `online-light`: "Truco! Desce!" e "DOZE e acabou!" na cadeira da direita passavam até 9 px) | todas as falas em cada cadeira lateral, medidas por `scrollWidth` no Chromium, mesa de 4 e de 6 | 18/10/2026 |
| Sair no meio da partida põe a IA na hora (e passa o papel de quem criou), a conexão caída mostra a faixa e depois "Sem conexão" com "Tentar de novo", a volta para sala apagada ou lugar tomado é dita, e o nome vazio e o código errado aparecem no campo | `node tests/core.mjs` e `python3 tests/e2e_online.py dark` e `light` | 17/10/2026 |
| O servidor de salas monta para a Cloudflare e os tipos dele fecham | `npx wrangler@4.145.0 deploy --dry-run` e `tsc -p server` | 17/10/2026 |
| O servidor de salas na Cloudflare (https://truco-salas.lucasbarbosa1738.workers.dev): sala criada e achada pelo código, a sala parada 40 min e de pé de novo (hibernação), cada página só com as próprias cartas, uma mão inteira jogada pelas duas páginas com a Cida e o Toinho jogando no servidor (alarmes), placar espelhado, aviso e "IA no lugar" quando o amigo saiu | duas abas da produção (commit `8bd35c5`) no navegador do Lucas, apontadas para o servidor por `ui.server` | 17/10/2026 |
| Os limites do servidor de salas, no servidor local: mensagem grande fechada com 1009, enxurrada fechada com 1008, quem joga normal não é cortado, sala com 12 conexões recusa a 13ª com 429 e as outras salas seguem, código inválido dá 404 | `node tests/room_limits.mjs` e os casos de `allow`, `tooBig` e `roomFull` em `tests/unit.cases.mjs` | 17/10/2026 |
| A sala sobrevive a dormir entre duas jogadas: com a sala gravada em JSON e lida de volta por `readRoom` a cada mensagem e a cada jogada das IAs (como o Durable Object faz ao hibernar), uma partida inteira termina igual à da sala na memória, com a mesma semente (com truco, seis, corrida e mão de onze pelo caminho), e o mesmo e2e online de duas pessoas passa | `node tests/core.mjs` (caso "a room that sleeps…") e `python3 tests/e2e_online.py dark dormindo` (`HIBERNATE=1` no `tests/room_server.mjs`); conferido que um `readRoom` que perde um campo ou recusa a sala faz os dois falharem | 17/10/2026 |
| As regras de 3 duplas (6 lugares): pedido respondido pelas duas outras duplas, correr tirando a dupla da mão, as duas correndo, 1 a 1 a 1, cangada entre duplas diferentes, mão de onze e de ferro, a mesa girada para cada pessoa, a partida salva lida de volta, e partidas inteiras de 6 IAs nos três níveis terminando | `node tests/core.mjs` e `python3 tests/unit.py` | 18/10/2026 |

## Não verificado

| Afirmação | Por que não | Como verificar |
|---|---|---|
| O reconhecimento de voz entendendo cartas faladas | Os testes leem texto; ninguém falou no microfone ainda | Abrir a mesa real no celular, tocar em "Falar a carta" e dizer "vira sete de copas" |
| O service worker no Safari do iPhone e no app instalado na Tela de Início | Os testes rodam no Chromium | Abrir a produção no iPhone, ligar o modo avião e abrir de novo |
| Os limites contra abuso no servidor da Cloudflare (1009, 1008, 429) | Daqui não alcanço o workers.dev; os testes usam o servidor local, com o mesmo núcleo | Depois do merge e do deploy pelo workflow `Salas`, mandar uma mensagem grande por um socket aberto na produção e ver a conexão fechar |
| Uma partida inteira na Cloudflare com a sala dormindo entre as jogadas | Na Cloudflare foi uma mão depois de 40 min parada; a simulação local grava em JSON, e o storage da Cloudflare grava por clone estruturado (aceita mais coisas que o JSON, então o JSON é o mais exigente dos dois) | Jogar uma partida até o fim com pausas longas no meio |
| Sair, cair e sala apagada no servidor da Cloudflare | Os testes usam o `tests/room_server.mjs`, com o mesmo núcleo; o `worker.ts` só passou a mandar `drop` no lugar de `leave` quando a conexão fecha | Depois do merge: duas abas na produção, uma sai no meio e a IA entra na hora |
| As 3 duplas pela tela e numa sala de verdade | Só o núcleo existe; a mesa de 6 e a escolha do formato na sala ainda não | Depois da tela, abrir uma sala com 3 celulares |
| As 3 duplas boas de jogar com gente de verdade, e a IA jogando bem com 6 | Os testes jogam pela tela com regras fixas (aceitar, correr, a primeira carta); ninguém jogou uma partida de 3 duplas | Jogar uma partida com dois amigos |
| Jogar online pelo 4G | Os testes rodam na mesma máquina | Jogar uma partida com um amigo fora do Wi-Fi |
| Os três jogadores de cada clube ainda estarem no clube | Elencos mudam; a fonte são prévias de julho a outubro de 2026 (D6) | Conferir o time da pessoa e trocar no app o que estiver velho |
| Se o difícil é difícil para uma pessoa | A medição foi IA contra IA | Jogar umas partidas e anotar |
