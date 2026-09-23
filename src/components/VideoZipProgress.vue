<template>
  <el-dialog :model-value="visible" title="打包下载视频" width="420px" append-to-body :close-on-click-modal="false" :show-close="false" :close-on-press-escape="false">
    <p>{{ phase === 'fetching' ? (total ? `正在获取视频 ${completed}/${total} 条（最多同时 2 条）` : '正在统计可下载视频…') : phase === 'packing' ? '正在生成 ZIP 压缩包' : '下载已开始' }}</p>
    <el-progress :percentage="percent" :status="phase === 'done' ? 'success' : undefined" />
    <small>请保持此页面打开，完成前不要刷新。</small>
  </el-dialog>
</template>

<script setup lang="ts">
defineProps<{ visible: boolean; phase: 'fetching' | 'packing' | 'done'; completed: number; total: number; percent: number }>()
</script>
