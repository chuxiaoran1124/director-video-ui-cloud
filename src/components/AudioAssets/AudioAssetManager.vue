<template>
  <div class="audio-asset-manager">
    <h3>音频管理</h3>
    <AudioAssetPicker :selectable="false" :active="active" />
  </div>
</template>
<script setup lang="ts">
import AudioAssetPicker from './AudioAssetPicker.vue'
withDefaults(defineProps<{ active?: boolean }>(), { active: true })
</script>
<style scoped>
.audio-asset-manager { padding:16px; background:#fff; }
h3 { margin:0; color:#35465d; }
</style>
