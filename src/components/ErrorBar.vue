<template>
  <div class="error-bar" v-if="message">
    <icon-exclamation-circle-fill />
    <span>{{ message }}</span>
  </div>
</template>

<script setup>
import { IconExclamationCircleFill } from '@arco-design/web-vue/es/icon'
defineProps({ message: String })
</script>

<style scoped>
.error-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px; margin-bottom: 16px;
  background: #fff2f0; border: 1px solid #ffccc7;
  border-radius: 6px; color: #ff4d4f; font-size: 13px;
}
</style>
