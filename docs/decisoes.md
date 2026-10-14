# Decisões

Tudo o que foi decidido, e por quê. O que não está aqui não foi decidido: pergunte. Cada decisão tem número, data e de onde veio.

Modelo de uma decisão:

```
## Dn. Título curto

- **Contexto (DD/MM/AAAA):** o pedido, nas palavras de quem pediu.
- **Decisão:** o que fica.
- **Interpretações que precisaram ser feitas:** o que o pedido não dizia.
- **Não sei:** o que ficou sem verificar.
```

## D1. Começa do secret-game

- **Contexto (14/10/2026):** "consegue fazer um app de truco, eu + 3 jogadores de IA", com a pasta do modelo (`modelo-app-mvp`) e depois: "aqui tem um jogo de cartas c varias ideias q vc pode aproveitar: https://github.com/lucasmagalhaees/secret-game … tem animacoes, e mts ideias bacanas".
- **Decisão:** o projeto é uma cópia do secret-game (a versão mais nova do modelo, com som, vibração, animações só no que mudou, resumo no fim) trocando o jogo. Mesma arquitetura: página estática, núcleo puro em `src/core/`, página em `src/app/`, o mesmo harness de testes, deploy na Vercel. O primeiro commit foi direto na `main` porque o repositório estava vazio ("comita ai https://github.com/lucasmagalhaees/truco", "pode comitar assim que der"); daqui em diante, branch e PR.
- **Endereço de produção (14/10/2026):** https://turco-six.vercel.app, o que a Vercel deu na importação; conferido servindo o merge do PR #1 (`fa495e3`).

## D2. Truco paulista, quatro jogadores

- **Contexto (14/10/2026):** "eu + 3 jogadores de IA"; "a ordem do desempate eh crescente: ouro, espada, coracao e paus".
- **Decisão:** truco paulista (vira e manilha nova), duplas de frente, a pessoa com a Cida contra Biu e Toinho. Manilha é o valor seguinte à vira; entre manilhas, ouros < espadas < copas < paus.
- **Interpretações que precisaram ser feitas:**
  - Variante paulista por ser a mais jogada; o pedido não disse qual.
  - Empate de rodada: começa de novo quem começou a rodada empatada (há mesas em que começa quem empachou).
  - Correr de um pedido dá a quem pediu o valor de antes do pedido; aumentar aceita o pedido anterior.
  - Mão de ferro às cegas, valendo 1; sem truco com alguém em 11.
  - Fora: encoberta (carta virada), sinais entre parceiros, "flor".
- **Não sei:** se a mesa da pessoa joga com outra regra de empate ou de mão de ferro.

## D3. Níveis, blefe, onze e naipe

- **Contexto (14/10/2026):** "consegue fazer 3 niveis de dificuldade? quero IA capaz de blefar, quero cenarios de empate com 11 pts, quero cenarios de desempate de manilha por naipe".
- **Decisão:** fácil, médio e difícil (requisito 9). Blefe nos três, mais no difícil e nos momentos em que funciona; quem blefou mostra as cartas quando a outra dupla corre. "Empate com 11" é a mão de ferro (as duas duplas com 11). Desempate por naipe aparece no jogo (rodinhas, log), no treino e nos testes.
- **Medido (14/10/2026, 1.500 partidas IA contra IA por par, `node` com o núcleo):** médio ou difícil vencem o fácil em ~68–69% das partidas; difícil contra médio, ~51–53%. Truco tem muita sorte de carta; a vantagem do difícil aparece mais em pagar blefe e guardar a garantida.

## D4. Treino, ranking, glossário e rodinhas

