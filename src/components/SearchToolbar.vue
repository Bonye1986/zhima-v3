<template>
  <div class="search-toolbar">
    <div class="toolbar-left">
      <a-input-search
        v-model="searchValue"
        :placeholder="placeholder"
        style="width:280px"
        allow-clear
        @search="$emit('search', $event)"
        @clear="$emit('search', '')"
      />
      <slot name="extra" />
    </div>
    <div class="toolbar-right">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
defineProps({ placeholder: { type: String, default: '搜索...' } })
defineEmits(['search'])
const searchValue = ref('')
</script>

<style scoped>
.search-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; background: #fff; border-radius: 4px 4px 0 0;
}
.toolbar-left { display: flex; align-items: center; gap: 12px; }
.toolbar-right { display: flex; align-items: center; gap: 12px; }
</style>
