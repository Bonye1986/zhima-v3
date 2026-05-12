<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <PageHeader title="产品列表" />

    <!-- 搜索与操作栏 -->
    <SearchToolbar placeholder="搜索产品名称/ID" @search="handleSearch">
      <template #actions>
        <a-button type="primary" @click="goCreate">
          <template #icon><icon-plus /></template>
          创建产品
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

    <!-- 产品表格 -->
    <a-card :bordered="false">
      <a-table :columns="columns" :data="filteredProducts" :pagination="pagination" row-key="id" stripe :row-selection="{ type: 'checkbox', showCheckedAll: true }" v-model:selectedKeys="selectedKeys">
        <template #icon="{ record }">
          <span style="font-size: 20px;">{{ record.icon }}</span>
        </template>
        <template #status="{ record }">
          <a-switch v-model="record.status" checked-text="启用" unchecked-text="禁用" @change="(val) => handleStatusChange(record, val, '启用')" />
        </template>
        <template #listed="{ record }">
          <a-switch v-model="record.listed" checked-text="上架" unchecked-text="下架" @change="(val) => handleStatusChange(record, val, '上架')" />
        </template>
        <template #actions="{ record }">
          <div class="table-actions">
            <a-link @click="handleEdit(record)">编辑</a-link>
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
import PageHeader from '../../components/PageHeader.vue'
import SearchToolbar from '../../components/SearchToolbar.vue'
import BatchBar from '../../components/BatchBar.vue'
import { products } from '../../mock/data.js'

const router = useRouter()
const searchText = ref('')
const selectedKeys = ref([])

const productList = ref(JSON.parse(JSON.stringify(products)))

const pagination = ref({ pageSize: 20, showTotal: true, showPageSize: true })

const columns = [
  { title: '产品名称', dataIndex: 'name', width: 150, ellipsis: true, tooltip: true },
  { title: '图标', slotName: 'icon', width: 60 },
  { title: '产品ID', dataIndex: 'id', width: 100, ellipsis: true, tooltip: true },
  { title: '商品数量', dataIndex: 'spuLimit', width: 100 },
  { title: '已配置能力项', dataIndex: 'featureCount', width: 120 },
  { title: '启用状态', slotName: 'status', width: 100 },
  { title: '上架状态', slotName: 'listed', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', width: 180, ellipsis: true, tooltip: true },
  { title: '操作', slotName: 'actions', width: 120, fixed: 'right' },
]

const filteredProducts = computed(() => {
  if (!searchText.value) return productList.value
  const kw = searchText.value.toLowerCase()
  return productList.value.filter(p => p.name.toLowerCase().includes(kw) || p.id.toLowerCase().includes(kw))
})

function handleSearch() {}

function goCreate() {
  router.push('/product/create')
}

function handleDelete(record) {
  const hasUnfinishedOrders = Math.random() > 0.5
  if (hasUnfinishedOrders) {
    Modal.warning({
      title: '无法删除',
      content: `产品「${record.name}」存在未完成的订单，请先处理相关订单后再删除。`,
    })
    return
  }
  Modal.warning({
    title: '确认删除',
    content: `确定要删除产品「${record.name}」吗？此操作不可逆！`,
    okText: '确认删除',
    cancelText: '取消',
    hideCancel: false,
    onOk() {
      productList.value = productList.value.filter(p => p.id !== record.id)
      Message.success('删除成功')
    }
  })
}

function handleEdit(record) {
  router.push(`/product/detail/${record.id}`)
}

function handleStatusChange(record, val, label) {
  Message.success(`产品「${record.name}」已${val ? label : `取消${label}`}`)
}

function goDetail(record) {
  router.push(`/product/detail/${record.id}`)
}

function batchToggleEnable(status) {
  let count = 0
  selectedKeys.value.forEach(key => {
    const item = productList.value.find(p => p.id === key)
    if (item) { item.status = status; count++ }
  })
  Message.success(`已${status ? '启用' : '禁用'} ${count} 个产品`)
}

function batchToggleList(status) {
  let count = 0
  selectedKeys.value.forEach(key => {
    const item = productList.value.find(p => p.id === key)
    if (item) { item.listed = status; count++ }
  })
  Message.success(`已${status ? '上架' : '下架'} ${count} 个产品`)
}

function batchDelete() {
  if (!selectedKeys.value.length) {
    Message.warning('请选择要删除的记录')
    return
  }
  const count = selectedKeys.value.length
  productList.value = productList.value.filter(p => !selectedKeys.value.includes(p.id))
  selectedKeys.value = []
  Message.success(`已删除 ${count} 个产品`)
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

.table-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 4px;
}

.table-actions :deep(.arco-link) {
  padding: 0 6px;
  margin: 0;
}

:deep(.arco-table-col-fixed-right) {
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.08);
}

:deep(.arco-table-col-fixed-left) {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
}

</style>
