<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import QRCode from 'qrcode'

const props = defineProps<{ otpAuthUrl: string }>()
const canvas = ref<HTMLCanvasElement | null>(null)

watch(() => props.otpAuthUrl, async (url) => {
  await nextTick()
  if (!url || !canvas.value) return
  try {
    await QRCode.toCanvas(canvas.value, url, { width: 200 })
  } catch (error) {
    console.error('二维码生成失败', error)
  }
}, { immediate: true })
</script>

<template>
  <canvas ref="canvas" :aria-label="otpAuthUrl" />
</template>
