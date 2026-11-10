import { describe, expect, it } from 'vitest'
import {
  escolherTrailer,
  extrairProvedores,
  img,
  linkJustWatch,
  montarBusca,
  montarFileira,
  paraDetalhes,
  paraTitulo,
  validarBusca,
  validarId,
  validarTipo,
} from '../server/utils/normalizar'

const netflixCru = { provider_id: 8, provider_name: 'Netflix', logo_path: '/n.jpg' }
const netflix = { id: 8, nome: 'Netflix', logo: 'https://image.tmdb.org/t/p/w92/n.jpg' }

describe('validarTipo', () => {
  it('aceita só movie e tv', () => {
    expect(validarTipo('movie')).toBe('movie')
    expect(validarTipo('tv')).toBe('tv')
    expect(validarTipo('abc')).toBeNull()
    expect(validarTipo(undefined)).toBeNull()
    expect(validarTipo('Movie')).toBeNull()
  })
})

describe('validarId', () => {
  it('aceita inteiro positivo escrito só com dígitos', () => {
    expect(validarId('550')).toBe(550)
  })
  it('rejeita o resto', () => {
    for (const v of ['0', '-1', '1.5', '12abc', '', undefined]) expect(validarId(v)).toBeNull()
  })
})

describe('img', () => {
  it('monta a URL completa', () => {
    expect(img('w342', '/a.jpg')).toBe('https://image.tmdb.org/t/p/w342/a.jpg')
  })
  it('sem caminho devolve null', () => {
    expect(img('w342', null)).toBeNull()
    expect(img('w342', undefined)).toBeNull()
  })
})

describe('extrairProvedores', () => {
  it('pega os de assinatura do Brasil', () => {
    expect(extrairProvedores({ results: { BR: { flatrate: [netflixCru] } } })).toEqual([netflix])
  })
  it('ignora outros países', () => {
    expect(extrairProvedores({ results: { US: { flatrate: [netflixCru] } } })).toEqual([])
  })
  it('ignora aluguel e compra', () => {
    expect(extrairProvedores({ results: { BR: { rent: [netflixCru], buy: [netflixCru] } } })).toEqual([])
  })
  it('sem dados devolve lista vazia', () => {
    expect(extrairProvedores(undefined)).toEqual([])
  })
})

describe('linkJustWatch', () => {
  it('devolve o link do Brasil', () => {
    expect(linkJustWatch({ results: { BR: { link: 'https://x/br' } } })).toBe('https://x/br')
  })
  it('sem Brasil devolve null', () => {
    expect(linkJustWatch({ results: { US: { link: 'https://x/us' } } })).toBeNull()
    expect(linkJustWatch(undefined)).toBeNull()
  })
})

describe('escolherTrailer', () => {
  const v = (key: string, extra: object = {}) => ({ key, site: 'YouTube', type: 'Trailer', iso_639_1: 'en', ...extra })

  it('prefere o trailer em português', () => {
    expect(escolherTrailer({ results: [v('en1'), v('pt1', { iso_639_1: 'pt' })] })).toBe('pt1')
  })
  it('sem português usa o primeiro trailer do YouTube', () => {
    expect(escolherTrailer({ results: [v('teaser', { type: 'Teaser' }), v('en1'), v('en2')] })).toBe('en1')
  })
  it('só teaser devolve null', () => {
    expect(escolherTrailer({ results: [v('t', { type: 'Teaser' })] })).toBeNull()
  })
  it('só Vimeo devolve null', () => {
    expect(escolherTrailer({ results: [v('vm', { site: 'Vimeo' })] })).toBeNull()
  })
  it('lista vazia ou ausente devolve null', () => {
    expect(escolherTrailer({ results: [] })).toBeNull()
    expect(escolherTrailer(undefined)).toBeNull()
  })
})

describe('paraTitulo', () => {
  it('filme usa title, série usa name', () => {
    expect(paraTitulo({ id: 1, title: 'Filme', name: 'x' }, 'movie', []).nome).toBe('Filme')
    expect(paraTitulo({ id: 2, name: 'Série' }, 'tv', []).nome).toBe('Série')
  })
  it('monta as URLs de imagem e carrega os provedores', () => {
    expect(paraTitulo({ id: 1, title: 'F', overview: 'S', poster_path: '/p.jpg', backdrop_path: '/b.jpg' }, 'movie', [netflix])).toEqual({
      id: 1,
      tipo: 'movie',
      nome: 'F',
      sinopse: 'S',
      poster: 'https://image.tmdb.org/t/p/w342/p.jpg',
      fundo: 'https://image.tmdb.org/t/p/w1280/b.jpg',
      provedores: [netflix],
    })
  })
  it('sem pôster e sem sinopse não quebra', () => {
    const t = paraTitulo({ id: 1, title: 'F', poster_path: null }, 'movie', [])
    expect(t.poster).toBeNull()
    expect(t.fundo).toBeNull()
    expect(t.sinopse).toBe('')
  })
})

