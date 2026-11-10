# Catálogo de Streaming — Design

Data: 2026-11-09

Legenda: **[Joao]** = decidido pelo dono do projeto. **[palpite]** = escolha de quem escreveu este documento, pode ser vetada.

## Intenção

Um site pessoal que mostra, num lugar só, os filmes e séries disponíveis hoje nos serviços de streaming do Brasil, com a cara e a navegação de um streaming (Netflix, Prime Video, Apple TV). Os dados vêm da API do TMDB. **[Joao]**

O uso é: abrir no navegador, passear pelas capas, escolher um título, ver as informações e assistir ao trailer, se houver. **[Joao]**

## Quem usa e onde roda

- Só o próprio Joao. **[Joao]**
- Roda apenas no computador dele (`npm run dev` ou build local). Sem publicação. **[Joao]**

## Objetivos

1. Tela de catálogo com fileiras horizontais de capas por tema, misturando todos os streamings. **[Joao — opção B do esboço]**
2. Selo do(s) streaming(s) em cada capa, indicando onde assistir. **[Joao — opção B do esboço]**
3. Filmes e séries, cada um com sua entrada no menu. **[Joao]**
4. Detalhes do título numa janela por cima do catálogo; ao fechar, a pessoa continua onde estava. **[Joao — opção B do esboço]**
5. Trailer tocando dentro dessa janela, quando existir. **[Joao]**
6. Considerar qualquer serviço de streaming disponível no Brasil. **[Joao]**

## Fora do escopo (primeira versão)

Joao confirmou que a primeira versão está ok sem estes itens; pode pedir depois:

- Busca por nome
- Favoritos / "minha lista"
- Filtro por streaming
- Login, contas, banco de dados
- Publicação na internet
- Reprodução do filme em si (o app só cataloga)

## O que seria um fracasso mesmo "funcionando"

- Mostrar títulos que não estão em nenhum streaming no Brasil. **[palpite, derivado do objetivo]**
- A chave do TMDB aparecer no código do navegador ou no git. **[palpite]**
- Parecer uma tabela ou lista administrativa em vez de um catálogo de streaming. **[palpite, derivado de "como o do Netflix"]**

## Telas

### Catálogo (uma para filmes, uma para séries)

- Menu no topo: nome do app, **Filmes**, **Séries**. `/` abre Filmes. **[palpite]**
- Destaque grande no topo: o título mais popular do momento naquela aba, com imagem de fundo, nome e botão que abre os detalhes. **[palpite]**
- Fileiras horizontais com rolagem lateral:
  - "Populares agora" primeiro
  - depois uma fileira por gênero, usando a lista de gêneros do TMDB; cerca de 8 fileiras no total, 20 títulos cada. **[palpite]**
- Cada capa mostra o pôster e, no canto, o logo dos streamings onde está (até 3 logos, depois "+N"). **[palpite no limite de 3]**
- Rodapé com os créditos obrigatórios: logo/menção ao TMDB ("Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB") e crédito ao JustWatch pelos dados de disponibilidade. **[exigência do TMDB]**

### Janela de detalhes

Abre por cima do catálogo ao clicar numa capa ou no destaque. Contém:

- imagem de fundo, título, ano, duração (filme) ou número de temporadas (série), gêneros, nota
- botão **Trailer**: troca a imagem de fundo pelo player do YouTube embutido. Sem trailer, o botão não aparece.
- **Onde assistir**: logos dos serviços. O TMDB não fornece link direto para o título dentro de cada serviço; os logos são informativos e há um link para a página do título no JustWatch (campo `link` que o TMDB devolve). **[palpite]**
- sinopse
- elenco principal (foto, nome, personagem; uns 10 nomes) **[palpite na quantidade]**

Fecha com botão ✕, tecla Esc ou clique fora. O foco do teclado vai para a janela ao abrir e volta para a capa ao fechar (acessibilidade básica). **[palpite]**

