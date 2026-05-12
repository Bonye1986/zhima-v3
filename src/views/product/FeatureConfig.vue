<template>
  <div class="page-container">
    <!-- 产品线Tab -->
    <ProductTabs v-model="activeProduct" @change="handleTabChange" />

    <!-- 搜索与操作栏 -->
    <SearchToolbar placeholder="搜索能力名称" @search="handleSearch">
      <template #actions>
        <a-button type="primary" @click="openModal()">
          <template #icon><icon-plus /></template>
          新增功能
        </a-button>
      </template>
    </SearchToolbar>

    <!-- 表格 -->
    <PageCard>
      <a-table :columns="columns" :data="filteredFeatures" :pagination="pagination" row-key="id" stripe>
        <template #status="{ record }">
          <a-switch v-model="record.status" checked-text="启用" unchecked-text="禁用" @change="(val) => Message.success(`「${record.name}」已${val ? '启用' : '禁用'}`)" />
        </template>
        <template #actions="{ record }">
          <a-space>
            <a-link @click="openModal(record)">编辑</a-link>
            <a-link @click="openPricingModal(record)">定价配置</a-link>
            <a-link status="danger" @click="handleDelete(record)">删除</a-link>
          </a-space>
        </template>
      </a-table>
    </PageCard>

    <!-- 新增/编辑弹窗 -->
    <a-modal v-model:visible="modalVisible" :title="isEdit ? '编辑功能' : '新增功能'" @ok="handleModalOk" @cancel="handleModalCancel" :mask-closable="false" :width="600">
      <a-form :model="formData" layout="vertical">
        <a-form-item label="所属产品">
          <a-input :model-value="currentProductName" disabled />
        </a-form-item>
        <a-form-item label="能力值ID" required>
          <a-input-number v-model="formData.featureId" :min="1" placeholder="请输入能力值ID" :disabled="isEdit" style="width: 100%" />
        </a-form-item>
        <a-form-item label="能力名称" required>
          <a-input v-model="formData.name" placeholder="请输入能力名称" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="API模型">
              <a-input v-model="formData.apiModel" placeholder="如：Nano-Banana-Pro" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="型号">
              <a-input v-model="formData.model" placeholder="如：2K/4K" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="刊例价 (¥)">
              <a-input-number v-model="formData.listPrice" :min="0" :precision="2" placeholder="请输入刊例价" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="成本价 (¥)">
              <a-input-number v-model="formData.costPrice" :min="0" :precision="2" placeholder="请输入成本价" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="能力描述">
          <a-textarea v-model="formData.desc" placeholder="请输入能力描述" :max-length="200" show-word-limit />
        </a-form-item>
        <a-form-item label="启用状态">
          <a-switch v-model="formData.status" />
        </a-form-item>
      </a-form>

      <!-- 未保存提示 -->
      <div v-if="hasUnsavedChanges" class="unsaved-tip">
        <icon-exclamation-circle class="tip-icon" />
        <span>有未保存的修改</span>
      </div>
    </a-modal>

    <!-- 定价配置弹窗 -->
    <a-modal v-model:visible="pricingModalVisible" :title="`${currentFeature?.name || ''} - 定价配置`" :footer="false" :width="800">
      <div style="margin-bottom: 16px;">
        <a-button type="primary" @click="openPricingForm()">
          <template #icon><icon-plus /></template>
          新增定价
        </a-button>
      </div>
      <a-table :columns="pricingColumns" :data="currentPricingList" :pagination="false" row-key="id" stripe>
        <template #status="{ record }">
          <a-switch v-model="record.status" checked-text="启用" unchecked-text="禁用" @change="(val) => Message.success(`定价配置已${val ? '启用' : '禁用'}`)" />
        </template>
        <template #actions="{ record }">
          <a-space>
            <a-link @click="openPricingForm(record)">编辑</a-link>
            <a-link status="danger" @click="handlePricingDelete(record)">删除</a-link>
          </a-space>
        </template>
      </a-table>
    </a-modal>

    <!-- 定价表单弹窗 -->
    <a-modal v-model:visible="pricingFormVisible" :title="isPricingEdit ? '编辑定价' : '新增定价'" @ok="handlePricingFormOk" :width="520">
      <a-form :model="pricingFormData" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="API模型" required>
              <a-input v-model="pricingFormData.apiModel" placeholder="如：Nano-Banana-Pro" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="型号">
              <a-input v-model="pricingFormData.model" placeholder="如：2K/4K" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="刊例价 (¥)" required>
              <a-input-number v-model="pricingFormData.listPrice" :min="0" :precision="2" placeholder="请输入刊例价" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="成本价 (¥)" required>
              <a-input-number v-model="pricingFormData.costPrice" :min="0" :precision="2" placeholder="请输入成本价" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="启用状态">
          <a-switch v-model="pricingFormData.status" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus, IconExclamationCircle } from '@arco-design/web-vue/es/icon'
