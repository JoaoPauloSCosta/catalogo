// Única porta de saída para o TMDB. Respostas ficam 6h em cache; erros não são guardados.
const buscar = defineCachedFunction(
  async (caminho: string, query: Record<string, string | number>) => {
    const { tmdbToken } = useRuntimeConfig()
    if (!tmdbToken) throw createError({ statusCode: 502, message: 'Token do TMDB não configurado (.env).' })
    try {
      return await $fetch<any>(`https://api.themoviedb.org/3${caminho}`, {
        query: { ...query, language: 'pt-BR' },
        headers: { Authorization: `Bearer ${tmdbToken}` },
      })
    }
    catch (e: any) {
      if (e?.statusCode === 404) throw createError({ statusCode: 404, message: 'Não encontrado no TMDB.' })
      throw createError({ statusCode: 502, message: 'Não foi possível consultar o TMDB.' })
    }
  },
  { name: 'tmdb', maxAge: 60 * 60 * 6 },
)

export function tmdb<T = any>(caminho: string, query: Record<string, string | number> = {}): Promise<T> {
  return buscar(caminho, query) as Promise<T>
}
