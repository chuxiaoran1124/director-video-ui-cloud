<template>
  <div class="subtitle-preview">
    <!-- 后端渲染预览区 -->
    <div class="preview-area mb-4">
      <div class="relative inline-block rounded-lg overflow-hidden shadow-lg border border-gray-200 bg-black"
           :style="{ width: displayWidth + 'px', height: displayHeight + 'px' }">
        <img
          v-if="previewImageSrc"
          :src="previewImageSrc"
          class="block w-full h-full object-cover"
          :class="{ 'opacity-40': loading }"
        />
        <!-- 无预览提示 -->
        <div v-if="!previewImageSrc && !loading" class="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div class="text-center text-gray-400">
            <i class="el-icon-picture text-4xl"></i>
            <p class="mt-2 text-sm">请先选择数字人以加载预览</p>
          </div>
        </div>
        <!-- 渲染中遮罩（有无旧图均显示） -->
        <div v-if="loading" class="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
          <svg class="animate-spin w-8 h-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p class="text-white text-xs">渲染中...</p>
        </div>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel space-y-3">

      <!-- 展开/收起详细设置 -->
      <div
        class="flex items-center justify-between cursor-pointer text-xs select-none"
        @click="showDetailSettings = !showDetailSettings"
      >
        <span class="font-bold text-gray-600">详细配置</span>
        <span class="flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors">
          <span>{{ showDetailSettings ? '收起' : '展开' }}</span>
          <span class="transition-transform duration-200 inline-block" :class="showDetailSettings ? 'rotate-180' : ''">▾</span>
        </span>
      </div>

      <!-- 详细设置（默认折叠） -->
      <div v-show="showDetailSettings && enableSubtitle" class="space-y-3">

      <!-- 字体选择 -->
      <div>
        <label class="text-xs font-bold text-gray-600 mb-1 block">字体</label>
        <el-select v-model="config.font_name" size="small" class="w-full" @change="handleFontChange" @visible-change="onFontDropdownOpen">
          <el-option
            v-for="font in FONT_LIST"
            :key="font.name"
            :label="font.label"
            :value="font.name"
          >
            <span :style="{ fontFamily: font.cssFamilyLoaded ? font.name : 'inherit' }">{{ font.label }}</span>
          </el-option>
        </el-select>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- 字体大小 -->
        <div>
          <label class="text-xs font-bold text-gray-600 mb-1 block">字体大小</label>
          <div class="flex items-center gap-2">
            <el-slider v-model="config.font_size" :min="6" :max="18" :step="1" class="flex-1" @input="requestBackendPreview" />
            <span class="text-xs text-gray-500 w-8 text-right">{{ config.font_size }}</span>
          </div>
        </div>

        <!-- 底部边距 -->
        <div>
          <label class="text-xs font-bold text-gray-600 mb-1 block">底部边距</label>
          <div class="flex items-center gap-2">
            <el-slider v-model="config.margin_v" :min="10" :max="120" :step="1" class="flex-1" @input="requestBackendPreview" />
            <span class="text-xs text-gray-500 w-8 text-right">{{ config.margin_v }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- 字体颜色 -->
        <div>
          <label class="text-xs font-bold text-gray-600 mb-1 block">字体颜色</label>
          <el-color-picker v-model="config.primary_colour" show-alpha @change="requestBackendPreview" />
        </div>

        <!-- 描边颜色 -->
        <div>
          <label class="text-xs font-bold text-gray-600 mb-1 block">描边颜色</label>
          <el-color-picker v-model="config.outline_colour" show-alpha @change="requestBackendPreview" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- 描边宽度 -->
        <div>
          <label class="text-xs font-bold text-gray-600 mb-1 block">描边宽度</label>
          <div class="flex items-center gap-2">
            <el-slider v-model="config.outline" :min="0" :max="5" :step="0.1" class="flex-1" @input="requestBackendPreview" />
            <span class="text-xs text-gray-500 w-8 text-right">{{ config.outline }}</span>
          </div>
        </div>

        <!-- 加粗 -->
        <div>
          <label class="text-xs font-bold text-gray-600 mb-1 block">字体加粗</label>
          <el-switch
            v-model="boldSwitch"
            active-text="加粗"
            inactive-text="正常"
            @change="handleBoldChange"
          />
        </div>
      </div>
      <div>
        <label class="text-xs font-bold text-gray-600 mb-1 block">字幕区域背景</label>
        <el-radio-group v-model="config.bg_mode" size="small" @change="requestBackendPreview">
          <el-radio-button label="none">无</el-radio-button>
          <el-radio-button label="blur">高斯模糊</el-radio-button>
          <el-radio-button label="fill">颜色填充</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 背景参数 -->
      <div v-if="config.bg_mode !== 'none'" class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-bold text-gray-600 mb-1 block">区域高度（以字幕为中心）</label>
          <div class="flex items-center gap-2">
            <el-slider v-model="config.bg_height" :min="10" :max="200" :step="1" class="flex-1" @input="requestBackendPreview" />
            <span class="text-xs text-gray-500 w-8 text-right">{{ config.bg_height }}</span>
          </div>
        </div>
        <div v-if="config.bg_mode === 'blur'">
          <label class="text-xs font-bold text-gray-600 mb-1 block">模糊强度</label>
          <div class="flex items-center gap-2">
            <el-slider v-model="config.blur_strength" :min="5" :max="30" :step="1" class="flex-1" @input="requestBackendPreview" />
            <span class="text-xs text-gray-500 w-8 text-right">{{ config.blur_strength }}</span>
          </div>
        </div>
        <div v-if="config.bg_mode === 'fill'">
          <label class="text-xs font-bold text-gray-600 mb-1 block">填充颜色</label>
          <div class="flex items-center gap-2">
            <el-color-picker v-model="config.bg_colour" show-alpha @change="requestBackendPreview" />
            <span class="text-xs text-gray-400">支持透明度</span>
          </div>
        </div>
      </div>

      <!-- 预览文字 -->
      <div>
        <label class="text-xs font-bold text-gray-600 mb-1 block">预览文字</label>
        <el-input v-model="previewText" placeholder="输入预览字幕文字" size="small" @input="requestBackendPreview" />
      </div>

      </div>

      <el-divider class="!my-1" />

      <!-- 字幕模板选择 -->
      <div class="bg-gray-50 rounded-lg p-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-gray-600">字幕模板</span>
          <el-button size="small" type="primary" plain @click="showSaveDialog = true" class="!h-6 !text-xs !px-2 !py-0">
            保存当前配置
          </el-button>
        </div>
        <div class="flex flex-wrap gap-1.5 max-h-[88px] overflow-y-auto pr-0.5">
          <div
            v-for="tpl in allTemplates"
            :key="tpl.id"
            @click="applyTemplate(tpl)"
            class="relative flex items-center gap-1 px-2.5 py-1 rounded-full text-xs cursor-pointer border transition-all select-none group"
            :class="activeTemplate === tpl.id
              ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-200'
              : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:shadow-sm'"
          >
            <!-- 颜色预览点 -->
            <span
              class="w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-black/10"
              :style="{ background: tpl.config.primary_colour }"
            ></span>
            <span>{{ tpl.name }}</span>
            <!-- 内置模板标记 -->
            <span v-if="tpl.isBuiltIn" class="ml-0.5 text-[10px] opacity-50">系统</span>
            <!-- 用户模板删除按钮 -->
            <span
              v-if="!tpl.isBuiltIn"
              @click.stop="deleteTemplate(tpl.id)"
              class="ml-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[11px] leading-none"
              :class="activeTemplate === tpl.id ? 'hover:bg-white/30' : 'hover:bg-red-100 hover:text-red-500'"
              title="删除模板"
            >×</span>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- 保存模板弹窗 -->
  <el-dialog v-model="showSaveDialog" title="保存为字幕模板" width="320px" :append-to-body="true" :close-on-click-modal="false">
    <div class="py-2">
      <p class="text-xs text-gray-500 mb-3">将当前字幕样式配置保存为可复用的模板</p>
      <el-input
        v-model="saveTemplateName"
        placeholder="输入模板名称（最多10个字）"
        maxlength="10"
        show-word-limit
        autofocus
        @keyup.enter="saveCurrentTemplate"
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button size="small" @click="showSaveDialog = false; saveTemplateName = ''">取消</el-button>
        <el-button size="small" type="primary" :disabled="!saveTemplateName.trim()" :loading="templateSaving" @click="saveCurrentTemplate">
          保存模板
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getSubtitlePreviewFrame, getSubtitleTemplateAll, createSubtitleTemplate, deleteSubtitleTemplate } from '/@/api/material'

