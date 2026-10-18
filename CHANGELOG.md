# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versões: [SemVer](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado
- Quem pediu fica claro (D15): "Biu pediu TRUCO!" no cartão, a cadeira de quem pediu destacada, o carimbo com o nome embaixo, "Responde: <nome>", "<nome> aceitou", "<nome> correu", "pediu SEIS de volta". Também online e nas 3 duplas.
- Avançar sozinho (Ajustes, ligado por padrão): a próxima mão sai sozinha depois de uma pausa pela velocidade; o fim da partida espera. Online, o servidor dá a próxima mão.
- Equipe contra equipe: a aba Equipe em dois passos (sua equipe, equipe adversária) com o resumo; o nome das equipes no placar e sobre a mesa.

### Mudado
- Montar a mesa e Heróis x Vilões foram para "Mais jeitos de montar a mesa"; o seletor de personagens mostra uma equipe por vez.

## [0.3.0]

### Adicionado
- Jogar online: sala com código e link, até 4 pessoas, IA nos lugares vazios (você + IA contra um amigo + IA). Cada celular só recebe as próprias cartas; quem cai volta ao mesmo lugar.
- Servidor de salas na Cloudflare (`server/worker.ts`), publicado pelo workflow `Salas`.

### Corrigido
- A frase da mão de onze dizia "nós decidimos se jogam".

## [0.2.0]

### Adicionado
- Seu time: os 20 clubes da Série A 2026 com as cores e três jogadores; o craque vira sua dupla e o app fica nas cores do clube. Os nomes podem ser trocados.
- Modo rivais: você e o craque do seu time contra os dois principais de outro clube.

## [0.1.0]

### Adicionado
- Truco paulista: você e a Cida contra Biu e Toinho, vira e manilha, desempate de manilha pelo naipe, cangada, truco/seis/nove/doze, mão de onze, mão de ferro às cegas, até 12 pontos.
- IAs em três níveis (fácil, médio, difícil), com blefe; quem blefou mostra as cartas quando a outra dupla corre.
- Rodinhas: manilhas marcadas, ranking de cada carta, quem está levando e por quê.
- Treino ("Qual é a manilha?", "Quem ganha a rodada?"), ranking por vira e glossário.
- Mesa real: assistente para partida de verdade, com as cartas por toque (grade de 40) ou por voz.
- Animações, som e vibração, tema claro e escuro, app guardado no aparelho e aviso de versão nova (herdados do secret-game).
