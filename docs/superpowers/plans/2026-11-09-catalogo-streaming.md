# Catálogo de Streaming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Site local que mostra filmes e séries disponíveis por assinatura nos streamings do Brasil, em fileiras estilo Netflix, com janela de detalhes e trailer.

**Architecture:** App Nuxt 4 único. O navegador só fala com rotas `/api/...` do próprio Nuxt; essas rotas chamam o TMDB com o token guardado no servidor, normalizam a resposta para tipos próprios e ficam em cache. A interface é um componente de catálogo reutilizado para filmes e séries, mais um `<dialog>` global de detalhes.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Tailwind CSS 4 (`@tailwindcss/vite`), Vitest. Nenhuma outra dependência.

**Spec:** `docs/superpowers/specs/2026-11-09-catalogo-streaming-design.md`

## Global Constraints

- Dependências permitidas: `nuxt`, `vue`, `vue-router`, `tailwindcss`, `@tailwindcss/vite`, `vitest`, `typescript`. Sem Pinia, sem banco, sem biblioteca de carrossel ou modal.
- Token do TMDB só no servidor: variável `NUXT_TMDB_TOKEN` em `.env`, lida por `runtimeConfig.tmdbToken`. Nunca em `runtimeConfig.public`, nunca no git.
- Toda chamada ao TMDB leva `language=pt-BR`. Disponibilidade sempre com `watch_region=BR` e só `flatrate` (assinatura).
- Um título sem nenhum provedor `flatrate` no BR não aparece em fileira nenhuma.
- Textos da interface em português do Brasil. Tema escuro.
- Rodapé em todas as páginas com: "Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB." e "Dados de disponibilidade fornecidos por JustWatch."
- Imagens: `https://image.tmdb.org/t/p/` + tamanho + caminho. Tamanhos: pôster `w342`, fundo `w1280`, logo `w92`, foto de elenco `w185`.
- Commits terminam com `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`.
- Os endpoints do TMDB neste plano foram escritos de memória. A Task 3 confere cada um contra a API real antes de seguir.

## Review Focus

1. Título que o `discover` devolve mas que não tem `flatrate` no BR (ou cuja busca de provedores falhou): some da fileira, sem quebrar as outras capas. → teste na Task 2 (`montarFileira`).
2. Título sem pôster, sem fundo ou sem sinopse em português: capa mostra o nome sobre fundo cinza; detalhes mostram "Sinopse não disponível." → testes na Task 2 (`paraTitulo`, `paraDetalhes`), conferência visual na Task 5.
3. Vídeos sem trailer do YouTube (só teaser, só Vimeo, lista vazia): `trailer` é `null` e o botão não aparece. → teste na Task 2 (`escolherTrailer`).
4. TMDB fora do ar, token ausente ou inválido: a rota responde 502 com mensagem em português; a fileira mostra "Não foi possível carregar." e botão "Tentar de novo"; as outras fileiras seguem. → verificação na Task 3 (sem token) e na Task 4.
5. `tipo` ou `id` inválidos na URL da API (`/api/abc/titulo/xyz`): 400, sem repassar nada ao TMDB. → teste na Task 2 (`validarTipo`, `validarId`), verificação por `curl` na Task 3.

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `package.json`, `nuxt.config.ts`, `tsconfig.json`, `.gitignore`, `.env.example` | Projeto e configuração |
| `app/assets/css/main.css` | `@import "tailwindcss";` |
| `app/app.vue` | Casca: menu, `<NuxtPage />`, rodapé de créditos, `<JanelaDetalhes />` |
| `shared/types/catalogo.ts` | Tipos usados no servidor e no app |
| `shared/utils/fileiras.ts` | Lista fixa de fileiras por tipo |
| `server/utils/normalizar.ts` | Funções puras: TMDB cru → tipos próprios, validação |
| `server/utils/tmdb.ts` | Cliente do TMDB com token e cache |
| `server/api/[tipo]/fileira/[id].get.ts` | Títulos de uma fileira, já com provedores |
| `server/api/[tipo]/titulo/[id].get.ts` | Detalhes de um título |
| `app/pages/index.vue`, `app/pages/series.vue` | `<Catalogo tipo="movie" />` e `<Catalogo tipo="tv" />` |
| `app/components/Catalogo.vue` | Destaque + lista de fileiras |
| `app/components/Destaque.vue` | Banner do título mais popular |
| `app/components/Fileira.vue` | Uma fileira: busca, rolagem, erro e "tentar de novo" |
| `app/components/Capa.vue` | Pôster + selos; botão que abre os detalhes |
| `app/components/JanelaDetalhes.vue` | `<dialog>` com detalhes e trailer |
| `app/composables/useTituloAberto.ts` | Estado de qual título está aberto |
| `test/normalizar.test.ts` | Testes das funções puras |

