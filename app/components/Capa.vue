<script setup lang="ts">
import type { Titulo } from '#shared/types/catalogo'

const props = defineProps<{ titulo: Titulo }>()
const aberto = useTituloAberto()
</script>

<template>
  <button
    type="button"
    :aria-label="titulo.nome"
    class="relative aspect-[2/3] w-36 shrink-0 snap-start overflow-hidden rounded-md bg-neutral-800 outline-offset-2 transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-white sm:w-40"
    @click="aberto = { tipo: props.titulo.tipo, id: props.titulo.id }"
  >
    <img v-if="titulo.poster" :src="titulo.poster" alt="" loading="lazy" class="size-full object-cover">
    <span v-else class="flex size-full items-center justify-center p-2 text-center text-sm text-neutral-300">{{ titulo.nome }}</span>

    <span class="absolute bottom-1 right-1 flex items-center gap-1">
      <img
        v-for="p in titulo.provedores.slice(0, 3)"
        :key="p.id"
        :src="p.logo"
        :alt="p.nome"
        :title="p.nome"
        class="size-6 rounded shadow"
      >
      <span v-if="titulo.provedores.length > 3" class="rounded bg-black/80 px-1 text-xs">+{{ titulo.provedores.length - 3 }}</span>
    </span>
  </button>
</template>
