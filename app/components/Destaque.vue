<script setup lang="ts">
import type { Detalhes, Titulo } from '#shared/types/catalogo'

const props = defineProps<{ titulo: Titulo }>()
const aberto = useTituloAberto()

// Mesma rota da janela de detalhes (resposta em cache no servidor). Só alimenta a linha de dados do desktop:
// se demorar ou falhar, a hero continua inteira só com o que já veio na fileira.
const { data: d } = useLazyFetch<Detalhes>(() => `/api/${props.titulo.tipo}/titulo/${props.titulo.id}`)

const dados = computed(() => {
  const x = d.value
  if (!x) return []
  const duracao = x.duracaoMin
    ? (x.duracaoMin >= 60 ? `${Math.floor(x.duracaoMin / 60)}h${String(x.duracaoMin % 60).padStart(2, '0')}` : `${x.duracaoMin}min`)
    : x.temporadas
      ? `${x.temporadas} ${x.temporadas === 1 ? 'temporada' : 'temporadas'}`
      : null
  return [x.ano, duracao, x.generos.slice(0, 3).join(', ')].filter(Boolean)
})
const nota = computed(() => d.value?.nota ? d.value.nota.toFixed(1).replace('.', ',') : null)
</script>

<template>
  <section class="relative flex h-[55vh] min-h-80 items-end overflow-hidden bg-neutral-950 lg:h-[70vh] lg:max-h-[760px]">
    <div
      v-if="titulo.fundo"
      class="absolute inset-0 lg:left-auto lg:right-0 lg:h-full lg:w-auto lg:aspect-video"
    >
      <!-- Só desktop: a própria imagem, espelhada para a esquerda e desfocada, leva as cores da cena
           para a faixa que antes ficava preta. O espelho faz as cores baterem na emenda com a imagem nítida. -->
      <div aria-hidden="true" class="absolute inset-0 hidden opacity-90 blur-3xl saturate-150 lg:block">
        <img :src="titulo.fundo" alt="" class="absolute inset-0 size-full object-cover object-top">
        <img :src="titulo.fundo" alt="" class="absolute inset-y-0 right-full size-full -scale-x-100 object-cover object-top">
      </div>
      <img
        :src="titulo.fundo"
        alt=""
        class="relative size-full object-cover md:object-top lg:[mask-image:linear-gradient(to_right,transparent,black_45%)]"
      >
    </div>
    <div class="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />
    <!-- Escurece o lado do texto para a leitura não depender das cores do filme. -->
    <div class="absolute inset-0 hidden bg-gradient-to-r from-neutral-950/55 via-neutral-950/15 to-transparent lg:block" />

    <div class="relative max-w-2xl px-6 pb-8 lg:pb-12">
      <p class="mb-3 hidden text-xs font-semibold uppercase tracking-[0.2em] text-neutral-300 lg:block">
        {{ titulo.tipo === 'movie' ? 'Filme' : 'Série' }} em destaque
      </p>
      <h1 class="text-4xl font-bold drop-shadow lg:text-balance lg:text-5xl">{{ titulo.nome }}</h1>
      <!-- Altura reservada: quando os dados chegam, o título não pula. -->
      <p class="mt-3 hidden min-h-5 flex-wrap items-center gap-x-2 text-sm text-neutral-300 lg:flex">
        <template v-if="d">
          <span v-if="nota" class="font-semibold text-white">★ {{ nota }}</span>
          <template v-for="(item, i) in dados" :key="item">
            <span v-if="nota || i" aria-hidden="true" class="text-neutral-500">·</span>
            <span>{{ item }}</span>
          </template>
        </template>
      </p>
      <p v-if="titulo.sinopse" class="mt-3 line-clamp-3 text-neutral-200 drop-shadow">{{ titulo.sinopse }}</p>
      <div class="mt-4 flex items-center gap-6 lg:mt-6">
        <button
          type="button"
          class="rounded bg-white px-5 py-2 font-semibold text-neutral-950 hover:bg-neutral-200"
          @click="aberto = { tipo: props.titulo.tipo, id: props.titulo.id }"
        >
          Ver detalhes
        </button>
        <div v-if="titulo.provedores.length" class="hidden items-center gap-2 lg:flex">
          <span class="mr-1 text-sm text-neutral-300">Disponível em</span>
          <img
            v-for="p in titulo.provedores.slice(0, 4)"
            :key="p.id"
            :src="p.logo"
            :alt="p.nome"
            :title="p.nome"
            class="size-9 rounded-lg shadow"
          >
          <span v-if="titulo.provedores.length > 4" class="text-sm text-neutral-300">+{{ titulo.provedores.length - 4 }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
