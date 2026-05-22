<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center"
    :class="overlay ? 'bg-black/50' : ''"
  >
    <div class="flex flex-col items-center space-y-4 p-6 bg-white rounded-xl shadow-lg">
      <!-- 旋轉圓圈 -->
      <div class="relative">
        <div
          class="animate-spin rounded-full border-4 border-gray-200"
          :class="sizeClasses"
          :style="{ borderTopColor: color }"
        ></div>
      </div>
      <!-- 載入文字 -->
      <p v-if="text" class="text-gray-600 text-sm font-medium">{{ text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show?: boolean
  text?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: true,
  text: '載入中...',
  size: 'md',
  color: '#3b82f6',
  overlay: true,
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  }
  return sizes[props.size]
})
</script>
