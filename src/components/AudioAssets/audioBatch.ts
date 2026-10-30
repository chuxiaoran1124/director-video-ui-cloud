import { audioAssetReady, type AudioAsset } from '/@/api/material/audioAssets'

export const AUDIO_BATCH_LIMIT = 50
export interface AudioBatchHuman { id: number | string; name: string; coverUrl?: string; gender?: string }
export function audioBatchPayload(name: string, humans: AudioBatchHuman[], audios: AudioAsset[]) {
  if (!name.trim()) throw new Error('请输入计划名称')
  const uniqueHumans = [...new Map(humans.map(row => [String(row.id), row])).values()]
  const uniqueAudios = [...new Map(audios.map(row => [String(row.id), row])).values()]
  if (!uniqueHumans.length || !uniqueAudios.length) throw new Error('请至少选择一个数字人和一条音频')
  if (uniqueAudios.length !== 1) throw new Error('请选择一条共用音频，所有形象使用同一条音频')
  if (uniqueAudios.some(row => !audioAssetReady(row))) throw new Error('只能选择可用音频，请移除未就绪素材')
  if (uniqueHumans.length * uniqueAudios.length > AUDIO_BATCH_LIMIT) throw new Error('所有组合最多 50 项，请减少数字人或音频')
  return {
    planName: name.trim(),
    script: { source: 'audio' as const, content: '', title: '音频驱动' },
    performerConfigs: uniqueHumans.flatMap(human => uniqueAudios.map(audio => ({
      selectionMode: 'audio' as const, digitalHumanId: human.id, audioAssetId: audio.id
    }))),
    scheduleMode: 'immediate' as const,
    videoOptions: { language: 'zh', videoType: 0 },
    postProcessConfig: { processTypes: [], subtitleSelector: 0 }
  }
}