---

### Task 1: Projeto, casca e créditos

**Files:**
- Create: `package.json`, `nuxt.config.ts`, `tsconfig.json`, `.gitignore`, `.env.example`, `app/assets/css/main.css`, `app/app.vue`, `app/pages/index.vue`, `app/pages/series.vue`

**Interfaces:**
- Produces: projeto que sobe com `npm run dev`; scripts `dev`, `build`, `test` (`vitest run --passWithNoTests`); `runtimeConfig.tmdbToken`.

- [ ] **Step 1: Repositório próprio**

Em `C:\Users\Joao\Desktop\Catalogo`: `git init`. Criar `.gitignore` com `node_modules`, `.nuxt`, `.output`, `.env`, `.superpowers/`. (A pasta está dentro de um repositório que cobre a pasta de usuário inteira; sem o `git init` os commits iriam para ele.)

- [ ] **Step 2: Dependências, sem assistente interativo**

`npm init -y`, depois `npm i nuxt vue vue-router` e `npm i -D tailwindcss @tailwindcss/vite vitest typescript`. Scripts em `package.json`: `"dev": "nuxt dev"`, `"build": "nuxt build"`, `"test": "vitest run --passWithNoTests"`, `"postinstall": "nuxt prepare"`. `"type": "module"`.

- [ ] **Step 3: Configuração**

`nuxt.config.ts`: `compatibilityDate` de hoje, `css: ['~/assets/css/main.css']`, `vite.plugins: [tailwindcss()]`, `runtimeConfig: { tmdbToken: '' }`, `app.head.htmlAttrs.lang = 'pt-BR'`, `app.head.title = 'Catálogo'`.
`tsconfig.json`: `{ "extends": "./.nuxt/tsconfig.json" }`.
`.env.example`: `NUXT_TMDB_TOKEN=` com um comentário de uma linha dizendo que é o "API Read Access Token" de https://www.themoviedb.org/settings/api.

- [ ] **Step 4: Casca**

`app/app.vue`: fundo escuro em toda a página; `<header>` com o nome "Catálogo" e `<NuxtLink>` para `/` ("Filmes") e `/series` ("Séries"), com o link ativo destacado; `<NuxtPage />`; `<footer>` com as duas frases de crédito das Global Constraints, literais.
`app/pages/index.vue` e `app/pages/series.vue`: por enquanto só um `<h1>` ("Filmes" / "Séries").

- [ ] **Step 5: Verificar**

Run: `npm run dev`, abrir `http://localhost:3000` e `/series`.
Expected: fundo escuro, menu navega entre as duas páginas, rodapé com as duas frases, console do navegador sem erros.
Run: `npm test` → Expected: sai com código 0 ("No test files found").

- [ ] **Step 6: Commit**

`git add -A` (conferir que `.env` e `.superpowers/` não entraram) e `git commit -m "chore: projeto Nuxt com casca e créditos"`.

---

### Task 2: Tipos e normalização (funções puras, TDD)

**Files:**
- Create: `shared/types/catalogo.ts`, `shared/utils/fileiras.ts`, `server/utils/normalizar.ts`
- Test: `test/normalizar.test.ts`

**Interfaces:**
- Produces, em `shared/types/catalogo.ts`:

