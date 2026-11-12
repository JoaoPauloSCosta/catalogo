import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-09',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  // Só no servidor: nunca mover para runtimeConfig.public
  runtimeConfig: { tmdbToken: '' },
  app: {
    head: { title: 'Catálogo', htmlAttrs: { lang: 'pt-BR' } },
  },
})
