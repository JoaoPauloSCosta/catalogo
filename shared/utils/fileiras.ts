import type { DefFileira, Tipo } from '../types/catalogo'

// Ids numéricos são ids de gênero do TMDB (diferentes entre filme e série).
export const FILEIRAS: Record<Tipo, DefFileira[]> = {
  movie: [
    { id: 'populares', nome: 'Populares agora' },
    { id: '28', nome: 'Ação' },
    { id: '35', nome: 'Comédia' },
    { id: '18', nome: 'Drama' },
    { id: '878', nome: 'Ficção científica' },
    { id: '27', nome: 'Terror' },
    { id: '16', nome: 'Animação' },
    { id: '10749', nome: 'Romance' },
  ],
  tv: [
    { id: 'populares', nome: 'Populares agora' },
    { id: '10759', nome: 'Ação e aventura' },
    { id: '35', nome: 'Comédia' },
    { id: '18', nome: 'Drama' },
    { id: '10765', nome: 'Ficção científica e fantasia' },
    { id: '80', nome: 'Crime' },
    { id: '16', nome: 'Animação' },
    { id: '99', nome: 'Documentário' },
  ],
}
