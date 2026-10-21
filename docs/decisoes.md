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

## D9. Sala com 3 pessoas: quem criou escolhe o formato

- **Contexto (18/10/2026):** pedido do Lucas: com número ímpar de pessoas numa sala (na prática, 3), dar a opção de jogar "2 humanos contra 1 humano com uma IA" ou "3 duplas, cada humano com uma IA". Ele escolheu oferecer as duas e deixar quem criou a sala escolher. Nas 3 duplas, ele decidiu: quando alguém pede, as duas outras duplas respondem (quem corre sai da mão; se as duas correm, quem pediu leva o valor de antes) e, no 1 a 1 a 1, leva quem fez a 1ª.
- **Decisão:** a sala ganha o campo `format` (`'duplas'`, o padrão, ou `'tres'`), escolhido por quem criou só antes de começar e só com 3 pessoas; com 2 ou 4 pessoas ele não é olhado. No "2 contra 1", quem criou toca no nome de quem joga com a IA; os outros dois sentam de frente. As regras de 6 lugares das 3 duplas estão na D10; `SUPPORTS_THREE` liga o formato (ligado desde 18/10/2026). Ao começar as 3 duplas, as pessoas vão para os lugares 0, 1 e 2 (quem criou no 0, os outros na ordem em que entraram).
- **Interpretações que precisaram ser feitas (minhas, não do Lucas):** sem escolha, fica como a ordem de entrada já dava: quem criou e o terceiro a entrar de dupla, o segundo com a IA. Quem criou fica sempre no lugar 0 (é assim que a sala sabe quem criou): se ele mesmo escolhe jogar com a IA, os outros dois vão para os lugares 1 e 3 e a IA senta no 2. A escolha de quem fica com a IA é por toque nos nomes, num grupo de botões, e só quem criou vê os botões; os outros veem o formato escolhido em texto.
- **Não sei:** se 3 pessoas preferem, na prática, o "2 contra 1" ou as 3 duplas.

## D10. Três duplas (6 na mesa), o núcleo

- **Contexto (18/10/2026, pedido do Lucas):** numa sala com 3 pessoas, poder jogar em 3 duplas, cada pessoa com uma IA de parceira, cada dupla contra as outras duas. O núcleo de regras está em `src/core/game.ts`; a escolha do formato na sala é a D9; a mesa de 6 na tela entrou junto com a sala (18/10/2026).
- **Decidido pelo Lucas (18/10/2026):**
  - Pedido (truco, seis, nove, doze): as duas outras duplas respondem, cada uma aceita, corre ou aumenta. Quem corre sai da mão: não marca e as cartas dela saem do jogo. Se as duas correm, quem pediu leva o valor de antes; se uma corre e a outra aceita, a mão segue entre as duas no valor novo.
  - 1 a 1 a 1 (cada dupla fez uma rodada): leva quem fez a 1ª. O resto dos desempates é o do truco paulista; quem fizer 2 rodadas leva.
- **Decidido pelo agente, confirmar com o Lucas:**
  - Lugares: 6 em roda, parceiros de frente (lugar `s` e `s + 3`), as duplas se alternando (dupla `s % 3`); baralho de 40, 3 cartas para cada um (18) e a vira. Nomes padrão: Você, Biu, Zé, Cida, Toinho, Nena (`SEATS6`).
  - A ordem de quem responde a um pedido é a ordem da roda depois de quem pediu. Quem aumenta pede para todas as duplas ainda na mão (inclusive a que tinha pedido); a dupla que já tinha aceitado responde de novo.
  - Uma dupla que corre perde as rodadas que já tinha feito: contam como empatadas. Se isso já decide a mão, ela acaba na hora, no valor aceito.
  - Quem fez a última rodada empatada e saiu da mão: começa a próxima rodada o seguinte na roda que ainda está na mão.
  - Mão de onze com uma dupla em 11: ela decide (vale `ELEVEN_VALUE`); se corre, cada uma das outras duas leva 1. Com duas ou três duplas em 11: mão de ferro (vale 1, às cegas, sem pedidos). Com alguém em 11, ninguém pede.
  - Responde por cada dupla a pessoa dela; numa dupla só de IAs, o primeiro dela a jogar depois de quem pediu.
  - O placar tem três números; vence quem chega a 12 (`WIN_POINTS`). As frases do histórico dizem os nomes da dupla, não "Nós" e "Eles".
  - Na tela: o placar diz "Nós" e, de cada outra dupla, o nome da pessoa nela; a mesa de 6 põe você embaixo, o parceiro em cima e as outras quatro cadeiras duas de cada lado, na ordem da roda; quem correu fica com "saiu da mão" na cadeira; a dupla não cochicha conselho com 3 duplas (a IA de 6 é a de 4 adaptada). A cor da terceira dupla é roxa (`--t2`).
