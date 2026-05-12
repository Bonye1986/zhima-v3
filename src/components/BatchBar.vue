<template>
  <div class="batch-bar" v-if="selectedCount > 0">
    <span class="batch-info">已选中 <strong>{{ selectedCount }}</strong> 项</span>
    <a-space>
      <slot name="actions" />
      <a-link @click="$emit('cancel')">取消选择</a-link>
    </a-space>
  </div>
</template>

<script setup>
defineProps({ selectedCount: { type: Number, default: 0 } })
defineEmits(['cancel'])
</script>

<style scoped>
.batch-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 20px; background: #f0f5ff; border: 1px solid #d6e4ff;
  border-top: none; border-radius: 0;
}
.batch-info { font-size: 13px; color: #4e5969; }
.batch-info strong { color: #165dff; }
</style>