Todos os textos da interface em português do Brasil. **[palpite, coerente com os outros projetos do Joao]**

## Como é construído

Joao deixou a tecnologia a critério de quem constrói. Tudo abaixo é **[palpite]**:

- **Nuxt 4 + Vue 3 + TypeScript + Tailwind**, a mesma base do projeto InvestHub.
- **Sem banco, sem Pinia, sem biblioteca de carrossel ou de modal.** Rolagem lateral com CSS (`overflow-x` + `scroll-snap`); janela com o elemento nativo `<dialog>`.
- **Chave do TMDB só no servidor.** Fica em `.env` (fora do git), lida via `runtimeConfig`. O navegador chama rotas `/api/...` do próprio Nuxt; elas chamam o TMDB.
- **Cache no servidor** das respostas do TMDB (algumas horas), para a tela abrir rápido e não estourar o limite de requisições.

### Dados do TMDB

Parâmetros fixos em todas as chamadas: `language=pt-BR`, `watch_region=BR`.

| Necessidade | Chamada |
|---|---|
| Títulos de uma fileira | `/discover/movie` ou `/discover/tv` com `watch_region=BR`, `with_watch_monetization_types=flatrate`, `sort_by=popularity.desc` e, nas fileiras de gênero, `with_genres` |
| Lista de gêneros | `/genre/movie/list`, `/genre/tv/list` |
| Selos na capa | `/movie/{id}/watch/providers` (ou `/tv/...`), pegando `results.BR.flatrate` |
| Detalhes | `/movie/{id}` ou `/tv/{id}` com `append_to_response=credits,videos,watch/providers` |
| Imagens | `https://image.tmdb.org/t/p/{tamanho}{caminho}` |

Pontos de atenção:

- **O `discover` não devolve os streamings de cada título.** Para o selo na capa, a rota do servidor busca os provedores de cada título da fileira e junta ao resultado antes de responder. Isso dá cerca de 20 chamadas extras por fileira, o que só é aceitável com o cache. As fileiras abaixo da primeira dobra podem carregar sob demanda.
- **"Streaming" = assinatura (`flatrate`).** Aluguel e compra ficam de fora. Serviços gratuitos com anúncio (`free`, `ads`) também ficam de fora nesta versão. **[palpite — é a leitura mais direta de "disponível nos streamings"]**
- **Trailer:** entre os vídeos do título, usar o primeiro com `site = YouTube` e `type = Trailer`, preferindo português e caindo para inglês (`include_video_language=pt,en`).
- **Campos ausentes:** título sem pôster, sem sinopse em português ou sem elenco deve aparecer com um substituto discreto, sem quebrar a tela.
- **Falha do TMDB:** a fileira mostra uma mensagem curta de erro com opção de tentar de novo; o resto da página continua funcionando.

Os nomes exatos de endpoints e parâmetros acima foram escritos de memória e devem ser conferidos na documentação (https://developer.themoviedb.org/reference/getting-started) no início da implementação.

## Verificação

- Um teste pequeno para a lógica que não é trivial: escolha do trailer e montagem dos selos a partir da resposta do TMDB.
- Conferência manual no navegador: catálogo de filmes e de séries carregam, janela abre/fecha, trailer toca, selos batem com o que a página do título mostra no TMDB.

## Deixado para quem constrói

- Estrutura de pastas e nomes de componentes e rotas
- Tempo exato de cache e estratégia de carregamento das fileiras
- Quais gêneros entram e em que ordem
- Identidade visual (cores, tipografia), dentro de "tema escuro com cara de streaming"
- Tamanhos de imagem

## Pré-requisitos e arrumação

- Joao precisa de uma conta no TMDB e de uma chave de API (gratuita).
- A pasta `Catalogo` está dentro de um repositório git que cobre a pasta de usuário inteira. O primeiro passo da implementação é criar um repositório próprio em `Catalogo` (`git init`), com `.env` e `.superpowers/` no `.gitignore`.