- **Não sei:** se a IA joga bem com 6 (é a de 4 adaptada); se o jogo fica bom de jogar assim. Ninguém jogou ainda.

## D11. Temas: futebol, animes e jogos, mesa montada e cores por personagem

- **Contexto (18/10/2026):** o Lucas pediu, além do futebol, um tema de animes (Blue Lock, Naruto Clássico, Dragon Ball), com equipes de um anime contra as de outro, e que nada ficasse "chumbado" no futebol: "se amanhã eu quiser adicionar filmes, isso precisa estar escalável, tanto na tela quanto na lógica". No mesmo dia pediu a categoria Jogos (Street Fighter e Mortal Kombat), montar a mesa com personagens de packs diferentes, em ordens diferentes, e cores da interface por jogo ou por personagem.
- **Decisão:** um catálogo genérico em `src/core/teams.ts`, com os dados em `src/core/packs/`, um arquivo por pack:
  - `Pack { id, kind, kindName, name, lead, colors, note?, groups }`: `kind` é a categoria (a aba da tela), `lead` o nome do primeiro da equipe ("craque", "líder"), `note` uma linha opcional mostrada sob o pack (o futebol diz quando os elencos foram conferidos).
  - `Group { id, name, colors?, players: [3 personagens] }`, e cada personagem é um nome ou `{ name, colors? }`. Sem cor própria, o personagem herda a da equipe, e a equipe a do pack.
  - Ids qualificados: `futebol/flamengo` (equipe), `naruto/time-7/0` (personagem, pelo lugar na equipe). Um id antigo, só de clube (`flamengo`), é lido como `futebol/flamengo`, na partida salva e nos ajustes.
  - Três modos: Equipe (o primeiro é a dupla, os outros dois contra), Rivais (contra os dois primeiros de outra equipe, de qualquer tema) e Montar (a dupla e os dois adversários escolhidos um por um, de qualquer pack, com "Trocar a ordem" e "Sortear"; `S.seats`).
  - Cores, nos Ajustes (`S.colorBy`): as do tema, as da equipe (padrão) ou as do personagem que é a dupla. "Eles" segue o primeiro adversário do mesmo jeito; no modo Equipe sem rival, "Eles" fica nas cores do app, porque os dois lados seriam da mesma equipe.
  - Toda cor declarada precisa de texto com contraste de 4,5 ou mais sobre a cor principal (caso do `unit.cases.mjs`). Por isso o azul do Grêmio ficou um pouco mais escuro (`#0a72ad` no lugar de `#0d80bf`): com texto branco ou preto, o original não passava.
  - Online, quem cria a sala manda a mesa dela no `start` (os nomes das IAs e as cores das duplas), lida por `readMsg`; sem ela, a mesa de bar.
  - Na sala de 3 duplas (D10), por enquanto, a mesa de quem criou não vale: as IAs ficam com os nomes de bar (`SEATS6`) e o app com as cores dele, porque a mesa montada tem 4 lugares e cada pessoa escolheria a própria equipe. Fica para depois, se o Lucas quiser.
- **Como acrescentar um tema novo (filmes, por exemplo):**
  1. Criar `src/core/packs/<id>.ts` com um `Pack` (copie um dos animes), com `kind: 'filmes'` e `kindName: 'Filmes'` se for uma categoria nova.
  2. Registrar no `PACKS` de `src/core/packs/index.ts`, na posição em que deve aparecer.
  3. Rodar `scripts/verify.sh`: os casos do catálogo conferem ids, três personagens por equipe e o contraste de toda cor; a tela gera a aba e os botões sozinha. Citar o pack no `CLAUDE.md` (o `docs_check.py` cobra).
