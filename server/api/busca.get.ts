export default defineEventHandler(async (event) => {
  const q = validarBusca(getQuery(event).q)
  if (!q) return []

  const { results = [] } = await tmdb<{ results: any[] }>('/search/multi', { query: q, include_adult: 'false' })

  // A busca do TMDB não filtra por streaming: confere título a título e descarta os que não estão em nenhum no Brasil.
  const respostas = await Promise.allSettled(
    results.map(r => validarTipo(r.media_type) ? tmdb(`/${r.media_type}/${r.id}/watch/providers`) : Promise.reject()),
  )
  return montarBusca(results, respostas.map(r => r.status === 'fulfilled' ? extrairProvedores(r.value) : undefined))
})