import ProductTabs from '../../components/ProductTabs.vue'
import SearchToolbar from '../../components/SearchToolbar.vue'
import PageCard from '../../components/PageCard.vue'
import { products, features, featurePricing } from '../../mock/data.js'

const activeProduct = ref(products[0]?.id || 'P001')
const searchText = ref('')
const modalVisible = ref(false)
const isEdit = ref(false)

// 定价配置弹窗
const pricingModalVisible = ref(false)
const currentFeature = ref(null)
const pricingTableData = ref([])
const pricingFormVisible = ref(false)
const isPricingEdit = ref(false)
const pricingFormData = ref({ id: '', featureId: null, apiModel: '', model: '', listPrice: null, costPrice: null, status: true })

const tableData = ref(JSON.parse(JSON.stringify(features)))
const pricingData = ref(JSON.parse(JSON.stringify(featurePricing)))

const formData = ref({ id: '', featureId: null, name: '', desc: '', status: true })

// 存储原始数据用于对比是否有修改
const originalFormData = ref(null)

// 计算是否有未保存的修改
const hasUnsavedChanges = computed(() => {
  if (!originalFormData.value) return false
  return JSON.stringify(formData.value) !== JSON.stringify(originalFormData.value)
})

const pagination = ref({ pageSize: 20, showTotal: true, showPageSize: true })

const columns = [
  { title: '能力值ID', dataIndex: 'featureId', width: 100 },
  { title: '能力名称', dataIndex: 'name', width: 150 },
  { title: '能力描述', dataIndex: 'desc', width: 300, ellipsis: true },
  { title: '启用状态', slotName: 'status', width: 100 },
  { title: '操作', slotName: 'actions', width: 200 },
]

const currentProductName = computed(() => {
  const p = products.find(p => p.id === activeProduct.value)
  return p ? p.name : ''
})

const filteredFeatures = computed(() => {
  let list = tableData.value.filter(f => f.productId === activeProduct.value)
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(f => f.name.toLowerCase().includes(kw))
  }
  return list
})

function handleTabChange() {}

function handleSearch() {
  // 搜索逻辑已在 computed 中处理
}

function openModal(record) {
  if (record) {
    isEdit.value = true
    formData.value = { ...record }
  } else {
    isEdit.value = false
    formData.value = { id: '', featureId: '', name: '', apiModel: '', model: '', listPrice: null, costPrice: null, desc: '', status: true, productId: activeProduct.value }
  }
  originalFormData.value = JSON.parse(JSON.stringify(formData.value))
  modalVisible.value = true
}