- **De onde vieram os personagens:** da memória do agente, em 18/10/2026, sem conferir na web; nomes como saem no Brasil (dublagem e legendas). Personagens não envelhecem como elencos, mas um nome pode estar escrito diferente do que a pessoa conhece: dá para trocar no app.
- **Interpretações que precisaram ser feitas (decididas pelo agente, confirmar com o Lucas):**
  - As equipes de cada anime e jogo: Blue Lock por time da seleção e da Liga Neo Egoísta (Time Z, Time V, Bastard München com o Noa como craque, Manshine City, PXG, Ubers, Barcha, Japão Sub-20); Naruto pelos times do Exame Chunin e outros grupos (Time 7, Time 8, Time 10, Time Gai, Irmãos da Areia, Ninjas do Som, Quarteto do Som com Tayuya, Sakon e Kidomaru, Ninjas da Névoa, Jônins de Konoha, Sannin); Dragon Ball pelos grupos do clássico e do Z (Guerreiros Z, Saiyajins, Turma do Kame com Bulma, Escola do Grou, Namekuseijins, Força Ginyu, Família de Freeza, Androides, Patrulha Vermelha, Majin Boo). A revisão do coordenador (18/10/2026) corrigiu o Quarteto (sem o Kimimaro), tirou o Tenshinhan da Turma do Kame e trouxe o Piccolo; Street Fighter (Shotokan, Shadaloo, Força Aérea, Lutadores do Mundo, Mestres da Ásia); Mortal Kombat (Shaolin, Lin Kuei, Forças Especiais, Exoterra, Shirai Ryu, Netherrealm). Os packs de Street Fighter e Mortal Kombat foram completados pelo agente F: todo personagem tem cor própria.
  - Sugestões que mudaram: o "Blue Lock Eleven" ficou de fora para não repetir quase todos os nomes; "Mundo" virou duas equipes (Lutadores do Mundo e Mestres da Ásia); o Scorpion lidera a Shirai Ryu.
  - As cores são inspiradas nas roupas e nas equipes; nenhuma imagem, logotipo ou desenho.
- **Não sei:** se os nomes estão como o Lucas conhece em todos os casos (por exemplo "Rikum" ou "Recoome", "Exoterra" ou "Outworld"); se as cores agradam. Os nomes podem ser trocados no app.

## D12. Heróis x Vilões (removida em 21/10/2026 a pedido, D19)

- **Contexto (18/10/2026):** o Lucas pediu um modo "Heróis x Vilões" (protagonistas contra antagonistas), onde fizer sentido.
- **Decisão:** cada personagem pode ter `side: 'heroi' | 'vilao'` nos dados do pack; a equipe pode ter um padrão, e o personagem sobrescreve. O modo só aparece se algum pack tiver pelo menos dois heróis e dois vilões (`sidedPacks`). Na tela, "Heróis x Vilões" escolhe o universo (um pack, ou "Misturado" entre todos os que têm lados) e o lado da pessoa (heróis por padrão, ou vilões); a dupla sai do lado dela e os dois adversários do outro, sorteados (`drawSided`), com "Sortear de novo", e a mesa pode ser editada como no Montar. "Eles" fica nas cores dos adversários, como nos outros modos. Guardado em `S.hv` junto com `S.seats`.
- **A mesma pessoa nunca senta em dois lugares** (pedido do coordenador ao revisar): Nagi, Reo, Bachira e Isagi aparecem em duas equipes de Blue Lock, fiel ao anime; `samePerson` compara pelo nome, `readSeats` recusa a mesa com a mesma pessoa duas vezes, o sorteio nunca repete, e na tela de montar, pôr alguém que já está na mesa troca os dois de lugar.
- **Marcações discutíveis (decididas pelo agente, confirmar com o Lucas):**
  - Futebol e Blue Lock ficam sem lados: não há vilão de verdade.
  - Naruto: os Irmãos da Areia (Gaara, Kankuro, Temari) são heróis, porque viram aliados a partir do resgate do Sasuke, embora sejam adversários no Exame Chunin; Orochimaru é vilão dentro dos Sannin; Kabuto não está no pack.
  - Dragon Ball: os Saiyajins (Vegeta, Nappa, Raditz) são vilões, pela saga em que aparecem juntos; a Escola do Grou (Tenshinhan, Chaos, Mestre Tsuru) é de heróis, embora o Mestre Tsuru seja vilão no clássico.
  - Street Fighter: Akuma e Sagat são vilões; o resto dos Shotokan e dos Mestres da Ásia, heróis.
  - Mortal Kombat: Sub-Zero e Kitana são heróis; o resto da Exoterra e do Netherrealm, vilões; Smoke, Cyrax e a Shirai Ryu (Scorpion, Takeda, Kenshi) ficam sem lado, porque mudam de lado ao longo da série.