```ts
export type Tipo = 'movie' | 'tv'
export interface Provedor { id: number; nome: string; logo: string }          // logo = URL completa w92
export interface Titulo {
  id: number; tipo: Tipo; nome: string; sinopse: string
  poster: string | null; fundo: string | null                                 // URLs completas
  provedores: Provedor[]
}
export interface Pessoa { nome: string; personagem: string; foto: string | null }
export interface Detalhes extends Titulo {
  ano: string | null; duracaoMin: number | null; temporadas: number | null
  generos: string[]; nota: number | null
  elenco: Pessoa[]                                                            // no máximo 10
  trailer: string | null                                                      // key do YouTube
  linkJustWatch: string | null
}
export interface DefFileira { id: string; nome: string }                      // id: 'populares' ou id de gênero
```

- Produces, em `shared/utils/fileiras.ts`: `export const FILEIRAS: Record<Tipo, DefFileira[]>` com exatamente:
  - `movie`: populares "Populares agora", 28 "Ação", 35 "Comédia", 18 "Drama", 878 "Ficção científica", 27 "Terror", 16 "Animação", 10749 "Romance"
  - `tv`: populares "Populares agora", 10759 "Ação e aventura", 35 "Comédia", 18 "Drama", 10765 "Ficção científica e fantasia", 80 "Crime", 16 "Animação", 99 "Documentário"
- Produces, em `server/utils/normalizar.ts`:

```ts
export function validarTipo(v: unknown): Tipo | null            // só 'movie' | 'tv'
export function validarId(v: unknown): number | null            // só inteiro positivo em string de dígitos
export function img(tamanho: string, caminho: string | null | undefined): string | null
export function extrairProvedores(watchProviders: any): Provedor[]   // results.BR.flatrate → Provedor[]; qualquer ausência → []
export function linkJustWatch(watchProviders: any): string | null    // results.BR.link
export function escolherTrailer(videos: any): string | null
export function paraTitulo(raw: any, tipo: Tipo, provedores: Provedor[]): Titulo
export function montarFileira(resultados: any[], tipo: Tipo, provedoresPorId: Map<number, Provedor[]>): Titulo[]
export function paraDetalhes(raw: any, tipo: Tipo): Detalhes     // raw = detalhes com append credits, videos, watch/providers
```

- [ ] **Step 1: Escrever os testes que falham** em `test/normalizar.test.ts` (importando por caminho relativo). Um `it` por linha abaixo, com estas asserções:

  - `validarTipo`: `'movie'`→`'movie'`, `'tv'`→`'tv'`, `'abc'`/`undefined`/`'Movie'`→`null`
  - `validarId`: `'550'`→`550`; `'0'`, `'-1'`, `'1.5'`, `'12abc'`, `''`, `undefined`→`null`
  - `img`: `img('w342','/a.jpg')` → `'https://image.tmdb.org/t/p/w342/a.jpg'`; `img('w342', null)` → `null`
  - `extrairProvedores`: `{results:{BR:{flatrate:[{provider_id:8,provider_name:'Netflix',logo_path:'/n.jpg'}]}}}` → `[{id:8,nome:'Netflix',logo:'https://image.tmdb.org/t/p/w92/n.jpg'}]`; `{results:{US:{flatrate:[…]}}}` → `[]`; `{results:{BR:{rent:[…]}}}` → `[]`; `undefined` → `[]`
  - `linkJustWatch`: devolve `results.BR.link`; sem BR → `null`
  - `escolherTrailer`: prefere `iso_639_1 === 'pt'` entre os `site==='YouTube' && type==='Trailer'`; sem pt, devolve o primeiro que casa; só `Teaser` → `null`; só `site:'Vimeo'` → `null`; `{results:[]}` e `undefined` → `null`
  - `paraTitulo`: filme usa `title`, série usa `name`; `poster_path: null` → `poster: null`; `overview` ausente → `sinopse: ''`
  - `montarFileira`: de 3 resultados, um com provedores no mapa, um com `[]` no mapa e um ausente do mapa → devolve só o primeiro, na ordem original
  - `paraDetalhes` (filme): `release_date:'2025-03-01'` → `ano:'2025'`; `runtime:128` → `duracaoMin:128`, `temporadas:null`; `genres` → nomes; `vote_average:7.84` → `nota:7.8`; `vote_average:0` → `nota:null`; elenco de 15 → 10, com `foto` `w185` ou `null`
  - `paraDetalhes` (série): `first_air_date` → `ano`; `number_of_seasons:3` → `temporadas:3`, `duracaoMin:null`
  - `paraDetalhes` com `release_date:''`, sem `credits`, sem `videos`, sem `watch/providers` → `ano:null`, `elenco:[]`, `trailer:null`, `provedores:[]`, `linkJustWatch:null`, sem lançar erro

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test` → Expected: FAIL (funções não existem).

- [ ] **Step 3: Implementar** `shared/types/catalogo.ts`, `shared/utils/fileiras.ts` e `server/utils/normalizar.ts` conforme as assinaturas acima. `normalizar.ts` importa os tipos por caminho relativo (para o Vitest rodar sem ambiente Nuxt) e não usa nenhuma API do Nuxt.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test` → Expected: PASS em todos.

