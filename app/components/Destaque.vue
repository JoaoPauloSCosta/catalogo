<script setup lang="ts">
import type { Titulo } from '#shared/types/catalogo'

const props = defineProps<{ titulo: Titulo }>()
const aberto = useTituloAberto()
</script>

<template>
  <section class="relative flex h-[55vh] min-h-80 items-end overflow-hidden bg-neutral-900">
    <img v-if="titulo.fundo" :src="titulo.fundo" alt="" class="absolute inset-0 size-full object-cover">
    <div class="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />
    <div class="relative max-w-2xl px-6 pb-8">
      <h1 class="text-4xl font-bold drop-shadow">{{ titulo.nome }}</h1>
      <p v-if="titulo.sinopse" class="mt-3 line-clamp-3 text-neutral-200 drop-shadow">{{ titulo.sinopse }}</p>
      <button
        type="button"
        class="mt-4 rounded bg-white px-5 py-2 font-semibold text-neutral-950 hover:bg-neutral-200"
        @click="aberto = { tipo: props.titulo.tipo, id: props.titulo.id }"
      >
        Ver detalhes
      </button>
    </div>
  </section>
</template>
