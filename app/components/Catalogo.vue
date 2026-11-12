<script setup lang="ts">
import type { Tipo, Titulo } from '#shared/types/catalogo'
import { FILEIRAS } from '#shared/utils/fileiras'

const props = defineProps<{ tipo: Tipo }>()

// Mesma URL (e mesmas opções) da primeira <Fileira>: o Nuxt faz uma chamada só.
const { data: populares } = useLazyFetch<Titulo[]>(`/api/${props.tipo}/fileira/populares`, { server: true, immediate: true })
</script>

<template>
  <div>
    <Destaque v-if="populares?.[1]" :titulo="populares[1]" />
    <Fileira v-for="(f, i) in FILEIRAS[tipo]" :key="f.id" :tipo="tipo" :def="f" :imediata="i === 0" />
  </div>
</template>