- **Contexto (14/10/2026):** "quero treinar meu raciocinio no truco principalmente com os naipes de desempate e com as sequencias"; "faz um glossario tbm … baseado na carta da mesa o ranking de cartas da mais forte pra mais fraca"; "pode usar um glossario com os termos reais tipo picadilha etc"; "eh como se esse app fosse a bicicleta com rodinhas e no jogo ao vivo vou tirar as rodinhas".
- **Decisão:** modo treino com dois exercícios, ranking por vira, glossário, e as ajudas da partida reunidas em "Rodinhas", ligadas por padrão e desligáveis.
- **Interpretações que precisaram ser feitas:** os apelidos usados são zap (paus), copas (copas), espadilha (espadas) e picafumo (ouros). "Picadilha" não foi usado por não ser um termo que eu conheça com certeza.
- **Não sei:** se na mesa da pessoa as manilhas têm outros apelidos.

## D5. Mesa real: toque e voz, foto depois

- **Contexto (14/10/2026):** "o app precisa dar assistencia tbm pra partidas reais, posso tirar uma foto da carta na mesa e ele rankear"; "ou permitir q eu mande um audio falando a carta"; "ou ainda ter um seletor da carta facil pra inputar"; "n sao mts cartas entao abrir uma telinha pra inputar a carta num seletor com opcoes fixas pode ser uma boa".
- **Decisão:** a mesa real recebe cartas por uma grade com as 40 cartas (um toque) e pela voz (reconhecimento de fala do navegador, em pt-BR). Foto fica de fora por enquanto.
- **Por quê:** reconhecer carta por foto precisa de um modelo de visão, num servidor (backend, chave de API, custo) ou baixado no aparelho (vários MB, precisão a testar). As duas coisas saem do escopo de página estática sem backend. O toque é mais rápido que a foto para 4 a 8 cartas.
- **Não sei:** quão bem o reconhecimento de fala do navegador entende nomes de carta no barulho de uma mesa; não foi testado com voz de verdade.

## D6. Seu time e modo rivais

- **Contexto (14/10/2026):** "quero mudar o nome dos jogadores baseado no time de futebol de quem usa, se for flamengo por exemplo personaliza com as cores do time e coloca os 3 jogadores principais do elenco na IA, faz isso para todos os times da serie A do Brasileiro"; e depois: "faz um modo rivais onde eu e o craque do meu time jogam contra IA de outro time do brasileirao".
- **Decisão:** os 20 clubes da Série A 2026 em `src/core/teams.ts`, com cores e três jogadores cada. No modo elenco, o craque é a dupla e os outros dois os adversários; no modo rivais, a pessoa e o craque contra os dois primeiros do clube escolhido.
- **De onde vieram os clubes:** lista da Série A 2026 (sobem Athletico, Chapecoense, Coritiba e Remo; caem Fortaleza, Ceará, Juventude e Sport), [Band, 07/12/2025](https://www.band.com.br/esportes/futebol/noticias/veja-20-times-serie-a-brasileirao-2026-202512071422), conferida em 14/10/2026.
- **De onde vieram os jogadores (conferidos em 14/10/2026):** as escalações prováveis publicadas antes dos jogos, da mais recente que achei para cada clube: rodadas de 07 a 12/10/2026 (Flamengo, Fluminense, Palmeiras, Bahia, Santos, Atlético-MG, São Paulo, Vitória, Grêmio, Internacional, Botafogo, Coritiba, Chapecoense, Athletico, Bragantino, Mirassol), 29/08/2026 (Vasco, Cruzeiro) e 23 a 25/07/2026 (Corinthians, Remo). A ida do Hulk para o Fluminense foi conferida à parte (anunciada em 05/05/2026).
- **Interpretações que precisaram ser feitas:**
  - "Os 3 principais" é escolha minha, entre os titulares prováveis: o mais conhecido como craque e mais dois.
  - As cores são as da camisa. Sem escudo nem logotipo (são marcas dos clubes).
  - Nomes de jogadores reais só como nomes das IAs; nada é dito em nome deles além das falas genéricas da mesa ("Truco!", "Aceito!").
- **Não sei:** quem saiu ou se machucou depois dessas datas, e os elencos de Corinthians, Remo, Vasco e Cruzeiro são de prévias de julho e agosto. Por isso os nomes podem ser trocados no app.

## Pendências

| Pendência | Quem resolve |
|---|---|
| Proteger a `main` exigindo PR e os checks do CI | Dono do repositório |