function handleModalOk() {
  if (!formData.value.featureId) { Message.error('请输入能力值ID'); return }
  if (!formData.value.name) { Message.error('请输入能力名称'); return }
  // 校验 featureId 唯一性
  const existingFeature = tableData.value.find(f => f.featureId === formData.value.featureId && f.id !== formData.value.id)
  if (existingFeature) {
    Message.error('能力值ID已存在，请更换其他ID')
    return
  }
  if (isEdit.value) {
    const idx = tableData.value.findIndex(f => f.id === formData.value.id)
    if (idx !== -1) Object.assign(tableData.value[idx], formData.value)
    Message.success('编辑成功')
  } else {
    tableData.value.push({
      id: `F${String(tableData.value.length + 1).padStart(3, '0')}`,
      featureId: formData.value.featureId,
      name: formData.value.name,
      listPrice: formData.value.listPrice,
      costPrice: formData.value.costPrice,
      desc: formData.value.desc,
      productId: activeProduct.value,
      status: formData.value.status,
    })
    Message.success('新增成功')
  }
  modalVisible.value = false
  originalFormData.value = null
}

function handleModalCancel() {
  modalVisible.value = false
  originalFormData.value = null
}

// 打开定价配置弹窗
function openPricingModal(record) {
  currentFeature.value = record
  pricingModalVisible.value = true
}

// 获取当前能力的定价配置
const currentPricingList = computed(() => {
  if (!currentFeature.value) return []
  return pricingData.value.filter(p => p.featureId === currentFeature.value.featureId)
})

// 定价配置表格列
const pricingColumns = [
  { title: 'API模型', dataIndex: 'apiModel', width: 180 },
  { title: '型号', dataIndex: 'model', width: 100 },
  { title: '刊例价', dataIndex: 'listPrice', width: 100, render: ({ record }) => `¥${record.listPrice}` },
  { title: '成本价', dataIndex: 'costPrice', width: 100, render: ({ record }) => `¥${record.costPrice}` },
  { title: '状态', slotName: 'status', width: 90 },
  { title: '操作', slotName: 'actions', width: 120 },
]

// 打开定价表单
function openPricingForm(record = null) {
  if (record) {
    isPricingEdit.value = true
    pricingFormData.value = { ...record }
  } else {
    isPricingEdit.value = false
    pricingFormData.value = { id: '', featureId: currentFeature.value.featureId, apiModel: '', model: '', listPrice: null, costPrice: null, status: true }
  }
  pricingFormVisible.value = true
}

// 保存定价配置
function handlePricingFormOk() {
  if (!pricingFormData.value.apiModel) { Message.error('请输入API模型'); return }
  if (pricingFormData.value.listPrice === null) { Message.error('请输入刊例价'); return }
  if (pricingFormData.value.costPrice === null) { Message.error('请输入成本价'); return }

  if (isPricingEdit.value) {
    const index = pricingData.value.findIndex(p => p.id === pricingFormData.value.id)
    if (index > -1) {
      pricingData.value[index] = { ...pricingFormData.value }
    }
  } else {
    const newId = 'FP' + String(pricingData.value.length + 1).padStart(3, '0')
    pricingData.value.push({ ...pricingFormData.value, id: newId })
  }
  pricingFormVisible.value = false
  Message.success(isPricingEdit.value ? '修改成功' : '新增成功')
}

// 删除定价配置
function handlePricingDelete(record) {
  Modal.warning({
    title: '确认删除',
    content: `确定要删除该定价配置吗？`,
    hideCancel: false,
    onOk() {
      pricingData.value = pricingData.value.filter(p => p.id !== record.id)
      Message.success('删除成功')
    }
  })
}

function handleDelete(record) {
  Modal.warning({
    title: '确认删除',
    content: `确定要删除能力「${record.name}」吗？`,
    hideCancel: false,
    onOk() {
      tableData.value = tableData.value.filter(f => f.id !== record.id)
      Message.success('删除成功')
    }
  })
}
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #f5f6f7;
  min-height: calc(100vh - 56px);
}

.unsaved-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin: 16px -20px -20px;
  background: #fff7e6;
  border-top: 1px solid #ffd591;
  color: #fa8c16;
  font-size: 13px;
}

.tip-icon {
  font-size: 16px;
}
</style>
