// Funções puras: resposta crua do TMDB -> tipos do app. Sem APIs do Nuxt, para rodar no Vitest.
import type { Detalhes, Provedor, Tipo, Titulo } from '../../shared/types/catalogo'

export function validarTipo(v: unknown): Tipo | null {
  return v === 'movie' || v === 'tv' ? v : null
}

export function validarId(v: unknown): number | null {
  return typeof v === 'string' && /^[1-9]\d*$/.test(v) ? Number(v) : null
}

export function img(tamanho: string, caminho: string | null | undefined): string | null {
  return caminho ? `https://image.tmdb.org/t/p/${tamanho}${caminho}` : null
}

export function extrairProvedores(watchProviders: any): Provedor[] {
  const lista: any[] = watchProviders?.results?.BR?.flatrate ?? []
  return lista.map(p => ({ id: p.provider_id, nome: p.provider_name, logo: img('w92', p.logo_path) ?? '' }))
}

export function linkJustWatch(watchProviders: any): string | null {
  return watchProviders?.results?.BR?.link ?? null
}

export function escolherTrailer(videos: any): string | null {
  const trailers: any[] = (videos?.results ?? []).filter((v: any) => v.site === 'YouTube' && v.type === 'Trailer')
  return (trailers.find(v => v.iso_639_1 === 'pt') ?? trailers[0])?.key ?? null
}

export function paraTitulo(raw: any, tipo: Tipo, provedores: Provedor[]): Titulo {
  return {
    id: raw.id,
    tipo,
    nome: (tipo === 'movie' ? raw.title : raw.name) ?? '',
    sinopse: raw.overview ?? '',
    poster: img('w342', raw.poster_path),
    fundo: img('w1280', raw.backdrop_path),
    provedores,
  }
}

export function montarFileira(resultados: any[], tipo: Tipo, provedoresPorId: Map<number, Provedor[]>): Titulo[] {
  return resultados
    .filter(r => provedoresPorId.get(r.id)?.length)
    .map(r => paraTitulo(r, tipo, provedoresPorId.get(r.id)!))
}

export function validarBusca(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const q = v.trim()
  return q.length >= 1 && q.length <= 100 ? q : null
}

// itens: resultados do /search/multi; provedores[i] pertence a itens[i] (undefined = busca falhou).
export function montarBusca(itens: any[], provedores: (Provedor[] | undefined)[]): Titulo[] {
  return itens.flatMap((r, i) => {
    const tipo = validarTipo(r.media_type)
    return tipo && provedores[i]?.length ? [paraTitulo(r, tipo, provedores[i]!)] : []
  })
}

export function paraDetalhes(raw: any, tipo: Tipo): Detalhes {
  const wp = raw['watch/providers']
  const data: string = (tipo === 'movie' ? raw.release_date : raw.first_air_date) ?? ''
  return {
    ...paraTitulo(raw, tipo, extrairProvedores(wp)),
    ano: data.slice(0, 4) || null,
    duracaoMin: (tipo === 'movie' && raw.runtime) || null,
    temporadas: (tipo === 'tv' && raw.number_of_seasons) || null,
    generos: (raw.genres ?? []).map((g: any) => g.name),
    nota: raw.vote_average ? Math.round(raw.vote_average * 10) / 10 : null,
    elenco: (raw.credits?.cast ?? []).slice(0, 10).map((p: any) => ({
      nome: p.name,
      personagem: p.character ?? '',
      foto: img('w185', p.profile_path),
    })),
    trailer: escolherTrailer(raw.videos),
    linkJustWatch: linkJustWatch(wp),
  }
}
