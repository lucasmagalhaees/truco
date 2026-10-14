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

## Não verificado

| Afirmação | Por que não | Como verificar |
|---|---|---|
| O reconhecimento de voz entendendo cartas faladas | Os testes leem texto; ninguém falou no microfone ainda | Abrir a mesa real no celular, tocar em "Falar a carta" e dizer "vira sete de copas" |
| O service worker no Safari do iPhone e no app instalado na Tela de Início | Os testes rodam no Chromium | Abrir a produção no iPhone, ligar o modo avião e abrir de novo |
| A produção servindo o commit da `main` | Só depois de importar na Vercel | O workflow `Produção` no primeiro merge |
| Se o difícil é difícil para uma pessoa | A medição foi IA contra IA | Jogar umas partidas e anotar |
