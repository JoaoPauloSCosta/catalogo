<script setup lang="ts">
// Lupa no menu que se abre num campo. Digitar leva a /busca?q=…; limpar volta para onde a pessoa estava.
const route = useRoute()
const aberta = ref(false)
const termo = ref('')
const campo = ref<HTMLInputElement>()
let origem = '/'
let espera: ReturnType<typeof setTimeout> | undefined

function ir() {
  clearTimeout(espera)
  const q = termo.value.trim()
  if (q) {
    if (route.path !== '/busca') origem = route.fullPath
    navigateTo({ path: '/busca', query: { q } }, { replace: route.path === '/busca' })
  }
  else if (route.path === '/busca') {
    navigateTo(origem, { replace: true })
  }
}

function aoDigitar() {
  clearTimeout(espera)
  espera = setTimeout(ir, 300)
}

function abrir() {
  aberta.value = true
  nextTick(() => campo.value?.focus())
}

function limpar(manterAberta: boolean) {
  termo.value = ''
  ir()
  if (manterAberta) campo.value?.focus()
  else {
    aberta.value = false
    campo.value?.blur()
  }
}

// Abrir /busca?q=… direto, ou voltar/avançar no navegador, preenche o campo.
// Não mexe enquanto a pessoa digita, para não engolir letras.
watch(() => [route.path, route.query.q] as const, ([caminho, q]) => {
  if (caminho === '/busca') {
    if (import.meta.client && document.activeElement === campo.value) return
    termo.value = String(q ?? '')
    aberta.value = true
  }
  else {
    clearTimeout(espera)
    termo.value = ''
    // Limpou pelo ✕ e segue com o cursor no campo: continua aberto para digitar de novo.
    aberta.value = import.meta.client && !!campo.value && document.activeElement === campo.value
  }
}, { immediate: true })

onBeforeUnmount(() => clearTimeout(espera))
</script>

<template>
  <form
    role="search"
    class="ml-auto flex h-9 items-center border transition-[width,background-color,border-color] duration-300 motion-reduce:transition-none"
    :class="aberta ? 'w-56 border-neutral-100 bg-neutral-950/90 sm:w-72' : 'w-9 border-transparent'"
    @submit.prevent="ir"
  >
    <button
      type="button"
      aria-label="Buscar"
      :aria-expanded="aberta"
      class="flex size-9 shrink-0 items-center justify-center text-neutral-100 outline-offset-2 focus-visible:outline-2 focus-visible:outline-white"
      @click="abrir"
    >
      <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5" />
      </svg>
    </button>

    <template v-if="aberta">
      <label for="busca-campo" class="sr-only">Buscar filmes e séries</label>
      <input
        id="busca-campo"
        ref="campo"
        v-model="termo"
        type="text"
        inputmode="search"
        autocomplete="off"
        maxlength="100"
        placeholder="Filmes e séries"
        class="min-w-0 flex-1 bg-transparent text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
        @input="aoDigitar"
        @keydown.esc="limpar(false)"
        @blur="!termo && (aberta = false)"
      >
      <button
        v-if="termo"
        type="button"
        aria-label="Limpar busca"
        class="flex size-9 shrink-0 items-center justify-center text-neutral-300 hover:text-white"
        @mousedown.prevent
        @click="limpar(true)"
      >
        ✕
      </button>
    </template>
  </form>
</template>
