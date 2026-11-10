<script setup lang="ts">
import type { Titulo } from '#shared/types/catalogo'

const route = useRoute()
const q = computed(() => String(route.query.q ?? '').trim())
const { data, status, refresh } = useFetch<Titulo[]>('/api/busca', { query: { q } })

useHead({ title: () => q.value ? `${q.value} – Catálogo` : 'Catálogo' })
</script>

<template>
  <div class="min-h-[70vh] px-6 py-6">
    <p v-if="!q" class="text-neutral-400">Digite o nome de um filme ou série.</p>

    <p v-else-if="status === 'error'" class="flex items-center gap-3 text-neutral-400">
      Não foi possível buscar.
      <button type="button" class="rounded bg-neutral-800 px-3 py-1 text-neutral-100 hover:bg-neutral-700" @click="refresh()">Tentar de novo</button>
    </p>

    <div v-else-if="status !== 'success'" class="flex flex-wrap gap-3" aria-busy="true">
      <div v-for="i in 12" :key="i" class="aspect-[2/3] w-36 animate-pulse rounded-md bg-neutral-800 sm:w-40" />
    </div>

    <template v-else-if="data?.length">
      <h1 class="mb-4 text-neutral-400">Resultados para <span class="text-neutral-100">{{ q }}</span></h1>
      <div class="flex flex-wrap gap-x-3 gap-y-6">
        <Capa v-for="t in data" :key="t.tipo + t.id" :titulo="t" />
      </div>
    </template>

    <div v-else class="mx-auto max-w-md pt-16 text-center">
      <h1 class="text-lg">Nada encontrado para “{{ q }}” nos streamings do Brasil.</h1>
      <p class="mt-2 text-sm text-neutral-400">Confira a grafia ou tente outro título. Só aparecem filmes e séries disponíveis por assinatura.</p>
    </div>
  </div>
</template>
