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
    x.generos.join(', ') || null,
    x.nota ? `★ ${x.nota.toFixed(1).replace('.', ',')}` : null,
  ].filter(Boolean).join(' · ')
})
</script>

<template>
  <dialog
    ref="dlg"
    aria-label="Detalhes do título"
    class="m-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-neutral-900 p-0 text-neutral-100 backdrop:bg-black/75"
    @close="aoFechar"
    @click="$event.target === dlg && dlg?.close()"
  >
    <div class="relative">
      <button
        type="button"
        aria-label="Fechar"
        class="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-black/70 text-lg hover:bg-black"
        @click="dlg?.close()"
      >
        ✕
      </button>

      <p v-if="erro" class="flex items-center gap-3 p-10 text-neutral-300">
        Não foi possível carregar os detalhes.
        <button type="button" class="rounded bg-neutral-800 px-3 py-1 hover:bg-neutral-700" @click="carregar">Tentar de novo</button>
      </p>

      <div v-else-if="!d" class="animate-pulse">
        <div class="aspect-video bg-neutral-800" />
        <div class="space-y-3 p-6">
          <div class="h-7 w-1/2 rounded bg-neutral-800" />
          <div class="h-4 w-1/3 rounded bg-neutral-800" />
          <div class="h-20 rounded bg-neutral-800" />
        </div>
      </div>

      <template v-else>
        <div class="aspect-video bg-neutral-800">
          <iframe
            v-if="tocando && d.trailer"
            :src="`https://www.youtube-nocookie.com/embed/${d.trailer}?autoplay=1`"
            :title="`Trailer de ${d.nome}`"
            allow="autoplay; encrypted-media; fullscreen"
            allowfullscreen
            class="size-full"
          />
          <img v-else-if="d.fundo" :src="d.fundo" alt="" class="size-full object-cover">
        </div>

        <div class="space-y-5 p-6">
          <div>
            <h2 class="text-2xl font-bold">{{ d.nome }}</h2>
            <p v-if="dados" class="mt-1 text-sm text-neutral-400">{{ dados }}</p>
            <button
              v-if="d.trailer && !tocando"
              type="button"
              class="mt-3 rounded bg-white px-5 py-2 font-semibold text-neutral-950 hover:bg-neutral-200"
              @click="tocando = true"
            >
              ▶ Trailer
            </button>
          </div>

          <section>
            <h3 class="mb-2 font-semibold">Onde assistir</h3>
            <div class="flex flex-wrap items-center gap-2">
              <img v-for="p in d.provedores" :key="p.id" :src="p.logo" :alt="p.nome" :title="p.nome" class="size-10 rounded-lg">
              <span v-if="!d.provedores.length" class="text-sm text-neutral-400">Sem streaming por assinatura no Brasil no momento.</span>
              <a
                v-if="d.linkJustWatch"
                :href="d.linkJustWatch"
                target="_blank"
                rel="noopener"
                class="ml-2 text-sm text-neutral-300 underline hover:text-white"
              >Ver no JustWatch</a>
            </div>
          </section>

          <section>
            <h3 class="mb-2 font-semibold">Sinopse</h3>
            <p class="text-neutral-300">{{ d.sinopse || 'Sinopse não disponível.' }}</p>
          </section>

          <section v-if="d.elenco.length">
            <h3 class="mb-2 font-semibold">Elenco</h3>
            <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <li v-for="p in d.elenco" :key="p.nome + p.personagem" class="flex items-center gap-3">
                <img v-if="p.foto" :src="p.foto" alt="" loading="lazy" class="size-11 shrink-0 rounded-full object-cover">
                <span v-else class="size-11 shrink-0 rounded-full bg-neutral-800" />
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