## D13. Navegação por abas e em árvore, temas separados

- **Contexto (18/10/2026, pedido do Lucas):** "o site cresceu muito, está tudo encavalado numa página só, com muitos elementos de cores diferentes; tem que ter navegação por abas, uma árvore de navegação; e os temas não podem se misturar: futebol, anime e jogo cada um apartado".
- **Decisão:** cinco abas numa barra fixa embaixo (Jogar, Treinar, Mesa real, Equipe, Ajustes); dentro de cada aba, telas em árvore com título e "Voltar", o caminho no endereço (`#equipe/time/anime/naruto`) para o voltar do navegador funcionar; a Equipe separa por categoria e universo, gerada do catálogo (`kind` dos packs), nunca uma lista misturada; as cores das equipes só no topo, no placar e numa faixa pequena nos itens. A aba aberta fica lembrada no navegador (`truco.tab`), fora do estado salvo. Ícone da página e da Tela de Início.
- **Interpretações que precisaram ser feitas (decididas pelo agente, confirmar com o Lucas):**
  - A ordem das abas e os ícones (desenhos de traço feitos à mão, sem biblioteca). "Mesa real" é uma aba própria, não uma tela do Treinar.
  - O nível da IA fica na raiz de Jogar, junto do "Dar as cartas"; o online é uma tela abaixo dela. Jogar tem um atalho "Trocar quem senta na mesa" que abre a aba Equipe.
  - Na categoria com um universo só (Futebol), o passo do universo é pulado.
  - Escolher uma equipe volta para a raiz da Equipe (as telas do caminho saem do histórico); o voltar do navegador depois disso vai para a aba anterior.
  - Montar a mesa e Heróis x Vilões mostram um botão para começar o modo quando ele não está em uso, e o seletor de personagens com abas de categoria e de universo quando está.
  - O treino e o assistente da mesa real cobrem a tela (sem a barra) e ganham um passo no histórico (`#treinar/exercicio`, `#real/assistente`); recarregar nesse endereço abre a raiz da aba.
  - Durante a partida, o voltar do navegador não encerra a partida (só o "Encerrar", com dois toques).
- **Não sei:** se o Lucas prefere outra ordem ou outros nomes de aba; se a barra embaixo atrapalha no iPhone com o app na Tela de Início (só conferido no Chromium).

## D14. Nível extremo, a IA que conta as cartas

- **Contexto (18/10/2026, pedido do Lucas):** um quarto nível, acima do difícil, que conta as cartas como gente e decide carta, truco, aceite, corrida e blefe pela conta, sem nunca olhar carta escondida. Pagar o doze vindo do nove não pode ser sempre. Depois de jogar: "o extremo precisa de balanceamento, principalmente no pedido de truco".
- **Decisão:**
  - O extremo (`extremo` em `LEVELS`) imagina as cartas que não viu nas mãos ocultas (`EXTREME_SAMPLES` sorteios por decisão), pesa cada sorteio pelo que cada um pediu à vista (pedido com mão fraca só conta como blefe, na taxa de blefe daquele lugar em `reads`) e joga cada sorteio até o fim. Escolhe a carta que mais leva a mão nos mesmos sorteios; pede com chance de levar de 62% ou mais (`RAISE_FOR`); responde pela conta de pontos da partida (`gameChance`), o que paga o doze vindo do nove quando a chance passa de 1/8 e corre com mão perdida. Um teste troca as cartas ocultas e confere que nenhuma decisão muda (mesa de 4 e de 6).
  - Balanceamento do pedido (18/10/2026): o blefe do extremo é próprio (`extremeBluff`, `EXTREME_BLUFF`): mais onde funciona (rodada já ganha ou última rodada), escalado pelo quadrado de quanto a dupla que responderia corre, metade acima do truco, com teto; o aumento de volta blefado só com chance de verdade e raro (`EXTREME_BACK_MIN`, `EXTREME_BACK_BLUFF`); com a mão quase ganha na 1ª rodada, às vezes segura e pede depois (`EXTREME_TRAP`, `EXTREME_TRAP_RATE`), para não ser previsível e ser pago.
  - Medido com `node scripts/ia_medida.mjs 400` (sementes fixas), antes (main `3fa0927`) → depois:
    - extremo contra difícil, 400 partidas: 60% → 63% das partidas; contra médio 61% → 61%; contra a pessoa simulada que blefa 60% → 65%.
    - pedidos do extremo contra o difícil (300 partidas): pede em 55% → 52% das mãos; blefe em 16% → 13% dos pedidos; blefe no seis 35% → 15%, no doze 29% → 6%; aumento de volta blefado 56% → 22% dos aumentos; com mão forte na 1ª rodada pede em 96% → 80% das chances.
    - contra quem corre muito, blefa mais (16% dos pedidos, 70% dão certo); contra quem paga tudo, menos (12% → 9%).
    - tempo por decisão (responder um truco e escolher a carta), Node nesta máquina: 8,2 ms.