describe('montarFileira', () => {
  it('mantém só títulos com provedor, na ordem original', () => {
    const resultados = [{ id: 3, title: 'C' }, { id: 1, title: 'A' }, { id: 2, title: 'B' }, { id: 4, title: 'D' }]
    const mapa = new Map([[3, [netflix]], [1, []], [4, [netflix]]])
    expect(montarFileira(resultados, 'movie', mapa).map(t => t.id)).toEqual([3, 4])
  })
})

describe('paraDetalhes', () => {
  const pessoa = (i: number) => ({ name: `Ator ${i}`, character: `P ${i}`, profile_path: i === 0 ? '/f.jpg' : null })
  const filme = {
    id: 550,
    title: 'Filme',
    overview: 'Sinopse',
    release_date: '2025-03-01',
    runtime: 128,
    genres: [{ id: 28, name: 'Ação' }, { id: 12, name: 'Aventura' }],
    vote_average: 7.84,
    credits: { cast: Array.from({ length: 15 }, (_, i) => pessoa(i)) },
    videos: { results: [{ key: 'abc', site: 'YouTube', type: 'Trailer', iso_639_1: 'pt' }] },
    'watch/providers': { results: { BR: { link: 'https://x/br', flatrate: [netflixCru] } } },
  }

  it('filme: ano, duração, gêneros, nota, trailer e onde assistir', () => {
    const d = paraDetalhes(filme, 'movie')
    expect(d.ano).toBe('2025')
    expect(d.duracaoMin).toBe(128)
    expect(d.temporadas).toBeNull()
    expect(d.generos).toEqual(['Ação', 'Aventura'])
    expect(d.nota).toBe(7.8)
    expect(d.trailer).toBe('abc')
    expect(d.provedores).toEqual([netflix])
    expect(d.linkJustWatch).toBe('https://x/br')
  })
  it('elenco limitado a 10, com foto ou null', () => {
    const d = paraDetalhes(filme, 'movie')
    expect(d.elenco).toHaveLength(10)
    expect(d.elenco[0]).toEqual({ nome: 'Ator 0', personagem: 'P 0', foto: 'https://image.tmdb.org/t/p/w185/f.jpg' })
    expect(d.elenco[1].foto).toBeNull()
  })
  it('nota zero vira null', () => {
    expect(paraDetalhes({ ...filme, vote_average: 0 }, 'movie').nota).toBeNull()
  })
  it('série: ano de estreia e temporadas no lugar da duração', () => {
    const d = paraDetalhes({ id: 9, name: 'Série', first_air_date: '2019-10-05', number_of_seasons: 3 }, 'tv')
    expect(d.nome).toBe('Série')
    expect(d.ano).toBe('2019')
    expect(d.temporadas).toBe(3)
    expect(d.duracaoMin).toBeNull()
  })
  it('resposta pobre não quebra', () => {
    const d = paraDetalhes({ id: 1, title: 'F', release_date: '' }, 'movie')
    expect(d.ano).toBeNull()
    expect(d.duracaoMin).toBeNull()
    expect(d.generos).toEqual([])
    expect(d.nota).toBeNull()
    expect(d.elenco).toEqual([])
    expect(d.trailer).toBeNull()
    expect(d.provedores).toEqual([])
    expect(d.linkJustWatch).toBeNull()
  })
})

describe('validarBusca', () => {
  it('apara espaços e aceita texto de 1 a 100 caracteres', () => {
    expect(validarBusca('  batman ')).toBe('batman')
    expect(validarBusca('a'.repeat(100))).toBe('a'.repeat(100))
  })
  it('rejeita vazio, longo demais e o que não é texto', () => {
    for (const v of ['', '   ', 'a'.repeat(101), undefined, ['a', 'b']]) expect(validarBusca(v)).toBeNull()
  })
})

describe('montarBusca', () => {
  it('mistura filmes e séries na ordem, sem pessoas e sem títulos fora dos streamings', () => {
    const itens = [
      { id: 1, media_type: 'movie', title: 'Filme' },
      { id: 2, media_type: 'person', name: 'Ator' },
      { id: 3, media_type: 'tv', name: 'Série' },
      { id: 4, media_type: 'movie', title: 'Sem streaming' },
      { id: 5, media_type: 'tv', name: 'Busca de provedor falhou' },
    ]
    const r = montarBusca(itens, [[netflix], [netflix], [netflix], [], undefined])
    expect(r.map(t => [t.id, t.tipo, t.nome])).toEqual([[1, 'movie', 'Filme'], [3, 'tv', 'Série']])
  })
})