const props = defineProps<{
  frameBase64: string
  scriptText?: string
  cornerMarkUrl?: string
  bannerOverlayBase64?: string
  processTypes?: string[]
  enableSubtitle?: boolean
  initialConfig?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: 'update:config', value: any): void
}>()

const normalizedProcessTypes = computed(() => {
  const types = Array.isArray(props.processTypes) ? props.processTypes : []
  return types.map((item) => String(item))
})

const enableSubtitle = computed(() => props.enableSubtitle !== false)

// 预览图尺寸（CSS显示）
const displayWidth = 270
const displayHeight = 480

// 后端渲染结果
const previewImageSrc = ref('')
const loading = ref(false)

// 防抖 timer
let previewDebounceTimer: ReturnType<typeof setTimeout> | null = null

// 字幕配置
const config = reactive({
  font_size: 18,
  margin_v: 74,
  primary_colour: '#fee002',
  outline: 1,
  outline_colour: '#000000',
  bold: 1,
  font_name: '竹言体',
  // 背景模式： none / blur / fill
  bg_mode: 'none' as 'none' | 'blur' | 'fill',
  bg_height: 60,      // ASS 脚本单位，以字幕为中心的区域高度
  blur_strength: 15,  // 模糊强度
  bg_colour: 'rgba(0,0,0,0.5)',  // 填充颜色
  // 向后端提交时保留这两个字段（将 bg_mode 映射过去）
  blur_subtitles: false,
})