- [ ] **Step 5: Commit**

`git commit -m "feat: tipos e normalização das respostas do TMDB"`

---

### Task 3: Servidor — cliente TMDB e rotas

**Pré-requisito:** arquivo `.env` com `NUXT_TMDB_TOKEN=<API Read Access Token do Joao>`. Sem isso, parar e pedir.

**Files:**
- Create: `server/utils/tmdb.ts`, `server/api/[tipo]/fileira/[id].get.ts`, `server/api/[tipo]/titulo/[id].get.ts`

**Interfaces:**
- Consumes: tudo de `server/utils/normalizar.ts`; `FILEIRAS`.
- Produces:
  - `tmdb<T = any>(caminho: string, query?: Record<string, string | number>): Promise<T>` — GET em `https://api.themoviedb.org/3` + caminho, header `Authorization: Bearer <tmdbToken>`, sempre com `language=pt-BR`. Envolvido em `defineCachedFunction` com `maxAge: 60 * 60 * 6` e `getKey` formado por caminho + query ordenada. Token vazio ou falha do TMDB → `createError({ statusCode: 502, statusMessage: 'Não foi possível consultar o TMDB.' })` (erros não entram no cache).
  - `GET /api/{tipo}/fileira/{id}` → `Titulo[]`
  - `GET /api/{tipo}/titulo/{id}` → `Detalhes`

- [ ] **Step 1: Conferir os endpoints contra a API real**

Com o token, rodar três `curl` (header `Authorization: Bearer …`) e comparar o formato com o que `normalizar.ts` espera:
  - `/3/discover/movie?language=pt-BR&watch_region=BR&with_watch_monetization_types=flatrate&sort_by=popularity.desc`
  - `/3/movie/{id}/watch/providers` (com um id do resultado anterior) → existe `results.BR.flatrate[].provider_id|provider_name|logo_path` e `results.BR.link`
  - `/3/movie/{id}?language=pt-BR&append_to_response=credits,videos,watch/providers&include_video_language=pt,en` → chaves `credits.cast`, `videos.results`, `watch/providers.results`

Expected: os três respondem 200 com esses campos. Se algum nome diferir, corrigir `normalizar.ts` e seus testes antes de continuar e registrar a diferença na mensagem do commit.

- [ ] **Step 2: Implementar `server/utils/tmdb.ts`** conforme a interface.

- [ ] **Step 3: Implementar `server/api/[tipo]/fileira/[id].get.ts`**

`validarTipo` no parâmetro `tipo` (400 se `null`). `id` precisa existir em `FILEIRAS[tipo]` (400 se não). Chama `/discover/{tipo}` com `watch_region=BR`, `with_watch_monetization_types=flatrate`, `sort_by=popularity.desc` e, se `id !== 'populares'`, `with_genres=id`. Para cada resultado busca `/{tipo}/{idTitulo}/watch/providers` com `Promise.allSettled`; os que falharem ficam fora do mapa. Devolve `montarFileira(...)`.

