<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    iconClass: string
    className?: string
    title?: string
  }>(),
  { className: '', title: '' }
)

const external = computed(() => /^(https?:|mailto:|tel:)/.test(props.iconClass))
const symbolId = computed(() => `#icon-${props.iconClass}`)
const iconClassName = computed(() => ['svg-icon', props.className].filter(Boolean))
const externalStyle = computed(() => ({
  mask: `url(${props.iconClass}) no-repeat 50% 50% / cover`,
  WebkitMask: `url(${props.iconClass}) no-repeat 50% 50% / cover`
}))
</script>

<template>
  <span v-if="external" :class="iconClassName" :style="externalStyle" role="img" :aria-label="title || iconClass" />
  <svg v-else :class="iconClassName" aria-hidden="true">
    <title v-if="title">{{ title }}</title>
    <use :href="symbolId" />
  </svg>
</template>

<style scoped>
.svg-icon {
  width: 1em;
  height: 1em;
  flex: none;
  overflow: hidden;
  vertical-align: -0.15em;
  fill: currentColor;
}

span.svg-icon {
  display: inline-block;
  background-color: currentColor;
}
</style>
