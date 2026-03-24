<template>
  <el-select
    v-model="internalValue"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    :loading="loading"
    class="w-full"
    @change="handleChange"
  >
    <el-option
      v-for="item in options"
      :key="item.id"
      :label="item.valueName"
      :value="item.keyCode"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { getDictionaryEntryListByCode } from '/@/api/system/dictionary'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  code: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: '请选择'
  },
  clearable: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const internalValue = ref(props.modelValue)
const options = ref<any[]>([])
const loading = ref(false)

// 监听外部值变化
watch(() => props.modelValue, (val) => {
  internalValue.value = val
})

// 监听内部值变化
const handleChange = (val: any) => {
  emit('update:modelValue', val)
  emit('change', val)
}

const fetchOptions = async () => {
  if (!props.code) return
  loading.value = true
  try {
    const res = await getDictionaryEntryListByCode(props.code)
    if (res.data.code === 200 || res.data.code === 0) {
      options.value = res.data.data || []
    }
  } catch (error) {
    console.error(`Fetch dictionary entries for ${props.code} failed:`, error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOptions()
})

// 提供刷新方法
defineExpose({
  refresh: fetchOptions
})
</script>
