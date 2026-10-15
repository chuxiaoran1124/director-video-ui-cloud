<template>
  <el-dialog :model-value="visible" title="打包下载视频" width="420px" append-to-body :close-on-click-modal="false" :show-close="false" :close-on-press-escape="false">
    <p>{{ phase === 'fetching' ? (total ? `正在获取视频 ${completed}/${total} 条` : '正在统计可下载视频…') : phase === 'packing' ? '正在写入 ZIP 文件' : success === 0 ? '没有可保存的视频' : streaming ? 'ZIP 已保存' : '已发起 ZIP 保存，请确认浏览器下载结果' }}</p>
    <el-progress :percentage="percent" :status="phase === 'done' ? (success === 0 ? 'exception' : 'success') : undefined" />
    <small v-if="streaming === false">大批量会按大小拆成多个 ZIP，请允许本站下载多个文件。</small>
    <small>请保持此页面打开，完成前不要刷新。</small>
  </el-dialog>
</template>

<script setup lang="ts">
defineProps<{ visible: boolean; phase: 'fetching' | 'packing' | 'done'; completed: number; total: number; percent: number; success?: number; failed?: number; archives?: number; streaming?: boolean }>()
</script>
