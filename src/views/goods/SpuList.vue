<template>
  <div class="page-container">
    <!-- 产品线Tab -->
    <ProductTabs v-model="activeProduct" @change="handleTabChange" />

    <!-- 搜索与操作栏 -->
    <SearchToolbar placeholder="搜索商品名称/ID" @search="handleSearch">
      <template #extra>
        <a-select v-model="payTypeFilter" placeholder="支付类型" allow-clear style="width: 120px;">
          <a-option value="单次支付">单次支付</a-option>
          <a-option value="周期付款">周期付款</a-option>
        </a-select>
        <a-select v-model="listedFilter" placeholder="上架状态" allow-clear style="width: 120px;">
          <a-option :value="true">已上架</a-option>
          <a-option :value="false">已下架</a-option>
        </a-select>
        <a-select v-model="statusFilter" placeholder="启用状态" allow-clear style="width: 120px;">
          <a-option :value="true">启用</a-option>
          <a-option :value="false">禁用</a-option>
        </a-select>
        <a-range-picker v-model="dateFilter" :placeholder="['开始', '结束']" style="width: 240px;" />
      </template>
      <template #actions>
        <a-button type="primary" @click="goCreate">
          <template #icon><icon-plus /></template>
          创建商品
        </a-button>
      </template>
    </SearchToolbar>

    <!-- 批量操作栏 -->
    <BatchBar :selectedCount="selectedKeys.length" @cancel="clearSelection">
      <template #actions>
        <a-button size="small" type="outline" @click="batchToggleEnable(true)">批量启用</a-button>
        <a-button size="small" type="outline" @click="batchToggleEnable(false)">批量禁用</a-button>
        <a-button size="small" type="outline" @click="batchToggleList(true)">批量上架</a-button>
        <a-button size="small" type="outline" @click="batchToggleList(false)">批量下架</a-button>
        <a-button size="small" type="outline" status="danger" @click="batchDelete">批量删除</a-button>
      </template>
    </BatchBar>

    <!-- 表格 -->
    <a-card :bordered="false" class="table-card">
      <a-table :columns="columns" :data="filteredList" :pagination="pagination" :row-selection="{ type: 'checkbox', showCheckedAll: true }" v-model:selectedKeys="selectedKeys" row-key="id" :scroll="{ x: 1200 }" stripe>
        <template #payType="{ record }">
          <a-tag :color="record.payType === '周期付款' ? 'arcoblue' : 'green'" size="small">{{ record.payType }}</a-tag>
        </template>
        <template #skuCount="{ record }">
          {{ record.skuCount }}
        </template>
        <template #sales="{ record }">
          ¥{{ record.sales.toLocaleString() }}
        </template>
        <template #listed="{ record }">
          <a-tag :color="record.listed ? 'green' : 'gray'" size="small">{{ record.listed ? '已上架' : '已下架' }}</a-tag>
        </template>
        <template #status="{ record }">
          <a-switch v-model="record.status" checked-text="启用" unchecked-text="禁用" @change="(val) => Message.success(`「${record.name}」已${val ? '启用' : '禁用'}`)" />
        </template>
        <template #actions="{ record }">
          <div class="table-actions">
            <a-link @click="toggleListed(record)">{{ record.listed ? '下架' : '上架' }}</a-link>
            <a-link @click="goDetail(record)">编辑</a-link>
            <a-link status="danger" @click="handleDelete(record)">删除</a-link>
          </div>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import ProductTabs from '../../components/ProductTabs.vue'
import SearchToolbar from '../../components/SearchToolbar.vue'
import BatchBar from '../../components/BatchBar.vue'
import { products, spuList } from '../../mock/data.js'

const router = useRouter()
const activeProduct = ref(products[0]?.id || 'P001')
const searchText = ref('')
const payTypeFilter = ref(undefined)
const listedFilter = ref(undefined)
const statusFilter = ref(undefined)
const dateFilter = ref([])
const selectedKeys = ref([])