// 字体列表：名称、显示标签、文件名（放在 public/fonts/ 下）
const FONT_LIST = reactive([
  { name: '竹言体',   label: '竹言体 (默认)', file: '竹言体.ttf',    cssFamilyLoaded: false },
  { name: '雅月体',   label: '雅月体',        file: '雅月体.ttf',    cssFamilyLoaded: false },
  { name: '新青年体', label: '新青年体',      file: '新青年体.otf',  cssFamilyLoaded: false },
  { name: '宋黑体',   label: '宋黑体',        file: '宋黑体.ttf',    cssFamilyLoaded: false },
  { name: '咏宋体',   label: '咏宋体',        file: '咏宋体.otf',    cssFamilyLoaded: false },
  { name: '欢楷体',   label: '欢楷体',        file: '欢楷体.ttf',    cssFamilyLoaded: false },
  { name: '抖音体',   label: '抖音体',        file: '抖音体.otf',    cssFamilyLoaded: false },
])

// 字体加载缓存
const loadedFonts = new Set<string>()

const loadFont = async (fontName: string): Promise<void> => {
  if (loadedFonts.has(fontName)) return
  const fontItem = FONT_LIST.find(f => f.name === fontName)
  if (!fontItem) return
  try {
    const fontFace = new FontFace(fontName, `url(/fonts/${encodeURIComponent(fontItem.file)})`)
    await fontFace.load()
    document.fonts.add(fontFace)
    loadedFonts.add(fontName)
    fontItem.cssFamilyLoaded = true
  } catch (e) {
    console.warn(`字体加载失败: ${fontName}`, e)
    // 尝试失败也标记为已加载，防止重复请求
    loadedFonts.add(fontName)
  }
}

const handleFontChange = async (fontName: string) => {
  await loadFont(fontName)
  requestBackendPreview()
}

// 下拉框展开时批量预加载所有字体，这样选项里才能显示字体样式
const onFontDropdownOpen = (visible: boolean) => {
  if (visible) {
    // 并行加载所有未加载的字体
    FONT_LIST.forEach(font => {
      if (!loadedFonts.has(font.name)) {
        loadFont(font.name)
      }
    })
  }
}

const boldSwitch = ref(true)
const handleBoldChange = (val: boolean) => {
  config.bold = val ? 1 : 0
  requestBackendPreview()
}

const applyExternalConfig = async (newConfig?: Record<string, any> | null) => {
  if (!newConfig || typeof newConfig !== 'object') return
  Object.assign(config, newConfig)
  boldSwitch.value = config.bold === 1
  if (config.font_name) {
    await loadFont(config.font_name)
  }
}

