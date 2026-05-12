<template>
  <div class="form-actions-bar">
    <a-space :size="16">
      <a-button v-if="showCancel" @click="handleCancel">{{ cancelText }}</a-button>
      <a-button type="primary" :loading="loading" @click="handleConfirm">{{ confirmText }}</a-button>
    </a-space>
  </div>
</template>

<script setup>
const props = defineProps({
  showCancel: {
    type: Boolean,
    default: true
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['cancel', 'confirm'])

function handleCancel() {
  emit('cancel')
}

function handleConfirm() {
  emit('confirm')
}
</script>

<style scoped>
.form-actions-bar {
  margin-top: 20px;
  padding: 16px 24px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  justify-content: flex-end;
}
</style>
