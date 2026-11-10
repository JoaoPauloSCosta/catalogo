<script setup lang="ts">
import type { DefFileira, Tipo, Titulo } from '#shared/types/catalogo'

// imediata: carrega já (primeira fileira). As outras só buscam ao chegar perto da tela,
// para a primeira abertura não disparar centenas de chamadas ao TMDB de uma vez.
const props = defineProps<{ tipo: Tipo, def: DefFileira, imediata?: boolean }>()

const { data, status, execute, refresh } = useLazyFetch<Titulo[]>(
  `/api/${props.tipo}/fileira/${props.def.id}`,
  { server: props.imediata, immediate: props.imediata },
)

const raiz = ref<HTMLElement>()
onMounted(() => {
  if (props.imediata || !raiz.value) return
  const obs = new IntersectionObserver(([e]) => {
    if (!e?.isIntersecting) return
    obs.disconnect()
    execute()
  }, { rootMargin: '300px' })
  obs.observe(raiz.value)
  onBeforeUnmount(() => obs.disconnect())
})

// Setas no lugar da barra de rolagem: cada clique anda quase uma tela de capas.
const trilho = ref<HTMLElement>()
const podeVoltar = ref(false)
const podeAvancar = ref(false)

function atualizarSetas() {
  const el = trilho.value
  if (!el) return
  podeVoltar.value = el.scrollLeft > 4
  podeAvancar.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

function andar(direcao: 1 | -1) {
  const el = trilho.value
  el?.scrollBy({ left: direcao * el.clientWidth * 0.9, behavior: 'smooth' })
}

watch([data, trilho], () => nextTick(atualizarSetas), { flush: 'post' })
onMounted(() => {
  atualizarSetas()
  window.addEventListener('resize', atualizarSetas)
})
onBeforeUnmount(() => window.removeEventListener('resize', atualizarSetas))

const classeSeta = 'absolute inset-y-0 z-[1] hidden w-12 items-center justify-center from-neutral-950 to-transparent text-3xl opacity-0 transition-opacity hover:text-4xl focus-visible:opacity-100 group-hover:opacity-100 sm:flex'
</script>

<template>
  <section v-if="status !== 'success' || data?.length" ref="raiz" class="py-3">
    <h2 class="mb-1 px-6 text-lg font-semibold">{{ def.nome }}</h2>

    <p v-if="status === 'error'" class="flex h-54 items-center gap-3 px-6 text-sm text-neutral-400 sm:h-60">
      Não foi possível carregar.
      <button type="button" class="rounded bg-neutral-800 px-3 py-1 text-neutral-100 hover:bg-neutral-700" @click="refresh()">Tentar de novo</button>
    </p>

    <div v-else class="group relative">
      <button
        v-show="podeVoltar"
        type="button"
        aria-label="Ver títulos anteriores"
        :class="[classeSeta, 'left-0 bg-gradient-to-r']"
        @click="andar(-1)"
      >
        ‹
      </button>

      <div
        ref="trilho"
        class="flex snap-x gap-3 overflow-x-auto scroll-px-6 px-6 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        @scroll.passive="atualizarSetas"
      >
        <template v-if="status === 'success'">
          <Capa v-for="t in data" :key="t.id" :titulo="t" />
        </template>
        <template v-else>
          <div v-for="i in 8" :key="i" class="aspect-[2/3] w-36 shrink-0 animate-pulse rounded-md bg-neutral-800 sm:w-40" />
        </template>
      </div>

      <button
        v-show="podeAvancar"
        type="button"
        aria-label="Ver mais títulos"
        :class="[classeSeta, 'right-0 bg-gradient-to-l']"
        @click="andar(1)"
      >
        ›
      </button>
    </div>
  </section>
</template>