- [ ] **Step 4: Implementar `server/api/[tipo]/titulo/[id].get.ts`**

`validarTipo` e `validarId` (400 se `null`). Chama `/{tipo}/{id}` com `append_to_response=credits,videos,watch/providers` e `include_video_language=pt,en`. Devolve `paraDetalhes(raw, tipo)`.

- [ ] **Step 5: Verificar com o servidor rodando**

Run: `npm run dev`, depois:
  - `curl -s localhost:3000/api/movie/fileira/populares` → array não vazio; todo item tem `provedores.length >= 1`
  - `curl -s localhost:3000/api/tv/fileira/18` → idem
  - `curl -s localhost:3000/api/movie/titulo/<id do primeiro>` → objeto com `nome`, `ano`, `elenco`, `provedores`
  - `curl -s -o /dev/null -w "%{http_code}" localhost:3000/api/abc/fileira/populares` → `400`
  - `curl -s -o /dev/null -w "%{http_code}" localhost:3000/api/movie/fileira/999999` → `400`
  - `curl -s -o /dev/null -w "%{http_code}" localhost:3000/api/movie/titulo/xyz` → `400`
  - segunda chamada da mesma fileira responde visivelmente mais rápido (cache)
  - renomear `.env` temporariamente, reiniciar, chamar uma fileira → `502`; restaurar o `.env`
  - `grep -r "tmdbToken\|NUXT_TMDB" .nuxt/dist/client 2>/dev/null` e o código-fonte da página no navegador → o token não aparece

- [ ] **Step 6: Commit**

`git commit -m "feat: rotas de fileira e de detalhes sobre o TMDB com cache"`

---

### Task 4: Catálogo — destaque, fileiras e capas

**Files:**
- Create: `app/composables/useTituloAberto.ts`, `app/components/Capa.vue`, `app/components/Fileira.vue`, `app/components/Destaque.vue`, `app/components/Catalogo.vue`
- Modify: `app/pages/index.vue`, `app/pages/series.vue`

**Interfaces:**
- Consumes: `GET /api/{tipo}/fileira/{id}` → `Titulo[]`; `FILEIRAS`; tipos.
- Produces:
  - `useTituloAberto(): Ref<{ tipo: Tipo; id: number } | null>` (via `useState('tituloAberto', () => null)`)
  - `<Capa :titulo="Titulo" />`, `<Fileira :tipo="Tipo" :def="DefFileira" />`, `<Destaque :titulo="Titulo" />`, `<Catalogo :tipo="Tipo" />`

- [ ] **Step 1: `Capa.vue`**

Um `<button type="button">` (foco por teclado) de proporção 2:3 com `aria-label` = nome do título. Com `poster`: `<img loading="lazy" alt="">`. Sem `poster`: fundo cinza com o nome em texto. No canto inferior direito, até 3 logos de `provedores` (`alt` = nome do provedor); se houver mais, um "+N". Clique: `useTituloAberto().value = { tipo, id }`.

- [ ] **Step 2: `Fileira.vue`**

`useLazyFetch<Titulo[]>` em `/api/${tipo}/fileira/${def.id}`. Título da fileira (`def.nome`) em `<h2>`. Estados: carregando → blocos cinza no lugar das capas; erro → "Não foi possível carregar." + botão "Tentar de novo" que chama `refresh()`; lista vazia → a fileira não renderiza nada; sucesso → faixa horizontal com `overflow-x-auto` e `scroll-snap`, uma `<Capa>` por título.

- [ ] **Step 3: `Destaque.vue`**

Banner largo com `titulo.fundo` como imagem (gradiente escuro por cima para o texto ficar legível; sem `fundo`, só o gradiente), nome grande, sinopse cortada em 3 linhas e botão "Ver detalhes" que abre o título via `useTituloAberto`.

- [ ] **Step 4: `Catalogo.vue` e páginas**

