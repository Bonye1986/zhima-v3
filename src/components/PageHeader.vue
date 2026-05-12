<template>
  <div class="page-header">
    <div class="header-left">
      <a-button v-if="showBack" type="text" size="small" @click="handleBack">
        <template #icon><span style="font-size: 14px;">&lt;</span></template>
        {{ backText }}
      </a-button>
      <span v-if="title" class="page-title">{{ title }}</span>
    </div>
    <div class="header-right">
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  showBack: { type: Boolean, default: true },
  backText: { type: String, default: '返回' },
  title: { type: String, default: '' },
  backPath: { type: String, default: '' },
})

const emit = defineEmits(['back'])
const router = useRouter()

function handleBack() {
  if (props.backPath) {
    router.push(props.backPath)
  } else {
    router.back()
  }
  emit('back')
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
