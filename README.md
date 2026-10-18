# Truco

Truco paulista no celular: você e a Cida contra Biu e Toinho, três IAs com níveis fácil, médio e difícil, que blefam e pagam blefe. Feito para treinar o raciocínio da mesa (a manilha de cada vira, o desempate pelo naipe, a sequência) e depois jogar de verdade sem as rodinhas.

Feito a partir do [secret-game](https://github.com/lucasmagalhaees/secret-game), que veio do modelo de arquitetura do Oito Lados: página estática em TypeScript, um arquivo só no ar, núcleo puro testado no Node e no navegador, testes ponta a ponta com Playwright, deploy na Vercel a cada merge e um conjunto de regras para trabalhar com IA sem que ela diga que funciona sem ter rodado.

## O que faz

- **Partida contra a máquina**: truco paulista com vira e manilha, truco/seis/nove/doze, mão de onze, mão de ferro às cegas, até 12 pontos. Três níveis; as IAs blefam, e quando você corre elas mostram as cartas ("Era blefe!").
- **Rodinhas**: manilhas marcadas, lugar de cada carta no ranking, quem está levando a rodada, por que ela foi ganha. Tira quando quiser.
- **Treino**: "Qual é a manilha?" e "Quem ganha a rodada?", com duelos de manilha pelo naipe e cangadas, e a explicação de cada resposta.
- **Ranking e glossário**: escolha a vira e veja da mais forte para a mais fraca; zap, copas, espadilha, picafumo, cangar, mão de onze, mão de ferro, pé e mão.
- **Jogar online**: crie uma sala e mande o link; você e uma IA contra um amigo e outra IA (ou até 4 pessoas), cada um no seu celular.
- **Mesa real**: para partidas de verdade. Diga a vira e suas cartas por toque (grade com as 40 cartas) ou por voz, e o app mostra manilha, a força de cada carta, o que ainda ganha dela e qual carta joga.
- Animações, som e vibração; tema claro e escuro; abre sem internet depois da primeira vez e avisa quando sai versão nova.

As regras completas estão nos requisitos do [`CLAUDE.md`](CLAUDE.md).

Para rodar: `npm install` e `npm run dev`. Para testar tudo: `scripts/verify.sh`.

## Publicar na Vercel

1. Em vercel.com: **Add New → Project → Import** o repositório `truco`. O `vercel.json` já diz o que fazer (`npm ci`, `npm run build`, publicar `dist/`); não precisa mexer em nada.
2. Produção: https://turco-six.vercel.app. Se mudar, defina a variável `APP_PROD_URL` no GitHub (Settings → Secrets and variables → Actions → Variables) com o endereço que a Vercel deu.
3. Para jogar online: crie uma conta na Cloudflare, gere um token com "Edit Cloudflare Workers" e ponha `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` nos secrets do GitHub. O workflow `Salas` publica o servidor; o build na Vercel já aponta para ele (`ROOM_SERVER` no `vite.config.js`, ou a variável `VITE_ROOM_URL` para trocar).
4. No GitHub, proteja a `main`: exigir PR e os checks `checks`, `e2e (dark)` e `e2e (light)`. A Vercel publica o que chega na `main` sem olhar o CI; é essa proteção que segura código não testado.

## Estrutura

```
index.html
src/main.ts
src/core/
src/app/
src/sw.js
src/styles.css
vite.config.js
tsconfig.json
vercel.json
scripts/verify.sh
scripts/check_production.py
scripts/rename.py
tests/unit.cases.mjs
tests/core.mjs
tests/unit.py
tests/contract.py
tests/docs_check.py
tests/e2e.py
tests/pwa.py
tests/cov.py
tests/fixtures/source/
tests/e2e_online.py
tests/room_server.mjs
server/worker.ts
wrangler.toml
.github/workflows/salas.yml
.github/workflows/ci.yml
.github/workflows/producao.yml
.claude/settings.json
docs/decisoes.md
docs/verificacao.md
```

As regras de trabalho estão em [`CLAUDE.md`](CLAUDE.md) e em [`CONTRIBUTING.md`](CONTRIBUTING.md).
