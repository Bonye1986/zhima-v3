<template>
  <div class="page-container">
    <!-- 产品TAB栏 -->
    <ProductTabs v-model="activeProduct" @change="handleProductChange" />

    <!-- 搜索筛选栏 -->
    <SearchToolbar placeholder="搜索充值单号/租户名称" @search="handleSearch">
      <template #extra>
        <a-select v-model="filterStatus" placeholder="充值状态" allow-clear style="width: 120px">
          <a-option value="已完成">已完成</a-option>
          <a-option value="待确认">待确认</a-option>
          <a-option value="已关闭">已关闭</a-option>
        </a-select>
        <a-select v-model="filterPayMethod" placeholder="支付方式" allow-clear style="width: 120px">
          <a-option value="银行转账">银行转账</a-option>
          <a-option value="微信支付">微信支付</a-option>
          <a-option value="支付宝">支付宝</a-option>
        </a-select>
        <a-range-picker v-model="filterDateRange" :placeholder="['开始', '结束']" style="width: 260px" />
      </template>
      <template #actions>
        <a-button @click="resetFilters">重置</a-button>
        <a-button type="primary" @click="handleExport">
          <template #icon><icon-download /></template>
          导出
        </a-button>
      </template>
    </SearchToolbar>

    <!-- 批量操作栏 -->
    <BatchBar :selectedCount="selectedKeys.length" @cancel="selectedKeys = []">
      <template #actions>
        <a-button size="small" type="outline" @click="batchExport">批量导出</a-button>
      </template>
    </BatchBar>

    <!-- 数据表格 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data="filteredData"
        :pagination="{ pageSize: 20, showTotal: true, showPageSize: true }"
        :scroll="{ x: 1600 }"
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
        v-model:selectedKeys="selectedKeys"
        row-key="id"
        stripe
      >
        <template #id="{ record }">
          <a-link @click="openDetail(record)">{{ record.id }}</a-link>
        </template>
        <template #rechargePoints="{ record }">
          <span class="points-value">{{ record.rechargePoints.toLocaleString() }}</span>
        </template>
        <template #originalAmount="{ record }">¥{{ record.originalAmount.toFixed(2) }}</template>
        <template #discountAmount="{ record }">
          {{ record.discountAmount > 0 ? `¥${record.discountAmount.toFixed(2)}` : '—' }}
        </template>
        <template #actualAmount="{ record }">
          <span style="color: #f53f3f; font-weight: 500;">¥{{ record.actualAmount.toFixed(2) }}</span>
        </template>
        <template #status="{ record }">
          <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
        </template>
        <template #actions="{ record }">
          <div class="table-actions">
            <a-button type="text" size="small" @click="openDetail(record)">详情</a-button>
          </div>
        </template>
      </a-table>
    </a-card>

    <!-- 充值详情弹窗 -->
    <a-modal v-model:visible="detailVisible" title="充值订单详情" :footer="false" width="600px">
      <a-descriptions :column="2" bordered size="small">
        <a-descriptions-item label="充值单号" :span="2">{{ currentRecord?.id }}</a-descriptions-item>
        <a-descriptions-item label="租户名称">{{ currentRecord?.tenantName }}</a-descriptions-item>
        <a-descriptions-item label="归属产品">{{ currentRecord?.productName }}</a-descriptions-item>
        <a-descriptions-item label="充值类型">{{ currentRecord?.rechargeType }}</a-descriptions-item>
        <a-descriptions-item label="充值权益值">
          <span class="points-value">{{ currentRecord?.rechargePoints?.toLocaleString() }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="单价">¥{{ currentRecord?.unitPrice?.toFixed(2) }}</a-descriptions-item>
        <a-descriptions-item label="原价金额">¥{{ currentRecord?.originalAmount?.toFixed(2) }}</a-descriptions-item>
        <a-descriptions-item label="优惠差额">
          {{ currentRecord?.discountAmount > 0 ? `¥${currentRecord.discountAmount.toFixed(2)}` : '—' }}
        </a-descriptions-item>
        <a-descriptions-item label="实付金额">
          <span style="color: #f53f3f; font-weight: 500;">¥{{ currentRecord?.actualAmount?.toFixed(2) }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="支付方式">{{ currentRecord?.payMethod }}</a-descriptions-item>
        <a-descriptions-item label="充值状态">
          <a-tag :color="statusColor(currentRecord?.status)">{{ currentRecord?.status }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="操作人">{{ currentRecord?.operator }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ currentRecord?.createTime }}</a-descriptions-item>
        <a-descriptions-item label="完成时间">{{ currentRecord?.completeTime || '—' }}</a-descriptions-item>
        <a-descriptions-item label="备注" :span="2">{{ currentRecord?.remark || '—' }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconDownload } from '@arco-design/web-vue/es/icon'
import { rechargeOrders, products } from '../../mock/data.js'
import ProductTabs from '../../components/ProductTabs.vue'
import SearchToolbar from '../../components/SearchToolbar.vue'
import BatchBar from '../../components/BatchBar.vue'

const activeProduct = ref('P001')
const searchText = ref('')
const filterStatus = ref('')
const filterPayMethod = ref('')
const filterDateRange = ref([])
const detailVisible = ref(false)
const currentRecord = ref(null)
const selectedKeys = ref([])

const tableData = ref(rechargeOrders.slice())

const columns = [
  { title: '充值单号', slotName: 'id', width: 170 },
  { title: '租户名称', dataIndex: 'tenantName', width: 120, ellipsis: true, tooltip: true },
  { title: '归属产品', dataIndex: 'productName', width: 100 },
  { title: '充值权益值', slotName: 'rechargePoints', width: 110, align: 'right' },
  { title: '原价金额', slotName: 'originalAmount', width: 100, align: 'right' },
  { title: '优惠差额', slotName: 'discountAmount', width: 100, align: 'right' },
  { title: '实付金额', slotName: 'actualAmount', width: 100, align: 'right' },
  { title: '支付方式', dataIndex: 'payMethod', width: 100 },
  { title: '充值状态', slotName: 'status', width: 100, align: 'center' },
  { title: '操作人', dataIndex: 'operator', width: 80 },
  { title: '创建时间', dataIndex: 'createTime', width: 170, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '操作', slotName: 'actions', width: 150, fixed: 'right' },
]

const filteredData = computed(() => {
  const pName = activeProduct.value === 'P001' ? '智马翻译' : '智马漫影'
  let list = tableData.value.filter(r => r.productName === pName)
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(r => r.id.toLowerCase().includes(kw) || r.tenantName.toLowerCase().includes(kw))
  }
  if (filterStatus.value) list = list.filter(r => r.status === filterStatus.value)
  if (filterPayMethod.value) list = list.filter(r => r.payMethod === filterPayMethod.value)
  return list
})

function handleProductChange(key) {
  activeProduct.value = key
}

function statusColor(status) {
  const map = { '已完成': 'green', '待确认': 'orange', '已关闭': 'gray' }
  return map[status] || 'gray'
}

function handleSearch(value) {
  searchText.value = value || ''
}

function resetFilters() {
  searchText.value = ''
  filterStatus.value = ''
  filterPayMethod.value = ''
  filterDateRange.value = []
}

function handleExport() { Message.success('导出成功') }

function batchExport() {
  if (selectedKeys.value.length === 0) {
    Message.warning('请选择要导出的记录')
    return
  }
  Message.success(`将导出 ${selectedKeys.value.length} 条记录`)
}

function openDetail(record) {
  currentRecord.value = record
  detailVisible.value = true
}
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #f5f6f7;
  min-height: calc(100vh - 56px);
}

.points-value {
  font-weight: 600;
  color: #f53f3f;
}

.table-actions {
  display: flex;
  gap: 4px;
  white-space: nowrap;
}

.table-actions :deep(.arco-btn) {
  padding: 0 6px;
}

.table-card {
  border-radius: 4px;
}
</style>