// ====== 字幕模板 ======
interface SubtitleTemplateConfig {
  font_name: string
  font_size: number
  margin_v: number
  primary_colour: string
  outline: number
  outline_colour: string
  bold: number
  bg_mode: 'none' | 'blur' | 'fill'
  bg_height: number
  blur_strength: number
  bg_colour: string
  blur_subtitles: boolean
}
interface SubtitleTemplate {
  id: string
  name: string
  isBuiltIn?: boolean
  config: SubtitleTemplateConfig
}

const BUILT_IN_TEMPLATES: SubtitleTemplate[] = [
  {
    id: 'tpl_default', name: '默认', isBuiltIn: true,
    config: { font_name: '竹言体', font_size: 18, margin_v: 74, primary_colour: '#fee002', outline: 1, outline_colour: '#000000', bold: 1, bg_mode: 'none', bg_height: 60, blur_strength: 15, bg_colour: 'rgba(0,0,0,0.5)', blur_subtitles: false }
  },
]

const savedTemplates = ref<SubtitleTemplate[]>([])
const activeTemplate = ref<string>('tpl_default')
const showSaveDialog = ref(false)
const saveTemplateName = ref('')
const showDetailSettings = ref(false)
const templateSaving = ref(false)

const allTemplates = computed(() => [...BUILT_IN_TEMPLATES, ...savedTemplates.value])

// 从 API 加载用户保存的模板
const loadSavedTemplates = async () => {
  try {
    const res = await getSubtitleTemplateAll()
    const list = res.data?.data || res.data || []
    savedTemplates.value = list.map((item: any) => {
      let cfg: SubtitleTemplateConfig
      try { cfg = typeof item.subtitleConfig === 'string' ? JSON.parse(item.subtitleConfig) : item.subtitleConfig }
      catch { cfg = BUILT_IN_TEMPLATES[0].config }
      return {
        id: `tpl_api_${item.id}`,
        _apiId: item.id,  // 保存后端真实 id 用于删除
        name: item.subtitleTemplateName,
        isBuiltIn: false,
        config: cfg,
      } as SubtitleTemplate & { _apiId: number }
    })
  } catch {
    // 接口失败静默处理，只用内置模板
  }
}

const applyTemplate = async (tpl: SubtitleTemplate) => {
  activeTemplate.value = tpl.id
  Object.assign(config, tpl.config)
  boldSwitch.value = tpl.config.bold === 1
  showDetailSettings.value = true
  if (tpl.config.font_name !== '竹言体') {
    await loadFont(tpl.config.font_name)
  }
  requestBackendPreview()
}

const saveCurrentTemplate = async () => {
  const name = saveTemplateName.value.trim()
  if (!name) return
  // 用户自定义模板上限 10 个
  const userTemplates = savedTemplates.value.filter(t => !t.isBuiltIn)
  if (userTemplates.length >= 10) {
    ElMessage.warning('模板数已达上限（10个），请删除旧模板后再创建')
    return
  }
  templateSaving.value = true
  try {
    const configPayload: SubtitleTemplateConfig = {
      font_name: config.font_name,
      font_size: config.font_size,
      margin_v: config.margin_v,
      primary_colour: config.primary_colour,
      outline: config.outline,
      outline_colour: config.outline_colour,
      bold: config.bold,
      bg_mode: config.bg_mode,
      bg_height: config.bg_height,
      blur_strength: config.blur_strength,
      bg_colour: config.bg_colour,
      blur_subtitles: config.bg_mode === 'blur',
    }
    const res = await createSubtitleTemplate({
      subtitleTemplateName: name,
      subtitleConfig: JSON.stringify(configPayload),
    })
    const created = res.data?.data || res.data
    const newTpl: SubtitleTemplate & { _apiId: number } = {
      id: `tpl_api_${created.id}`,
      _apiId: created.id,
      name,
      isBuiltIn: false,
      config: configPayload,
    }
    savedTemplates.value.push(newTpl)
    activeTemplate.value = newTpl.id
    showSaveDialog.value = false
    saveTemplateName.value = ''
    ElMessage.success(`模板「${name}」已保存`)
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败，请重试')
  } finally {
    templateSaving.value = false
  }
}

