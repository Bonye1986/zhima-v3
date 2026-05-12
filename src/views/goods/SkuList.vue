<template>
  <div class="page-container">
    <!-- 产品Tab -->
    <ProductTabs v-model="activeProduct" />

    <!-- 搜索与批量操作 -->
    <SearchToolbar placeholder="搜索SKU名称/编码" @search="handleSearch">
      <template #extra>
        <a-select
          v-model="spuFilter"
          placeholder="所属商品"
          style="width: 140px"
          allow-clear
        >
          <a-option v-for="s in filteredSpuListForFilter" :key="s.id" :value="s.name">{{ s.name }}</a-option>
        </a-select>
        <a-select
          v-model="statusFilter"
          placeholder="上架状态"
          style="width: 120px"
          allow-clear
        >
          <a-option value="已上架">已上架</a-option>
          <a-option value="已下架">已下架</a-option>
        </a-select>
        <a-select
          v-model="visibilityFilter"
          placeholder="适用范围"
          style="width: 120px"
          allow-clear
        >
          <a-option value="全部可见">全部可见</a-option>
          <a-option value="部分可见">部分可见</a-option>
        </a-select>
        <a-range-picker
          v-model="dateFilter"
          :placeholder="['开始', '结束']"
          style="width: 260px"
        />
      </template>
      <template #actions>
        <a-button type="primary" @click="goCreate">
          <template #icon><icon-plus /></template>
          添加SKU
        </a-button>
      </template>
    </SearchToolbar>

    <!-- 批量操作栏 -->
    <BatchBar :selectedCount="selectedKeys.length" @cancel="selectedKeys = []">
      <template #actions>
        <a-button size="small" type="outline" @click="batchAction('上架')">批量上架</a-button>
        <a-button size="small" type="outline" @click="batchAction('下架')">批量下架</a-button>
        <a-button size="small" type="outline" status="danger" @click="batchAction('删除')">批量删除</a-button>
      </template>
    </BatchBar>

    <!-- 表格 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data="filteredList"
        :pagination="pagination"
        v-model:selectedKeys="selectedKeys"
        row-key="id"
        stripe
        :scroll="{ x: 'max-content' }"
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
      >
        <template #status="{ record }">
          <a-tag :color="statusColorMap[record.status]" size="small">{{ record.status }}</a-tag>
        </template>
        <template #visibility="{ record }">
          <a-tag :color="visibilityColorMap[record.visibility]" size="small">{{ record.visibility }}</a-tag>
        </template>
        <template #price="{ record }">¥{{ record.price.toFixed(2) }}</template>
        <template #validDays="{ record }">{{ record.validDays }}天</template>
        <template #sales="{ record }">¥{{ record.sales.toLocaleString() }}</template>
        <template #actions="{ record }">
          <div class="table-actions">
            <a-link @click="toggleStatus(record)">{{ record.status === '已上架' ? '下架' : '上架' }}</a-link>
            <a-link @click="editSku(record)">编辑</a-link>
            <a-link status="danger" @click="handleDelete(record)">删除</a-link>
          </div>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import { products, skuList, spuList } from '../../mock/data.js'
import ProductTabs from '../../components/ProductTabs.vue'
import SearchToolbar from '../../components/SearchToolbar.vue'
import BatchBar from '../../components/BatchBar.vue'

const router = useRouter()
const activeProduct = ref(products[0]?.id || 'P001')
const searchText = ref('')
const selectedKeys = ref([])

const spuFilter = ref('')
const statusFilter = ref('')
const visibilityFilter = ref('')
const dateFilter = ref([])

const tableData = ref(JSON.parse(JSON.stringify(skuList)))

const statusColorMap = { '已上架': 'green', '已下架': 'gray' }
const visibilityColorMap = { '全部可见': 'blue', '部分可见': 'orange' }

const filteredSpuListForFilter = computed(() => {
  return spuList.filter(s => s.productId === activeProduct.value)
})

const pagination = ref({ pageSize: 20, showTotal: true, showPageSize: true })

const columns = [
  { title: 'SKU名称', dataIndex: 'name', width: 140, ellipsis: false },
  { title: 'SKU编码', dataIndex: 'code', width: 110, ellipsis: false },
  { title: '所属商品', dataIndex: 'spu', width: 110, ellipsis: false },
  { title: '价格', slotName: 'price', width: 80, ellipsis: false },
  { title: '上架状态', slotName: 'status', width: 85, ellipsis: false },
  { title: '适用范围', slotName: 'visibility', width: 85, ellipsis: false },
  { title: '有效期', slotName: 'validDays', width: 75, ellipsis: false },
  { title: '已交易次数', dataIndex: 'traded', width: 95, ellipsis: false },
  { title: '销售额', slotName: 'sales', width: 100, ellipsis: false },
  { title: '创建时间', dataIndex: 'createTime', width: 150, ellipsis: false },
  { title: '操作', slotName: 'actions', width: 170, fixed: 'right' },
]

const filteredList = computed(() => {
  let list = tableData.value
  list = list.filter(s => s.productId === activeProduct.value)
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(s => s.name.toLowerCase().includes(kw) || s.code.toLowerCase().includes(kw))
  }
  if (spuFilter.value) {
    list = list.filter(s => s.spu === spuFilter.value)
  }
  if (statusFilter.value) {
    list = list.filter(s => s.status === statusFilter.value)
  }
  if (visibilityFilter.value) {
    list = list.filter(s => s.visibility === visibilityFilter.value)
  }
  if (dateFilter.value && dateFilter.value.length === 2) {
    const startDate = new Date(dateFilter.value[0]).getTime()
    const endDate = new Date(dateFilter.value[1]).getTime()
    list = list.filter(s => {
      const itemDate = new Date(s.createTime).getTime()
      return itemDate >= startDate && itemDate <= endDate
    })
  }
  return list
})

function handleSearch() {}

function goCreate() {
  router.push('/goods/sku/create')
}

watch(activeProduct, () => {
  searchText.value = ''
  spuFilter.value = ''
  statusFilter.value = ''
  visibilityFilter.value = ''
  dateFilter.value = []
  selectedKeys.value = []
})

function toggleStatus(record) {
  record.status = record.status === '已上架' ? '已下架' : '已上架'
  Message.success(`SKU「${record.name}」已${record.status === '已上架' ? '上架' : '下架'}`)
}

function editSku(record) {
  router.push(`/goods/sku/edit/${record.id}`)
}

function handleDelete(record) {
  Modal.warning({
    title: '确认删除',
    content: `确定要删除SKU「${record.name}」吗？`,
    hideCancel: false,
    onOk() {
      tableData.value = tableData.value.filter(s => s.id !== record.id)
      Message.success('删除成功')
    }
  })
}

function batchAction(action) {
  Modal.warning({
    title: `批量${action}`,
    content: `确定要${action}选中的 ${selectedKeys.value.length} 个SKU吗？`,
    hideCancel: false,
    onOk() {
      if (action === '删除') {
        tableData.value = tableData.value.filter(s => !selectedKeys.value.includes(s.id))
      } else {
        tableData.value.forEach(s => {
          if (selectedKeys.value.includes(s.id)) s.status = action === '上架' ? '已上架' : '已下架'
        })
      }
      selectedKeys.value = []
      Message.success(`批量${action}成功`)
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

:deep(.arco-table-cell) {
  white-space: nowrap;
}

:deep(.arco-table-th) {
  white-space: nowrap;
}

:deep(.arco-table-td) {
  white-space: nowrap;
}

:deep(.arco-table-col-fixed-right) {
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.08);
}

:deep(.arco-table-col-fixed-left) {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
}
</style>