- **Interpretações que precisaram ser feitas (decididas pelo agente, confirmar com o Lucas):**
  - "Crível" foi lido como: pedir em cerca de metade das mãos, blefe entre 10% e 25% dos pedidos e mais contra quem corre, aumento de volta quase só com chance de verdade, e nem sempre pedir na hora com a mão ganha.
  - Contra a pessoa, o extremo aprende só do que ela mostrou na partida (`reads`), com o mesmo peso inicial do difícil (`READ_PRIOR`).
  - Na tabela do doze, com o nove já na mesa, a mão "média" é paga 83–95% das vezes: é a conta (basta levar mais de uma vez em oito), não um exagero; a faixa que separa os níveis é a fraca (36–51% sem histórico ou contra quem só pede com mão, 92% contra quem já foi pego blefando).
- **Não sei:** se o extremo fica bom de jogar contra uma pessoa de verdade (só medido contra outras IAs e pessoas simuladas); o tempo de decisão num celular (medido no Node desta máquina).

## D15. Quem pediu fica claro, avançar sozinho e equipe contra equipe

- **Contexto (18/10/2026, o Lucas jogando):** "Na tela precisa ficar claro quem pediu truco, fale o nome do personagem." "Quando uma rodada acabar ou já puder puxar a nova rodada, faça isso automaticamente (pode colocar opções nos ajustes)." "Ainda tá confusa a escolha das equipes; seria mais fácil, em vez de misturar tudo, ser uma equipe toda contra a outra equipe toda."
- **Decisão:**
  - **Quem pediu:** o cartão do pedido diz "<Nome> pediu TRUCO!" (SEIS, NOVE, DOZE; "de volta" quando é um aumento sobre outro pedido) e "Responde: <Nome>" (para a pessoa: "Responde: você, pela sua dupla."); a cadeira de quem pediu fica destacada com "pediu TRUCO" enquanto o pedido está aberto, a de quem responde com "responde"; o carimbo tem o nome embaixo ("Biu pediu TRUCO!", "Biu aceitou", "Você correu"; o "Aceito!" passou a ser carimbado também); depois do aceite, uma linha "<Nome> aceitou. A mão vale 3." O nome é o da mesa (craque, personagem, nome de quem está na sala), sempre por `esc()`; o lugar da pessoa é "Você". Vale online e nas 3 duplas (lá, depois de uma dupla aceitar, o cartão diz quem aceitou e quem responde agora).
  - **Avançar sozinho** (`S.auto`, ligado por padrão; desligado fica `false`): o fim da mão segue sozinho depois de `HAND_PAUSE` (calma 4,5 s, normal 3 s, rápida 2 s), com as cartas da última rodada na mesa, o resultado e o placar à vista, e uma barra que enche no tempo da pausa; sem botão. O fim da partida nunca segue sozinho. Desligado, como antes: "Próxima mão". O fim de rodada já não tinha botão (a carta seguinte é jogada, com `ROUND_PAUSE` antes da IA), então ficou como estava. "Reduzir movimento" tira a animação da barra, não a pausa.
  - **Online:** o servidor dá a próxima mão depois de `ROOM_HAND_PAUSE` (3 s), pelo mesmo relógio das IAs (`aiDelay`/`aiStep`), para todos, sem botão, independente do ajuste de cada um. Se o servidor não der (por exemplo, o workflow `Salas` não publicou o servidor novo), o celular de quem criou manda o "next" depois de mais `HOST_NEXT_AFTER` (4 s): ninguém fica travado.
  - **Montar a mesa mais curto (pedido do coordenador ao revisar o CI, 18/10/2026):** com os 20 clubes, a tela em uso passava de 3 telas no CI (2.596 px; limite do teste, 2.556). O seletor passou a mostrar as equipes do universo aberto como fichas pequenas e só os três personagens da equipe aberta (a do lugar tocado, ou a ficha tocada): 1,2 tela no Chromium daqui. O limite do teste não mudou.
  - **Equipe contra equipe:** a raiz da aba Equipe virou dois passos (1. Sua equipe, 2. Equipe adversária, a mesma árvore categoria → universo → equipe) e um resumo "Você e <craque> (Equipe A) contra <x> e <y> (Equipe B)". Sem equipe adversária, os adversários são os outros dois da sua equipe, e o resumo diz isso. Montar a mesa e Heróis x Vilões foram para "Mais jeitos de montar a mesa" (`#equipe/mais/montar`, `#equipe/mais/hv`). Escolher sua equipe ou a adversária desfaz a mesa montada (é o caminho principal). Na partida, o placar e uma linha sobre a mesa dão o nome das equipes ("Nós: Flamengo", "Eles: Palmeiras").
