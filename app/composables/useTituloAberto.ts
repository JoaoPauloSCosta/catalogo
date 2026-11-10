import type { Tipo } from '#shared/types/catalogo'

export const useTituloAberto = () => useState<{ tipo: Tipo, id: number } | null>('tituloAberto', () => null)