const deleteTemplate = async (id: string) => {
  const tpl = savedTemplates.value.find(t => t.id === id) as any
  if (!tpl?._apiId) return
  try {
    await deleteSubtitleTemplate(tpl._apiId)
    savedTemplates.value = savedTemplates.value.filter(t => t.id !== id)
    if (activeTemplate.value === id) activeTemplate.value = 'tpl_default'
    ElMessage.success('模板已删除')
  } catch {
    ElMessage.error('删除失败，请重试')
  }
}

// 预览文字：截取文案第一句
const previewText = ref('这里展示字幕效果')

// 向后端请求渲染预览（带 500ms 防抖）
const requestBackendPreview = () => {
  if (!props.frameBase64) {
    console.warn('[SubtitlePreview] frameBase64 为空，跳过渲染')
    return
  }
  console.log('[SubtitlePreview] 触发后端渲染，frameBase64 长度:', props.frameBase64.length)
  if (previewDebounceTimer) clearTimeout(previewDebounceTimer)
  previewDebounceTimer = setTimeout(async () => {
    loading.value = true
    try {
      const subtitlePayload = enableSubtitle.value ? {
        font_size: config.font_size,
        margin_v: config.margin_v,
        primary_colour: config.primary_colour,
        outline: config.outline,
        outline_colour: config.outline_colour,
        bold: config.bold,
        font_name: config.font_name,
        bg_mode: config.bg_mode,
        bg_height: config.bg_height,
        blur_strength: config.blur_strength,
        bg_colour: config.bg_colour,
        blur_subtitles: config.bg_mode === 'blur',
      } : null

      const res = await getSubtitlePreviewFrame({
        frame_base64: props.frameBase64,
        preview_text: enableSubtitle.value ? previewText.value : '',
        corner_mark_url: props.cornerMarkUrl || '',
        banner_overlay_base64: props.bannerOverlayBase64 || '',
        process_types: normalizedProcessTypes.value,
        subtitle_config: subtitlePayload,
      } as any)
      const data = res.data?.data || res.data
      console.log('[SubtitlePreview] 接口返回:', data)
      if (data?.frame_base64) {
        previewImageSrc.value = data.frame_base64
      } else {
        console.warn('[SubtitlePreview] 接口未返回 frame_base64，完整响应:', res.data)
      }
      // 通知父组件配置变化
      emit('update:config', {
        ...config,
        blur_subtitles: config.bg_mode === 'blur',
      })
    } catch (error: any) {
      console.error('[SubtitlePreview] 后端渲染预览失败:', error)
    } finally {
      loading.value = false
    }
  }, 500)
}

// 暴露方法供父组件调用
const getConfig = () => ({ ...config })

defineExpose({ getConfig, setConfig: applyExternalConfig })

// 监听 frameBase64 变化 → 重新请求渲染
watch(() => props.frameBase64, (val) => {
  if (val) requestBackendPreview()
})

// 监听角标 URL 变化 → 重新渲染
watch(() => props.cornerMarkUrl, () => {
  requestBackendPreview()
})

watch(() => props.bannerOverlayBase64, () => {
  requestBackendPreview()
})

// 监听各项配置变化 → 重新渲染
watch(
  [
    () => config.font_size, () => config.margin_v, () => config.primary_colour,
    () => config.outline, () => config.outline_colour, () => config.bold,
    () => config.bg_mode, () => config.bg_height, () => config.blur_strength, () => config.bg_colour,
  ],
  () => { requestBackendPreview() }
)

// 监听预览文字变化
watch(previewText, () => { requestBackendPreview() })

// 监听 scriptText 变化以截取第一句作为预览
watch(() => props.scriptText, (newText) => {
  if (newText) {
    const firstSentence = newText.split(/[,，。.!！?？\n]/)[0]
    if (firstSentence) {
      previewText.value = firstSentence.substring(0, 20)
    }
  }
}, { immediate: true })

watch(() => props.enableSubtitle, () => {
  requestBackendPreview()
})

watch(() => props.initialConfig, async (val) => {
  await applyExternalConfig(val)
  requestBackendPreview()
}, { immediate: true })

// 挂载后加载字体（仅供下拉框字体样式预览）和用户模板
onMounted(() => {
  Promise.all([
    loadFont('竹言体'),
    loadSavedTemplates()
  ])
})
</script>

<style scoped>
.subtitle-preview {
  width: 100%;
}
.preview-area {
  display: flex;
  justify-content: center;
}
</style>
