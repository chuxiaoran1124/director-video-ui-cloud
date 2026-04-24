<template>
  <div class="subtitle-preview">
    <!-- Canvas 预览区 -->
    <div class="preview-area mb-4">
      <div class="relative inline-block rounded-lg overflow-hidden shadow-lg border border-gray-200 bg-black">
        <canvas
          ref="canvasRef"
          :width="canvasWidth"
          :height="canvasHeight"
          class="block"
          :style="{ width: displayWidth + 'px', height: displayHeight + 'px' }"
        />
        <!-- 加载遮罩 -->
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-black/60">
          <div class="text-center text-white">
            <i class="el-icon-loading text-2xl animate-spin"></i>
            <p class="mt-2 text-sm">正在加载预览帧...</p>
          </div>
        </div>
        <!-- 无图片提示 -->
        <div v-if="!loading && !bgImage" class="absolute inset-0 flex items-center justify-center bg-gray-800" style="z-index:1">
          <div class="text-center text-gray-400">
            <i class="el-icon-picture text-4xl"></i>
            <p class="mt-2 text-sm">请先选择数字人以加载预览</p>
          </div>
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
      <div v-show="showDetailSettings" class="space-y-3">

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
            <el-slider v-model="config.font_size" :min="6" :max="18" :step="1" class="flex-1" @input="renderPreview" />
            <span class="text-xs text-gray-500 w-8 text-right">{{ config.font_size }}</span>
          </div>
        </div>

        <!-- 底部边距 -->
        <div>
          <label class="text-xs font-bold text-gray-600 mb-1 block">底部边距</label>
          <div class="flex items-center gap-2">
            <el-slider v-model="config.margin_v" :min="10" :max="120" :step="1" class="flex-1" @input="renderPreview" />
            <span class="text-xs text-gray-500 w-8 text-right">{{ config.margin_v }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- 字体颜色 -->
        <div>
          <label class="text-xs font-bold text-gray-600 mb-1 block">字体颜色</label>
          <el-color-picker v-model="config.primary_colour" show-alpha @change="renderPreview" />
        </div>

        <!-- 描边颜色 -->
        <div>
          <label class="text-xs font-bold text-gray-600 mb-1 block">描边颜色</label>
          <el-color-picker v-model="config.outline_colour" show-alpha @change="renderPreview" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- 描边宽度 -->
        <div>
          <label class="text-xs font-bold text-gray-600 mb-1 block">描边宽度</label>
          <div class="flex items-center gap-2">
            <el-slider v-model="config.outline" :min="0" :max="5" :step="0.1" class="flex-1" @input="renderPreview" />
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
        <el-radio-group v-model="config.bg_mode" size="small" @change="renderPreview">
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
            <el-slider v-model="config.bg_height" :min="10" :max="200" :step="1" class="flex-1" @input="renderPreview" />
            <span class="text-xs text-gray-500 w-8 text-right">{{ config.bg_height }}</span>
          </div>
        </div>
        <div v-if="config.bg_mode === 'blur'">
          <label class="text-xs font-bold text-gray-600 mb-1 block">模糊强度</label>
          <div class="flex items-center gap-2">
            <el-slider v-model="config.blur_strength" :min="5" :max="30" :step="1" class="flex-1" @input="renderPreview" />
            <span class="text-xs text-gray-500 w-8 text-right">{{ config.blur_strength }}</span>
          </div>
        </div>
        <div v-if="config.bg_mode === 'fill'">
          <label class="text-xs font-bold text-gray-600 mb-1 block">填充颜色</label>
          <div class="flex items-center gap-2">
            <el-color-picker v-model="config.bg_colour" show-alpha @change="renderPreview" />
            <span class="text-xs text-gray-400">支持透明度</span>
          </div>
        </div>
      </div>

      <!-- 预览文字 -->
      <div>
        <label class="text-xs font-bold text-gray-600 mb-1 block">预览文字</label>
        <el-input v-model="previewText" placeholder="输入预览字幕文字" size="small" @input="renderPreview" />
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
import { ref, reactive, watch, onMounted, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getSubtitlePreviewFrame, getSubtitleTemplateAll, createSubtitleTemplate, deleteSubtitleTemplate } from '/@/api/material'

const props = defineProps<{
  videoUrl: string
  scriptText?: string
  cornerMarkUrl?: string
}>()

const emit = defineEmits<{
  (e: 'update:config', value: any): void
}>()

// Canvas 相关
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWidth = 540
const canvasHeight = 960
const displayWidth = 270  // CSS显示尺寸 = canvas / 2
const displayHeight = 480

const bgImage = ref<HTMLImageElement | null>(null)
const cornerMarkImage = ref<HTMLImageElement | null>(null)
let scaleRatio = 1
let hSquish = 1 // 水平压缩比，对齐 FFmpeg libass 的字形宽高比修正

// 字体宽度校正系数：补偿浏览器 Canvas 字体引擎 vs libass/FreeType 的宽度差异
// 实测竹言体：Canvas 251px vs 实际视频 211px → 211/251 ≈ 0.84
// 若切换字体后差异较大，可调整此值（0.8~1.0 之间）
const FONT_WIDTH_CORRECTION = 0.84

const loading = ref(false)

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
  renderPreview()
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
  renderPreview()
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
  renderPreview()
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

// 获取预览帧
const loadPreviewFrame = async (videoUrl: string) => {
  if (!videoUrl) return
  loading.value = true
  try {
    const res = await getSubtitlePreviewFrame({
      video_url: videoUrl,
      frame_time: 0,
      blur_subtitles: false
    })
    
    const data = res.data?.data || res.data
    if (!data || !data.frame_base64) {
      throw new Error('未获取到预览帧数据')
    }

    const PLAY_RES_Y = data.play_res_y || 288
    const PLAY_RES_X = data.play_res_x || 0
    scaleRatio = data.preview_height / PLAY_RES_Y
    // 计算水平压缩比：hSquish = (play_res_x / play_res_y) / (video_width / video_height)
    // 后端 PlayResX 是按视频宽高比精确计算的，所以 9:16 时 hSquish = 1.0（不压缩）
    if (PLAY_RES_X > 0 && data.video_width && data.video_height) {
      hSquish = (PLAY_RES_X / PLAY_RES_Y) / (data.video_width / data.video_height)
    } else {
      hSquish = 1
    }

    const img = new Image()
    img.onload = () => {
      bgImage.value = img
      renderPreview()
      loading.value = false
    }
    img.onerror = () => {
      ElMessage.error('预览帧图片加载失败')
      loading.value = false
    }
    img.src = data.frame_base64
  } catch (error: any) {
    console.error('获取预览帧失败:', error)
    ElMessage.error('获取预览帧失败: ' + (error.message || '未知错误'))
    loading.value = false
  }
}

// 渲染预览
const renderPreview = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 1. 画背景帧
  if (bgImage.value) {
    ctx.drawImage(bgImage.value, 0, 0, canvasWidth, canvasHeight)
  } else {
    // 无背景帧时画一个渐变背景模拟
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(0.5, '#16213e')
    gradient.addColorStop(1, '#0f3460')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  }

  // 2. 自适应背景处理（以字幕为中心）
  if (config.bg_mode !== 'none' && bgImage.value) {
    const ratio = bgImage.value ? scaleRatio : (canvasHeight / 1920)
    const subtitleCenterY = canvasHeight - config.margin_v * ratio - (config.font_size * ratio * FONT_WIDTH_CORRECTION) / 2
    const halfH = (config.bg_height * ratio) / 2
    const regionY = Math.max(0, Math.floor(subtitleCenterY - halfH))
    const regionBottom = Math.min(canvasHeight, Math.ceil(subtitleCenterY + halfH))
    const regionH = regionBottom - regionY

    if (config.bg_mode === 'blur') {
      const off = document.createElement('canvas')
      off.width = canvasWidth
      off.height = canvasHeight
      const offCtx = off.getContext('2d')!
      offCtx.drawImage(bgImage.value, 0, 0, canvasWidth, canvasHeight)
      ctx.save()
      ctx.filter = `blur(${Math.round(config.blur_strength * 0.5)}px)`
      ctx.drawImage(off, 0, regionY, canvasWidth, regionH, 0, regionY, canvasWidth, regionH)
      ctx.restore()
    } else if (config.bg_mode === 'fill') {
      ctx.save()
      ctx.fillStyle = config.bg_colour
      ctx.fillRect(0, regionY, canvasWidth, regionH)
      ctx.restore()
    }
  }

  // 3. 角标叠层
  if (cornerMarkImage.value) {
    ctx.drawImage(cornerMarkImage.value, 0, 0, canvasWidth, canvasHeight)
  }

  // 2. 坐标换算（视频原始px → canvas px）
  const effectiveRatio = bgImage.value ? scaleRatio : (canvasHeight / 1920)
  const fontSize = config.font_size * effectiveRatio
  const marginBottom = config.margin_v * effectiveRatio
  const x = canvasWidth / 2
  const y = canvasHeight - marginBottom

  // 字体设置（美术字体通常无 Bold 字重，用 normal 匹配 libass 实际渲染）
  ctx.font = `normal ${fontSize}px "${config.font_name}", "Microsoft YaHei", "微软雅黑", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'

  // 结合 hSquish 和字体宽度校正系数
  // bold 时后端用 \fscx106\fscy106，预览同步 1.06 缩放以匹配实际输出
  const boldScale = config.bold ? 1.06 : 1
  const totalScaleX = hSquish * FONT_WIDTH_CORRECTION * boldScale

  // 描边在 scale 之外设置，避免 scale 影响 lineWidth 导致偏粗
  // bold 时描边额外 +1.0（与后端一致）
  // bold 同色细描边的 lineWidth 也在外部换算：目标视觉宽度 / 当前 scale 系数
  const boldExtraLineWidth = config.bold
    ? (fontSize * 0.015) / Math.sqrt(totalScaleX * FONT_WIDTH_CORRECTION * boldScale)
    : 0
  if (config.outline > 0) {
    ctx.strokeStyle = config.outline_colour
    ctx.lineWidth = (config.outline + (config.bold ? 1.0 : 0)) * effectiveRatio * 0.5
    ctx.lineJoin = 'round'
  }

  ctx.save()
  ctx.translate(x, y)
  ctx.scale(totalScaleX, FONT_WIDTH_CORRECTION * boldScale)

  if (config.outline > 0) {
    ctx.strokeText(previewText.value, 0, 0)
  }
  ctx.fillStyle = config.primary_colour
  // bold：用同色细描边叠在文字上，模拟笔画加粗（lineWidth 已在 scale 外换算）
  if (config.bold) {
    ctx.strokeStyle = config.primary_colour
    ctx.lineWidth = boldExtraLineWidth
    ctx.lineJoin = 'round'
    ctx.strokeText(previewText.value, 0, 0)
  }
  ctx.fillText(previewText.value, 0, 0)
  ctx.restore()

  // 通知父组件配置变化（映射 bg_mode → blur_subtitles）
  emit('update:config', {
    ...config,
    blur_subtitles: config.bg_mode === 'blur',
  })
}

// 暴露方法供父组件调用
const getConfig = () => ({ ...config })

defineExpose({ getConfig, loadPreviewFrame })

// 监听角标 URL 变化，加载角标图片
watch(() => props.cornerMarkUrl, (url) => {
  if (!url) {
    cornerMarkImage.value = null
    renderPreview()
    return
  }
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    cornerMarkImage.value = img
    renderPreview()
  }
  img.onerror = () => {
    cornerMarkImage.value = null
    renderPreview()
  }
  img.src = url
}, { immediate: true })

// 监听模糊开关和强度变化
watch([() => config.bg_mode, () => config.blur_strength, () => config.bg_colour, () => config.bg_height], () => {
  renderPreview()
})

// 监听 videoUrl 变化
watch(() => props.videoUrl, (newUrl) => {
  if (newUrl) {
    loadPreviewFrame(newUrl)
  }
})

// 监听 scriptText 变化以截取第一句作为预览
watch(() => props.scriptText, (newText) => {
  if (newText) {
    const firstSentence = newText.split(/[,，。.!！?？\n]/)[0]
    if (firstSentence) {
      previewText.value = firstSentence.substring(0, 20)
      renderPreview()
    }
  }
}, { immediate: true })

// 挂载后初始渲染
onMounted(() => {
  // 并行：预加载默认字体 + 从 API 拉取用户模板
  Promise.all([
    loadFont('竹言体'),
    loadSavedTemplates()
  ]).then(() => {
    nextTick(() => {
      renderPreview()
      if (props.videoUrl) {
        loadPreviewFrame(props.videoUrl)
      }
    })
  })
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
