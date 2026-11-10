export default defineEventHandler(async (event) => {
  const tipo = validarTipo(getRouterParam(event, 'tipo'))
  const id = validarId(getRouterParam(event, 'id'))
  if (!tipo || !id) throw createError({ statusCode: 400, message: 'Título inválido.' })

  const raw = await tmdb(`/${tipo}/${id}`, {
    append_to_response: 'credits,videos,watch/providers',
    include_video_language: 'pt,en',
  })
  return paraDetalhes(raw, tipo)
})