- **Interpretações que precisaram ser feitas (decididas pelo agente, confirmar com o Lucas):**
  - Os tempos da pausa (4,5 / 3 / 2 s) e os 3 s online.
  - "Fim de rodada" não tinha botão; o pedido foi lido como sendo sobre a mão. Se o Lucas quiser uma pausa maior depois de cada rodada, é o `ROUND_PAUSE`.
  - Online o tempo é fixo e não segue o ajuste de cada celular; o "Próxima mão" sumiu online também.
  - O nome da equipe vem da chave de cores guardada na partida (`sides`): com as cores "Do tema", o nome é o do pack ("Dragon Ball"); sem equipe adversária, "Eles" leva o nome da sua equipe (os adversários são dela).
  - O nome da equipe no placar é cortado com reticências quando não cabe.
- **Não sei:** se os tempos agradam; se o carimbo com o nome fica legível no iPhone (só conferido no Chromium); se o "Aceito!" carimbado cansa.

## D16. Rival direto sugerido

- **Contexto (18/10/2026, pedido do Lucas):** "quando eu escolher uma equipe, quero que sugira o rival direto dela; vai ter que fazer uma inteligência pra isso, mas fica muito melhor". Ajustes no mesmo dia: até 3 rivais por equipe, um botão só que passa de um para o outro; e "o rival sugerido é sempre do mesmo pack" (Naruto × Naruto, Futebol × Futebol).
- **Decisão:**
  - `suggestRivals(id)` em `src/core/teams.ts` devolve de 1 a `RIVALS_MAX` (3) rivais, cada um com o motivo, sempre do mesmo pack, nunca a própria equipe, sem repetir e sempre na mesma ordem: (a) os declarados nos dados (`rivals`, com o motivo em `why`, no `Group`); (b) as equipes que declaram esta, com o motivo delas; (c) no mesmo pack, as do outro lado da história (herói × vilão, pelo lado da maioria dos personagens de cada equipe); (d) as outras do pack, na ordem do pack a partir da seguinte. Um rival de outro pack nos dados é ignorado (testado).
  - Escolhida a sua equipe, o primeiro sugerido entra como adversária (`S.rival`, marcado com `S.rivalAuto`). Adversária escolhida à mão (sem a marca, inclusive as guardadas antes desta versão) não é trocada quando a pessoa troca de equipe: a sugestão aparece como opção. "Sem equipe adversária" tira o rival; a próxima equipe escolhida volta a trazer o sugerido.
  - Na tela da equipe adversária: "Rival direto 2 de 3: Vasco — o Clássico dos Milhões" e um botão só, "Escolher rival sugerido" (1º → 2º → 3º → 1º). Com o rival sugerido em uso, a árvore fica atrás de "Escolher outra"; à mão, continua podendo ser de qualquer tema. O resumo e o passo 2 dizem "rival direto" quando a adversária é uma das sugeridas. O mesmo cartão com o botão fica também na tela Equipe, logo abaixo dos dois passos, para trocar o rival sem entrar no passo 2 (pedido do Lucas, 18/10/2026).
  - Os pares, escritos pelo agente de memória em 18/10/2026, **sem conferir na web** (os 3 de cada equipe, com o motivo, estão na tabela do PR e saem de `suggestRivals`):
    - Série A 2026: Flamengo → Fluminense (Fla-Flu), Vasco (Clássico dos Milhões), Botafogo (Clássico da Rivalidade); Fluminense → Flamengo, Vasco (Clássico dos Gigantes), Botafogo (Clássico Vovô); Vasco → Flamengo, Fluminense, Botafogo; Botafogo → Flamengo, Fluminense, Vasco; Corinthians → Palmeiras (Derby), São Paulo (Majestoso), Santos (Clássico Alvinegro); Palmeiras → Corinthians, São Paulo (Choque-Rei), Santos (Clássico da Saudade); São Paulo → Corinthians, Palmeiras, Santos (San-São); Santos → Corinthians, Palmeiras, São Paulo; Grêmio ↔ Internacional (Gre-Nal); Atlético-MG ↔ Cruzeiro (clássico mineiro), Atlético-MG → Flamengo (rivalidade dos anos 80); Bahia ↔ Vitória (Ba-Vi); Athletico-PR ↔ Coritiba (Atletiba).
    - Sem o clássico na Série A 2026, o mais perto que está, com isso no motivo: Bragantino ↔ Mirassol (interior paulista), depois os do Paulistão; Chapecoense → Athletico-PR, Grêmio, Internacional (Figueirense e Avaí fora; vizinhos do Sul); Remo → Bahia, Vitória (sem o Paysandu do Re-Pa; Norte × Nordeste).
    - Naruto: Time 7 → Irmãos da Areia (Naruto × Gaara), Ninjas do Som, Ninjas da Névoa; Areia → Time 7; Time 8 → Time Gai (Hinata × Neji); Time 10 → Areia (Shikamaru × Temari); Time Gai → Time 7; Ninjas do Som → Time 7; Quarteto do Som → Time 10 (Tayuya × Shikamaru); Névoa → Time 7 (a ponte); Jônins → Névoa; Sannin → Ninjas do Som (os de Orochimaru).
    - Dragon Ball: Guerreiros Z → Família de Freeza, Saiyajins, Androides; Saiyajins → Guerreiros Z; Freeza → Guerreiros Z; Namekuseijins → Freeza; Força Ginyu, Androides e Majin Boo → Guerreiros Z; Turma do Kame → Patrulha Vermelha, Escola do Grou; Grou → Kame; Patrulha → Kame.
    - Blue Lock: Time Z ↔ Time V (primeira seleção), Time Z → Japão Sub-20, PXG; Bastard München → PXG (Isagi × Rin), Manshine City, Ubers; PXG → Bastard, Japão Sub-20 (Rin × Sae); Manshine City, Ubers e Barcha → Bastard; Japão Sub-20 → Time Z.
    - Street Fighter: Shotokan ↔ Shadaloo (Ryu × M. Bison), Shotokan → Mestres da Ásia (Ryu × Sagat); Força Aérea e Lutadores do Mundo → Shadaloo; Mestres da Ásia → Shotokan.
    - Mortal Kombat: Shaolin ↔ Exoterra (Liu Kang × Shao Kahn); Lin Kuei ↔ Shirai Ryu (Sub-Zero × Scorpion); Forças Especiais → Exoterra (o Black Dragon não existe no pack; Kano lutava pela Exoterra); Netherrealm ↔ Shaolin (Shinnok × Raiden).