`Catalogo` busca a fileira `populares` com `useFetch` (a mesma URL da `<Fileira>`, então o Nuxt reaproveita a resposta) e passa o primeiro item ao `<Destaque>`; se a busca falhar ou vier vazia, o destaque não aparece. Abaixo, um `<Fileira>` para cada item de `FILEIRAS[tipo]`.
`index.vue` → `<Catalogo tipo="movie" />`; `series.vue` → `<Catalogo tipo="tv" />`.

- [ ] **Step 5: Verificar no navegador**

Run: `npm run dev`.
Expected em `/` e em `/series`: destaque com imagem; 8 fileiras com os nomes de `FILEIRAS`; toda capa com pelo menos um logo de streaming; rolagem lateral funciona com mouse e com Tab; console sem erros; a aba Rede só mostra chamadas a `/api/...` e a `image.tmdb.org`, nenhuma a `api.themoviedb.org`.
Com o `.env` renomeado e servidor reiniciado: cada fileira mostra a mensagem de erro e o botão; a página não quebra. Restaurar o `.env`.

- [ ] **Step 6: Commit**

`git commit -m "feat: catálogo com destaque, fileiras e selos de streaming"`

---

### Task 5: Janela de detalhes e trailer

**Files:**
- Create: `app/components/JanelaDetalhes.vue`
- Modify: `app/app.vue` (incluir `<JanelaDetalhes />` uma vez)

**Interfaces:**
- Consumes: `useTituloAberto()`; `GET /api/{tipo}/titulo/{id}` → `Detalhes`.

- [ ] **Step 1: `JanelaDetalhes.vue`**

Um `<dialog>` nativo. Quando `useTituloAberto()` passa a ter valor: `showModal()` e busca dos detalhes; quando volta a `null`: `close()`. O evento `close` do dialog (Esc incluso) zera o estado e desliga o trailer. Clique no fundo escurecido (evento de clique cujo alvo é o próprio `<dialog>`) fecha. Botão "✕" com `aria-label="Fechar"`. Não escrever lógica de foco: `showModal()` já prende o foco e o devolve à capa ao fechar.

Conteúdo, na ordem:
  - topo: imagem `fundo`; ao clicar em "Trailer", ela dá lugar a `<iframe src="https://www.youtube-nocookie.com/embed/{trailer}?autoplay=1" allow="autoplay; encrypted-media; fullscreen" title="Trailer de {nome}">`. O botão "Trailer" só existe se `trailer !== null`. O iframe é removido do DOM ao fechar (para o som parar).
  - nome; linha de dados: `ano` · duração como "2h08" (filme) ou "3 temporadas" / "1 temporada" (série) · gêneros · "★ 7,8" (vírgula decimal). Cada parte `null` é omitida junto com seu separador.
  - "Onde assistir": logos dos `provedores` com `alt`; se `linkJustWatch`, link "Ver no JustWatch" (`target="_blank" rel="noopener"`).
  - "Sinopse": texto, ou "Sinopse não disponível." se vazia.
  - "Elenco": foto redonda (ou círculo cinza), nome e personagem; a seção some se `elenco` estiver vazio.

Estados: carregando → esqueleto; erro → "Não foi possível carregar os detalhes." + "Tentar de novo".

- [ ] **Step 2: Verificar no navegador**

Run: `npm run dev`.
Expected:
  - clicar numa capa abre a janela com os dados daquele título; os logos de "Onde assistir" batem com a seção de streaming da página do título em themoviedb.org
  - "Trailer" toca dentro da janela; fechar para o som
  - fecha com ✕, com Esc e com clique fora; após fechar, a fileira está na mesma posição de rolagem e o foco voltou para a capa clicada
  - abrir pelo botão do destaque também funciona; abrir uma série mostra temporadas em vez de duração
  - abrir pelo menos um título sem trailer (procurar nas fileiras até achar): sem botão "Trailer", sem erro
  - navegação só por teclado: Tab até uma capa, Enter abre, Tab não sai da janela, Esc fecha
  - console sem erros

- [ ] **Step 3: Rodada final**

Run: `npm test` → PASS. Run: `npm run build` → conclui sem erros.

- [ ] **Step 4: Commit**

`git commit -m "feat: janela de detalhes com trailer"`
