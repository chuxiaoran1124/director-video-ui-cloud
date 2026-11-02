import type { AudioAsset } from '/@/api/material/audioAssets'

export const AUDIO_DRAFT_LIMIT = 50
export interface AudioDraftPerformer {
  selectionMode: string
  digitalHumanId?: string | number | null
  audioAssetId?: string | number | null
  audioName?: string
  audioUrl?: string
  videoOptions?: Record<string, any>
}

// Restore the saved snapshot, not the current library page (which may no longer contain it).
// Legacy multi-audio plans must explicitly choose a common audio before replacement.
export function restoreSharedAudio(children: AudioDraftPerformer[]): AudioAsset[] {
  const first = children[0]
  if (!first?.audioAssetId || children.some(child => child.selectionMode !== 'audio' || String(child.audioAssetId) !== String(first.audioAssetId))) return []
  return [{ id: first.audioAssetId, name: first.audioName || '已保存音频', url: first.audioUrl || '', source: 'uploaded', duration: 0, sizeBytes: 0, createTime: '' }]
}

export function audioDraftPayload(configs: AudioDraftPerformer[], audios: AudioAsset[]) {
  if (configs.length > AUDIO_DRAFT_LIMIT) throw new Error('音频执行项最多 50 个')
  if (configs.some(config => config.selectionMode !== 'audio')) throw new Error('同一计划不能混合文案和音频执行项')
  if (audios.length > 1) throw new Error('请选择一条共用完整音频')
  const audio = audios[0]
  if (configs.length && (!audio?.id || (audio.status && audio.status !== 'ready'))) throw new Error('请为所有形象选择一条可用的共用完整音频')
  if (configs.some(config => !config.digitalHumanId)) throw new Error('请完整选择数字人形象后再保存')
  return {
    script: { source: 'audio' as const, content: '' },
    performerConfigs: configs.map(config => ({
      selectionMode: 'audio' as const, digitalHumanId: config.digitalHumanId!, audioAssetId: audio!.id,
      videoOptions: { ...(config.videoOptions || { language: 'zh', videoType: 0 }) },
      postProcessConfig: { processTypes: [], subtitleSelector: 0 }
    })),
    videoOptions: { ...(configs[0]?.videoOptions || { language: 'zh', videoType: 0 }) },
    postProcessConfig: { processTypes: [], subtitleSelector: 0 }
  }
}