- **Interpretações que precisaram ser feitas (decididas pelo agente, confirmar com o Lucas):**
  - Os 2º e 3º rivais de cada equipe e os "mais perto" dos clubes sem clássico na Série A (Bragantino, Mirassol, Chapecoense, Remo).
  - "Escolhido à mão" é o que veio da árvore; a adversária guardada antes desta versão conta como escolhida à mão.
  - "Sem equipe adversária" não é guardado como escolha: a próxima equipe traz o sugerido.
  - O botão, com a adversária escolhida à mão, começa pelo 1º sugerido.
- **Não sei:** se os pares e os nomes dos clássicos estão certos (memória, não conferido); se o 2º e 3º fazem sentido para quem conhece cada história.

## D18. Quem responde o aumento, e o extremo pagando nove e doze

- **Contexto (21/10/2026, Lucas jogando):** "quando a IA aliada pede truco e a IA rival aumenta, o pedido vem pra mim"; "no extremo a IA tá comendo bait direto, aceita 9 e 12".
- **Decisão (escolhida pelo Lucas):** o aumento de volta é respondido por quem fez o pedido anterior, pessoa ou IA (`Ask.to`). A pessoa continua respondendo o que pedem direto para a dupla dela.
- **Extremo:** um nove ou um doze passa a pedir uma mão melhor para contar como merecido (`DESERVE_STEP` a mais no seis, o dobro no nove e no doze), e o blefe lido de quem pede conta pela metade nesses pedidos (`BIG_RAISE_BLUFF`); o extremo aprende o blefe mais devagar (`READ_PRIOR` 8). Medido (60 partidas por linha, 21/10/2026): contra quem só pede com mão, o extremo paga o doze com mão fraca 26% (antes 36%) e com mão média 67% (antes 85%); contra quem já foi pego blefando continua pagando quase sempre. O extremo segue vencendo o difícil (63% em 200 partidas).
- **Não verificado:** contra uma pessoa de verdade.
## D19. A partida cabe na tela e sai o "Mais jeitos de montar a mesa"

