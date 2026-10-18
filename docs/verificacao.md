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
| Sair no meio da partida põe a IA na hora (e passa o papel de quem criou), a conexão caída mostra a faixa e depois "Sem conexão" com "Tentar de novo", a volta para sala apagada ou lugar tomado é dita, e o nome vazio e o código errado aparecem no campo | `node tests/core.mjs` e `python3 tests/e2e_online.py dark` e `light` | 17/10/2026 |
| O servidor de salas monta para a Cloudflare e os tipos dele fecham | `npx wrangler@4.145.0 deploy --dry-run` e `tsc -p server` | 17/10/2026 |
| O servidor de salas na Cloudflare (https://truco-salas.lucasbarbosa1738.workers.dev): sala criada e achada pelo código, a sala parada 40 min e de pé de novo (hibernação), cada página só com as próprias cartas, uma mão inteira jogada pelas duas páginas com a Cida e o Toinho jogando no servidor (alarmes), placar espelhado, aviso e "IA no lugar" quando o amigo saiu | duas abas da produção (commit `8bd35c5`) no navegador do Lucas, apontadas para o servidor por `ui.server` | 17/10/2026 |
| Os limites do servidor de salas, no servidor local: mensagem grande fechada com 1009, enxurrada fechada com 1008, quem joga normal não é cortado, sala com 12 conexões recusa a 13ª com 429 e as outras salas seguem, código inválido dá 404 | `node tests/room_limits.mjs` e os casos de `allow`, `tooBig` e `roomFull` em `tests/unit.cases.mjs` | 17/10/2026 |
| A sala sobrevive a dormir entre duas jogadas: com a sala gravada em JSON e lida de volta por `readRoom` a cada mensagem e a cada jogada das IAs (como o Durable Object faz ao hibernar), uma partida inteira termina igual à da sala na memória, com a mesma semente (com truco, seis, corrida e mão de onze pelo caminho), e o mesmo e2e online de duas pessoas passa | `node tests/core.mjs` (caso "a room that sleeps…") e `python3 tests/e2e_online.py dark dormindo` (`HIBERNATE=1` no `tests/room_server.mjs`); conferido que um `readRoom` que perde um campo ou recusa a sala faz os dois falharem | 17/10/2026 |
| Temas (D9): o catálogo com futebol, três animes e dois jogos, ids únicos e três personagens por equipe, contraste de 4,5 ou mais em toda cor declarada, id antigo de clube lido como `futebol/<id>` (ajustes e partida salva), a mesa montada, as cores por tema, equipe ou dupla, e a mesa de quem criou a sala chegando às IAs online | casos do catálogo em `tests/unit.cases.mjs` (`node tests/core.mjs` e `python3 tests/unit.py`) | 18/10/2026 |
| Pela tela, nos dois temas: as abas vindas do catálogo, um time de anime contra um clube, a mesa montada com Street Fighter e Mortal Kombat, trocar a ordem, sortear, as cores seguindo o tema, a equipe e a dupla, e a mesa montada guardada depois de recarregar | `python3 tests/e2e.py dark` e `light` | 18/10/2026 |

## Não verificado

| Afirmação | Por que não | Como verificar |
|---|---|---|
| O reconhecimento de voz entendendo cartas faladas | Os testes leem texto; ninguém falou no microfone ainda | Abrir a mesa real no celular, tocar em "Falar a carta" e dizer "vira sete de copas" |
| O service worker no Safari do iPhone e no app instalado na Tela de Início | Os testes rodam no Chromium | Abrir a produção no iPhone, ligar o modo avião e abrir de novo |
| Os limites contra abuso no servidor da Cloudflare (1009, 1008, 429) | Daqui não alcanço o workers.dev; os testes usam o servidor local, com o mesmo núcleo | Depois do merge e do deploy pelo workflow `Salas`, mandar uma mensagem grande por um socket aberto na produção e ver a conexão fechar |
| Uma partida inteira na Cloudflare com a sala dormindo entre as jogadas | Na Cloudflare foi uma mão depois de 40 min parada; a simulação local grava em JSON, e o storage da Cloudflare grava por clone estruturado (aceita mais coisas que o JSON, então o JSON é o mais exigente dos dois) | Jogar uma partida até o fim com pausas longas no meio |
| Sair, cair e sala apagada no servidor da Cloudflare | Os testes usam o `tests/room_server.mjs`, com o mesmo núcleo; o `worker.ts` só passou a mandar `drop` no lugar de `leave` quando a conexão fecha | Depois do merge: duas abas na produção, uma sai no meio e a IA entra na hora |
| Os nomes dos personagens e das equipes dos animes e dos jogos | Vieram da memória do agente, sem conferir na web (D9) | Olhar as equipes no app e trocar o que estiver diferente |
| A mesa de quem criou a sala chegando às IAs numa sala de verdade | Coberto só pelo caso do núcleo; nem o e2e online nem a Cloudflare olharam isso | Criar uma sala com uma mesa montada, começar e ver os nomes das IAs |
| Jogar online pelo 4G | Os testes rodam na mesma máquina | Jogar uma partida com um amigo fora do Wi-Fi |
| Os três jogadores de cada clube ainda estarem no clube | Elencos mudam; a fonte são prévias de julho a outubro de 2026 (D6) | Conferir o time da pessoa e trocar no app o que estiver velho |
| Se o difícil é difícil para uma pessoa | A medição foi IA contra IA | Jogar umas partidas e anotar |
