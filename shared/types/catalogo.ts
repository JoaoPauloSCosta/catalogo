export type Tipo = 'movie' | 'tv'

export interface Provedor {
  id: number
  nome: string
  logo: string
}

export interface Titulo {
  id: number
  tipo: Tipo
  nome: string
  sinopse: string
  poster: string | null
  fundo: string | null
  provedores: Provedor[]
}

export interface Pessoa {
  nome: string
  personagem: string
  foto: string | null
}

export interface Detalhes extends Titulo {
  ano: string | null
  duracaoMin: number | null
  temporadas: number | null
  generos: string[]
  nota: number | null
  elenco: Pessoa[]
  trailer: string | null
  linkJustWatch: string | null
}

export interface DefFileira {
  id: string
  nome: string
}