const tableData = ref(JSON.parse(JSON.stringify(spuList)))

const pagination = ref({ pageSize: 20, showTotal: true, showPageSize: true })

const columns = [
  { title: '商品名称', dataIndex: 'name', width: 140, ellipsis: true, tooltip: true },
  { title: '商品ID', dataIndex: 'id', width: 100, ellipsis: true, tooltip: true },
  { title: '支付类型', slotName: 'payType', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', width: 160, ellipsis: true, tooltip: true },
  { title: 'SKU数量', slotName: 'skuCount', width: 90 },
  { title: '销售额', slotName: 'sales', width: 110 },
  { title: '上架状态', slotName: 'listed', width: 90 },
  { title: '启用状态', slotName: 'status', width: 90 },
  { title: '操作', slotName: 'actions', width: 170, fixed: 'right' },
]

const currentProductName = computed(() => {
  const p = products.find(p => p.id === activeProduct.value)
  return p ? p.name : ''
})

const filteredList = computed(() => {
  let list = tableData.value.filter(s => s.productId === activeProduct.value)
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(s => s.name.toLowerCase().includes(kw) || s.id.toLowerCase().includes(kw))
  }
  if (payTypeFilter.value) list = list.filter(s => s.payType === payTypeFilter.value)
  if (listedFilter.value !== undefined) list = list.filter(s => s.listed === listedFilter.value)
  if (statusFilter.value !== undefined) list = list.filter(s => s.status === statusFilter.value)
  if (dateFilter.value && dateFilter.value.length === 2) {
    const start = new Date(dateFilter.value[0]).getTime()
    const end = new Date(dateFilter.value[1]).getTime()
    list = list.filter(s => {
      const t = new Date(s.createTime).getTime()
      return t >= start && t <= end
    })
  }
  return list
})

function handleTabChange() {}

function handleSearch() {}

function goCreate() {
  router.push('/goods/spu/create')
}

function toggleListed(record) {
  record.listed = !record.listed
  Message.success(`「${record.name}」已${record.listed ? '上架' : '下架'}`)
}

function handleDelete(record) {
  Modal.warning({
    title: '确认删除',
    content: `确定要删除商品「${record.name}」吗？`,
    hideCancel: false,
    onOk() {
      tableData.value = tableData.value.filter(s => s.id !== record.id)
      Message.success('删除成功')
    }
  })
}

function goDetail(record) {
  router.push(`/goods/spu/detail/${record.id}`)
}

function goSkuList(record) {
  router.push(`/goods/sku?spu=${record.id}`)
}

function batchToggleEnable(status) {
  let count = 0
  selectedKeys.value.forEach(key => {
    const item = tableData.value.find(s => s.id === key)
    if (item) { item.status = status; count++ }
  })
  Message.success(`已${status ? '启用' : '禁用'} ${count} 个商品`)
}

function batchToggleList(status) {
  let count = 0
  selectedKeys.value.forEach(key => {
    const item = tableData.value.find(s => s.id === key)
    if (item) { item.listed = status; count++ }
  })
  Message.success(`已${status ? '上架' : '下架'} ${count} 个商品`)
}

function batchDelete() {
  if (!selectedKeys.value.length) {
    Message.warning('请选择要删除的记录')
    return
  }
  const count = selectedKeys.value.length
  tableData.value = tableData.value.filter(s => !selectedKeys.value.includes(s.id))
  selectedKeys.value = []
  Message.success(`已删除 ${count} 个商品`)
}

function clearSelection() {
  selectedKeys.value = []
}
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #f5f6f7;
  min-height: calc(100vh - 56px);
}

:deep(.arco-btn-size-small) {
  padding: 0 8px;
}

:deep(.arco-table-th) {
  background: #fafafa;
  font-weight: 500;
}

:deep(.arco-table-th:hover) {
  background: #f5f5f5;
}

.table-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 4px;
}

.table-actions :deep(.arco-btn) {
  padding: 0 6px;
  margin: 0;
}

</style>
