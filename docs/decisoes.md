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

## D7. Jogar online, com servidor de sala

- **Contexto (17/10/2026):** "como eu faria pra jogar online com mais 3 amigos?", depois "quero um modo pra jogar eu + IA vs um amigo + IA" e, entre servidor de sala e um celular anfitrião, "faz o 1 1. Servidor de sala".
- **Decisão:** um servidor de salas na Cloudflare (Workers com Durable Objects), que guarda a partida e manda a cada celular só a visão da pessoa dele. Até 4 pessoas; lugar vazio fica com a IA. O núcleo é o mesmo: as regras e as IAs rodam no servidor sem reescrever nada.
- **Por que Cloudflare:** a Vercel não segura WebSocket aberto; um Durable Object é uma sala viva com estado e conexões, e o núcleo em TypeScript roda nele como está.
- **Fato de terceiro (conferido em 17/10/2026, [preços dos Durable Objects](https://developers.cloudflare.com/durable-objects/platform/pricing)):** no plano grátis, Durable Objects só com armazenamento SQLite; 100.000 requisições e 13.000 GB-s por dia; mensagens que chegam por WebSocket contam 20 por requisição; com a hibernação, sala parada não conta tempo. Wrangler 4.145.0 (30/09/2026).
- **Interpretações que precisaram ser feitas:**
  - Ordem dos lugares: quem criou, o primeiro a entrar (contra quem criou), a dupla de quem criou, a dupla do segundo. Assim, "eu + IA contra amigo + IA" é só criar a sala e o amigo entrar.
  - Só quem criou a sala começa, recomeça e passa para a IA o lugar de quem caiu (quem sai de vez, a IA assume na hora: veja abaixo). As IAs jogam no nível de quem criou e com os nomes do bar (Biu, Cida, Toinho); o modo "seu time" fica para o jogo num celular só.
  - Ninguém entra numa partida já começada; quem caiu volta ao mesmo lugar com o token guardado no celular.
  - "Nós" e "Eles" nas frases do histórico trocam de lado para a outra dupla (`swapSides`).
  - Sem login: o nome é o que a pessoa escreve, e o lugar é garantido pelo token.
- **Sair, cair e sala apagada (17/10/2026, pedido do Lucas):**
  - Quem toca em "Sair" no meio da partida é trocado pela IA na hora, sem esperar quem criou. Se era quem criou, a próxima pessoa da sala vira quem criou. Sem ninguém na sala, as IAs param.
  - Quem só caiu (a conexão fechou) guarda o lugar para voltar; para esse caso fica o botão de quem criou passar o lugar para a IA. O servidor diz qual dos dois aconteceu (`leave` é a pessoa; `drop` é o próprio servidor, quando a conexão fecha).
  - Caída a conexão, o celular tenta de novo sozinho (`RETRY`) com uma faixa na tela, e depois para e mostra "Tentar de novo", para não gastar bateria tentando para sempre (cobre também o servidor recusando conexões).
  - O celular que já jogou numa sala avisa ao voltar (`back`); se a sala está vazia, ela foi apagada ("A sala anterior acabou."), e se a partida segue sem o lugar dele, a IA ficou com ele. Nos dois casos o celular esquece a sala e volta ao início.
  - Nome vazio ou código errado no cartão "Jogar online" aparecem no próprio campo, não num aviso que some.
- **Servidor no ar (17/10/2026):** https://truco-salas.lucasbarbosa1738.workers.dev, publicado pelo workflow `Salas`; uma mão jogada nele por duas abas (ver `docs/verificacao.md`).
- **Não sei:** a demora pelo 4G.

## D8. Limites do servidor de salas contra abuso

- **Contexto (17/10/2026):** "Online mais robusto", escolhido entre as melhorias propostas. O servidor está aberto na internet: qualquer um que saiba o endereço pode abrir sockets e mandar mensagens, e cada mensagem conta na cota grátis da Cloudflare (D7).
- **Decisão:** limites no núcleo (`src/core/online.ts`), puros e testados, aplicados pelo `server/worker.ts` e pelo `tests/room_server.mjs` antes de qualquer regra:
  - Mensagem de até 1 KB (`MSG_MAX`). A maior que o app manda é a de entrar (nome de 16 letras e token de até 64), bem abaixo disso. Acima, a conexão fecha com 1009.
  - Por conexão, um balde de 20 mensagens que enche 5 por segundo (`RATE_BURST`, `RATE_PER_S`). Uma pessoa toca poucas vezes por segundo; a volta depois de cair manda uma mensagem só. Estourou, fecha com 1008. O balde vai junto com a conexão na hibernação.
  - Até 12 conexões por sala (`CONN_MAX`): 4 pessoas com folga para uma segunda aba ou uma volta que chega antes da conexão velha cair. A 13ª recebe 429.
  - Código de sala que não é código (`isCode`) já dava 404 sem criar sala; ficou como estava.
- **Interpretações que precisaram ser feitas:** os números acima são escolha minha, sem medição de uso real; fechar a conexão (em vez de só ignorar a mensagem) para que um cliente com defeito apareça logo, e não fique em silêncio.
- **Não sei:** como o celular da pessoa reage a ser cortado (ele tenta voltar sozinho, `RETRY`); não há limite de salas por endereço, só por sala.

## Pendências

| Pendência | Quem resolve |
|---|---|
| Proteger a `main` exigindo PR e os checks do CI | Dono do repositório |
