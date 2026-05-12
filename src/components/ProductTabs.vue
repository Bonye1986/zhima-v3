<template>
  <div class="product-tabs-wrapper">
    <div class="custom-tabs">
      <div
        v-for="p in tabs"
        :key="p.id"
        :class="['tab-item', { active: activeKey === p.id }]"
        @click="handleChange(p.id)"
      >
        {{ p.name }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { products } from '../mock/data'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'P001'
  },
  tabs: {
    type: Array,
    default: () => products
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const activeKey = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
  }
})

const handleChange = (key) => {
  activeKey.value = key
  emit('change', key)
}
</script>

<style scoped>
.product-tabs-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.custom-tabs {
  display: flex;
  gap: 8px;
}

.tab-item {
  padding: 8px 20px;
  font-size: 14px;
  color: #4e5969;
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.2s;
}

.tab-item:hover {
  color: #165dff;
}

.tab-item.active {
  background: #f2f3f5;
  color: #165dff;
  font-weight: 500;
}
</style>