- **Contexto (21/10/2026):** o Lucas jogou no PC e no iPhone: "quando rolo pra baixo pra ver minha mão, a vira fica fora do campo e vice-versa; pra aceitar o truco tenho sempre que rolar pra baixo, tira toda a velocidade do jogo". E pediu para tirar "Mais jeitos de montar a mesa" inteiro.
- **Decisão (partida):** a partida cabe inteira na janela, sem rolagem, de 360×640 a 1920×1080. A coluna tem a altura da janela (`100dvh`, com `100vh` de reserva e a safe-area); a mesa pega o que sobra e encolhe, e as cartas são medidas pela altura da janela (`clamp` em `dvh`). Vale, Mão, Rodadas e Nível viram uma linha de pílulas pequenas. O que pede algo da pessoa (responder truco, mão de onze, fim de mão, fim de jogo com o resumo) fica por cima da parte de baixo da mesa (`.dock`), logo acima da mão, que fica sempre embaixo. Ranking da vira, histórico e encerrar viram uma barra curta, e os dois primeiros abrem por cima da mesa. No desktop a coluna continua com 720 px e a mesa com no máximo 640 px de altura, centralizada. O aviso "Saiu uma versão nova" vira uma faixa fina dentro da coluna, e a mesa encolhe para caber.
- **Decisão (mesa):** saem a tela Montar a mesa (`S.seats`), Heróis x Vilões (`S.hv`), a entrada na aba Equipe, as rotas `#equipe/mais/*` e o código que só servia a eles (`readSeats`, `drawSeats`, `drawSided`, `sidedPacks`, `sideOf`, `samePerson`, `charName`, o seletor de personagens). Estado salvo com `seats` ou `hv` abre sem erro: os dois campos são descartados e fica a equipe (e a rival) que estiver salva. Um endereço antigo `#equipe/mais/...` abre a tela Equipe. O `side` continua nos dados dos packs, porque a sugestão de rival (D16) usa o lado das equipes. As cores por tema, equipe ou dupla (`S.colorBy`) continuam, para equipe e rivais.
- **Testes que saíram:** os do e2e e do núcleo que só conferiam montar a mesa e Heróis x Vilões (a ordem trocada, o sorteio, a mesma pessoa em dois lugares, os sorteios por lado); a escolha de cores passou a ser conferida com equipe contra equipe.
- **Não sei:** como fica num iPhone de verdade (a barra do Safari muda o `dvh` enquanto aparece e some); medido só no Chromium do Playwright.

## D20. Mais temas: Avatar, Def Jam, Nintendo, Sonic e Piratas do Caribe

- **Contexto (21/10/2026, pedido do Lucas):** Avatar: A Lenda de Aang em Animes; Def Jam: Fight for NY, Nintendo (Mario, Zelda, Donkey Kong) e Sonic em Jogos; Piratas do Caribe numa categoria nova, Filmes.
- **Decisão:** um arquivo de dados por pack (D11), com até 3 rivais declarados por equipe, sempre do mesmo pack (D16). Def Jam usa os rappers que aparecem no jogo, só pelo nome, como os jogadores do futebol (escolha do Lucas). Sem `side`: esses packs não entram em Heróis x Vilões.
- **Não verificado:** equipes, nomes e rivais vieram da memória do agente (21/10/2026), sem conferir na web; quem é de qual crew no Def Jam é o mais incerto.

## Pendências

| Pendência | Quem resolve |
|---|---|
| Proteger a `main` exigindo PR e os checks do CI | Dono do repositório |
