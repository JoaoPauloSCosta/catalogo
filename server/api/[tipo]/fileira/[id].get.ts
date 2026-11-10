import type { Provedor } from '#shared/types/catalogo'
import { FILEIRAS } from '#shared/utils/fileiras'

export default defineEventHandler(async (event) => {
  const tipo = validarTipo(getRouterParam(event, 'tipo'))
  const id = getRouterParam(event, 'id')
  if (!tipo || !FILEIRAS[tipo].some(f => f.id === id))
    throw createError({ statusCode: 400, message: 'Fileira inválida.' })

  const query: Record<string, string> = {
    watch_region: 'BR',
    with_watch_monetization_types: 'flatrate',
    sort_by: 'popularity.desc',
  }
  if (id !== 'populares') query.with_genres = id!

  const { results = [] } = await tmdb<{ results: any[] }>(`/discover/${tipo}`, query)

  // O discover não traz os streamings de cada título: busca um a um (em cache). Quem falhar fica fora da fileira.
  const respostas = await Promise.allSettled(results.map(r => tmdb(`/${tipo}/${r.id}/watch/providers`)))
  const provedoresPorId = new Map<number, Provedor[]>()
  respostas.forEach((r, i) => {
    if (r.status === 'fulfilled') provedoresPorId.set(results[i].id, extrairProvedores(r.value))
  })

  return montarFileira(results, tipo, provedoresPorId)
})
