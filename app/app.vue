<template>
  <div class="min-h-screen bg-neutral-950 text-neutral-100">
    <header class="sticky top-0 z-10 flex items-center gap-6 bg-neutral-950/90 px-6 py-4 backdrop-blur">
      <span class="text-xl font-bold tracking-tight">Catálogo</span>
      <nav class="flex gap-4 text-sm">
        <NuxtLink to="/" class="text-neutral-400 hover:text-white" exact-active-class="!text-white font-semibold">Filmes</NuxtLink>
        <NuxtLink to="/series" class="text-neutral-400 hover:text-white" exact-active-class="!text-white font-semibold">Séries</NuxtLink>
      </nav>
      <BuscaMenu />
    </header>

    <main>
      <NuxtPage />
    </main>

    <footer class="mt-12 border-t border-neutral-800 px-6 py-6 text-xs text-neutral-500">
      <p>Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.</p>
      <p>Dados de disponibilidade fornecidos por JustWatch.</p>
    </footer>

    <JanelaDetalhes />
  </div>
</template>
