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
</script>

<template>
  <section v-if="status !== 'success' || data?.length" ref="raiz" class="px-6 py-3">
    <h2 class="mb-2 text-lg font-semibold">{{ def.nome }}</h2>

    <p v-if="status === 'error'" class="flex h-54 items-center gap-3 text-sm text-neutral-400 sm:h-60">
      Não foi possível carregar.
      <button type="button" class="rounded bg-neutral-800 px-3 py-1 text-neutral-100 hover:bg-neutral-700" @click="refresh()">Tentar de novo</button>
    </p>

    <div v-else class="flex snap-x gap-3 overflow-x-auto pb-3 pt-1 [scrollbar-color:#404040_transparent] [scrollbar-width:thin]">
      <template v-if="status === 'success'">
        <Capa v-for="t in data" :key="t.id" :titulo="t" />
      </template>
      <template v-else>
        <div v-for="i in 8" :key="i" class="aspect-[2/3] w-36 shrink-0 animate-pulse rounded-md bg-neutral-800 sm:w-40" />
      </template>
    </div>
  </section>
</template>
