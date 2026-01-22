<template>
  <div class="global-watermark" :style="bgStyle"></div>
</template>

<script lang="ts">
import { defineComponent, computed, watch, ref } from 'vue'

export default defineComponent({
  name: 'Watermark',
  props: {
    text: { type: String, default: '测试水印内容' },
    size: { type: Number, default: 240 },
    gap: { type: Number, default: 80 },
    rotate: { type: Number, default: -22 },
    fontSize: { type: Number, default: 22 },
    color: { type: String, default: 'rgba(0,0,0,0.12)' }
  },
  setup(props) {
    const dataUrl = ref('')

    const draw = () => {
      const canvas = document.createElement('canvas')
      const size = props.size
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, size, size)
      ctx.save()
      ctx.translate(size / 2, size / 2)
      ctx.rotate((props.rotate * Math.PI) / 180)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `${props.fontSize}px sans-serif`
      ctx.fillStyle = props.color
      ctx.fillText(props.text || '', 0, 0)
      ctx.restore()

      dataUrl.value = canvas.toDataURL('image/png')
    }

    watch(() => props.text, () => draw(), { immediate: true })

    const bgStyle = computed(() => {
      return {
        backgroundImage: dataUrl.value ? `url(${dataUrl.value})` : 'none',
        backgroundRepeat: 'repeat',
        backgroundSize: `${props.size}px ${props.size}px`,
      } as Record<string, string>
    })

    return { bgStyle }
  }
})
</script>

<style scoped>
.global-watermark {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}
</style>
