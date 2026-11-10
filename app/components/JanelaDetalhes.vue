<script setup lang="ts">
import type { Detalhes } from '#shared/types/catalogo'

const aberto = useTituloAberto()
const dlg = ref<HTMLDialogElement>()
const d = ref<Detalhes | null>(null)
const erro = ref(false)
const tocando = ref(false)

async function carregar() {
  const alvo = aberto.value
  if (!alvo) return
  d.value = null
  erro.value = false
  try {
    const r = await $fetch<Detalhes>(`/api/${alvo.tipo}/titulo/${alvo.id}`)
    if (aberto.value === alvo) d.value = r // ignora resposta de um título já fechado
  }
  catch {
    if (aberto.value === alvo) erro.value = true
  }
}

// showModal() já prende o foco na janela, fecha com Esc e devolve o foco à capa.
watch(aberto, (a) => {
  if (a) {
    dlg.value?.showModal()
    dlg.value?.scrollTo(0, 0)
    carregar()
  }
  else {
    dlg.value?.close()
  }
})

function aoFechar() {
  aberto.value = null
  tocando.value = false // tira o iframe do DOM, o som para
}

const dados = computed(() => {
  const x = d.value
  if (!x) return ''
  const duracao = x.duracaoMin
    ? (x.duracaoMin >= 60 ? `${Math.floor(x.duracaoMin / 60)}h${String(x.duracaoMin % 60).padStart(2, '0')}` : `${x.duracaoMin}min`)
    : x.temporadas
      ? `${x.temporadas} ${x.temporadas === 1 ? 'temporada' : 'temporadas'}`
      : null
  return [
    x.ano,
    duracao,
    x.nota ? `★ ${x.nota.toFixed(1).replace('.', ',')}` : null,
  ].filter(Boolean).join(' · ')
})
</script>

<template>
  <!-- O <dialog> ocupa a tela toda e é ele que rola; o cartão dentro tem a altura do conteúdo (sem rolagem interna). -->
  <dialog
    ref="dlg"
    aria-label="Detalhes do título"
    class="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-y-auto bg-black/75 p-0 text-neutral-100 backdrop:bg-transparent"
    @close="aoFechar"
    @click="$event.target === dlg && dlg?.close()"
  >
    <div class="relative mx-auto my-8 w-[calc(100%-2rem)] max-w-[850px] overflow-hidden rounded-lg bg-neutral-900 shadow-2xl">
      <button
        type="button"
        aria-label="Fechar"
        class="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-neutral-900/90 text-lg hover:bg-black"
        @click="dlg?.close()"
      >
        ✕
      </button>

      <p v-if="erro" class="flex items-center gap-3 p-12 text-neutral-300">
        Não foi possível carregar os detalhes.
        <button type="button" class="rounded bg-neutral-800 px-3 py-1 hover:bg-neutral-700" @click="carregar">Tentar de novo</button>
      </p>

      <div v-else-if="!d" class="animate-pulse">
        <div class="aspect-video bg-neutral-800" />
        <div class="space-y-3 p-10">
          <div class="h-4 w-1/3 rounded bg-neutral-800" />
          <div class="h-24 rounded bg-neutral-800" />
        </div>
      </div>

      <template v-else>
        <div class="relative aspect-video bg-neutral-800">
          <iframe
            v-if="tocando && d.trailer"
            :src="`https://www.youtube-nocookie.com/embed/${encodeURIComponent(d.trailer)}?autoplay=1`"
            :title="`Trailer de ${d.nome}`"
            allow="autoplay; encrypted-media; fullscreen"
            allowfullscreen
            class="size-full"
          />
          <template v-else>
            <img v-if="d.fundo" :src="d.fundo" alt="" class="size-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/20 to-transparent" />
            <div class="absolute inset-x-0 bottom-0 px-6 pb-6 sm:px-10">
              <h2 class="max-w-xl text-3xl font-bold drop-shadow-lg sm:text-4xl">{{ d.nome }}</h2>
              <button
                v-if="d.trailer"
                type="button"
                class="mt-4 rounded bg-white px-6 py-2 font-semibold text-neutral-950 hover:bg-neutral-200"
                @click="tocando = true"
              >
                ▶ Trailer
              </button>
            </div>
          </template>
        </div>

        <div class="space-y-8 px-6 pb-10 pt-4 sm:px-10">
          <h2 v-if="tocando" class="text-2xl font-bold">{{ d.nome }}</h2>

          <div class="grid gap-8 md:grid-cols-[2fr_1fr]">
            <div>
              <p v-if="dados" class="mb-3 text-sm text-neutral-400">{{ dados }}</p>
              <p class="leading-relaxed text-neutral-200">{{ d.sinopse || 'Sinopse não disponível.' }}</p>
            </div>

            <div class="space-y-4 text-sm">
              <p v-if="d.generos.length">
                <span class="text-neutral-500">Gêneros: </span>{{ d.generos.join(', ') }}
              </p>
              <div>
                <p class="mb-2 text-neutral-500">Onde assistir:</p>
                <div class="flex flex-wrap items-center gap-2">
                  <img v-for="p in d.provedores" :key="p.id" :src="p.logo" :alt="p.nome" :title="p.nome" class="size-9 rounded-lg">
                  <span v-if="!d.provedores.length" class="text-neutral-400">Sem streaming por assinatura no Brasil no momento.</span>
                </div>
                <a
                  v-if="d.linkJustWatch"
                  :href="d.linkJustWatch"
                  target="_blank"
                  rel="noopener"
                  class="mt-2 inline-block text-neutral-300 underline hover:text-white"
                >Ver opções no TMDB</a>
              </div>
            </div>
          </div>

          <section v-if="d.elenco.length">
            <h3 class="mb-3 text-xl font-semibold">Elenco</h3>
            <ul class="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <li v-for="p in d.elenco" :key="p.nome + p.personagem" class="flex items-center gap-3">
                <img v-if="p.foto" :src="p.foto" alt="" loading="lazy" class="size-12 shrink-0 rounded-full object-cover">
                <span v-else class="size-12 shrink-0 rounded-full bg-neutral-800" />
                <span class="min-w-0 text-sm">
                  <span class="block truncate">{{ p.nome }}</span>
                  <span class="block truncate text-neutral-400">{{ p.personagem }}</span>
                </span>
              </li>
            </ul>
          </section>
        </div>
      </template>
    </div>
  </dialog>
</template>
