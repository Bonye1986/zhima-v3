<template>
  <div class="page-container">
    <!-- 搜索与筛选 -->
    <SearchToolbar placeholder="搜索发票号码/订单ID/购买方" @search="handleSearch">
      <template #extra>
        <a-select v-model="statusFilter" placeholder="开票状态" allow-clear style="width: 120px;">
          <a-option value="开票成功">开票成功</a-option>
          <a-option value="开票中">开票中</a-option>
          <a-option value="开票失败">开票失败</a-option>
          <a-option value="已冲销">已冲销</a-option>
        </a-select>
        <a-select v-model="typeFilter" placeholder="发票类型" allow-clear style="width: 140px;">
          <a-option value="增值税普通发票">增值税普通发票</a-option>
          <a-option value="增值税专用发票">增值税专用发票</a-option>
        </a-select>
        <a-range-picker v-model="dateFilter" :placeholder="['开始', '结束']" style="width: 240px;" />
      </template>
    </SearchToolbar>

    <!-- 表格 -->
    <PageCard>
      <a-table :columns="columns" :data="filteredList" :pagination="pagination" row-key="id" :scroll="{ x: 1600 }" stripe>
        <template #type="{ record }">
          <a-tag :color="record.type.includes('专用') ? 'purple' : 'blue'" size="small">{{ record.type }}</a-tag>
        </template>
        <template #amount="{ record }">¥{{ record.amount.toFixed(2) }}</template>
        <template #orderId="{ record }">
          <a-link @click="goToOrderDetail(record.orderId)">{{ record.orderId }}</a-link>
        </template>
        <template #status="{ record }">
          <a-tag :color="invoiceStatusColor[record.status]" size="small">{{ record.status }}</a-tag>
        </template>
        <template #actions="{ record }">
          <div class="table-actions">
            <a-link @click="openDetail(record)">详情</a-link>
            <a-link :disabled="record.status !== '开票成功'" @click="Message.success('发票已下载')">下载</a-link>
            <a-link status="danger" :disabled="record.status !== '开票成功'" @click="handleVoid(record)">冲销</a-link>
          </div>
        </template>
      </a-table>
    </PageCard>

    <!-- 发票详情弹窗 -->
    <a-modal v-model:visible="detailVisible" title="发票详情" :footer="false" width="500px">
      <div class="detail-content">
        <div class="detail-item">
          <span class="detail-label">发票号码：</span>
          <span class="detail-value">{{ currentRecord?.invoiceNo }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">订单ID：</span>
          <span class="detail-value">{{ currentRecord?.orderId }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">购买方：</span>
          <span class="detail-value">{{ currentRecord?.buyerName }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">发票类型：</span>
          <span class="detail-value">{{ currentRecord?.type }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">发票金额：</span>
          <span class="detail-value" style="color: #f53f3f; font-weight: 500;">¥{{ currentRecord?.amount?.toFixed(2) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">开票状态：</span>
          <span class="detail-value">
            <a-tag :color="invoiceStatusColor[currentRecord?.status]" size="small">{{ currentRecord?.status }}</a-tag>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">开票时间：</span>
          <span class="detail-value">{{ currentRecord?.issueTime || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">纳税人识别号：</span>
          <span class="detail-value">{{ currentRecord?.buyerTax || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">地址电话：</span>
          <span class="detail-value">{{ currentRecord?.buyerAddress || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">开户行及账号：</span>
          <span class="detail-value">{{ currentRecord?.buyerBank || '-' }}</span>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import SearchToolbar from '../../components/SearchToolbar.vue'
import PageCard from '../../components/PageCard.vue'
import { invoices } from '../../mock/data.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchText = ref('')
const statusFilter = ref(undefined)
const typeFilter = ref(undefined)
const dateFilter = ref([])
const detailVisible = ref(false)
const currentRecord = ref({})

const tableData = ref(JSON.parse(JSON.stringify(invoices)))

const invoiceStatusColor = {
  '开票成功': 'green',
  '开票中': 'blue',
  '开票失败': 'red',
  '已冲销': 'gray',
}

const pagination = ref({ pageSize: 20, showTotal: true, showPageSize: true })

const columns = [
  { title: '发票号码', dataIndex: 'invoiceNo', width: 140, ellipsis: true, tooltip: true, render: ({ record }) => record.invoiceNo || '—' },
  { title: '发票类型', slotName: 'type', width: 120 },
  { title: '订单编号', slotName: 'orderId', width: 160, ellipsis: true, tooltip: true },
  { title: '购买方名称', dataIndex: 'buyerName', width: 110, ellipsis: true, tooltip: true },
  { title: '购买方类型', dataIndex: 'buyerType', width: 90, ellipsis: true, tooltip: true },
  { title: '纳税人识别号', dataIndex: 'buyerTax', width: 160, ellipsis: true, tooltip: true, render: ({ record }) => record.buyerTax || '—' },
  { title: '申请时间', dataIndex: 'applyTime', width: 150, ellipsis: true, tooltip: true },
  { title: '开票金额', slotName: 'amount', width: 90 },
  { title: '开票时间', dataIndex: 'issueTime', width: 150, ellipsis: true, tooltip: true, render: ({ record }) => record.issueTime || '—' },
  { title: '开票状态', slotName: 'status', width: 90 },
  { title: '操作', slotName: 'actions', width: 170, fixed: 'right' },
]

const filteredList = computed(() => {
  let list = tableData.value
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(inv => (inv.invoiceNo || '').toLowerCase().includes(kw) || inv.orderId.toLowerCase().includes(kw) || inv.buyerName.toLowerCase().includes(kw))
  }
  if (statusFilter.value) list = list.filter(inv => inv.status === statusFilter.value)
  if (typeFilter.value) list = list.filter(inv => inv.type === typeFilter.value)
  return list
})

function handleSearch() {}

function handleVoid(record) {
  Modal.warning({
    title: '确认冲销',
    content: `确定要冲销发票「${record.invoiceNo}」吗？冲销后不可恢复。`,
    hideCancel: false,
    onOk() {
      record.status = '已冲销'
      Message.success('冲销成功')
    }
  })
}

function openDetail(record) {
  currentRecord.value = record
  detailVisible.value = true
}

function goToOrderDetail(orderId) {
  router.push(`/order/detail/${orderId}`)
}
</script>

<style scoped>
.page-container {
  background: #f5f6f7;
  min-height: calc(100vh - 56px);
  padding: 20px;
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

.detail-content {
  padding: 8px 0;
}

.detail-item {
  display: flex;
  margin-bottom: 16px;
  line-height: 22px;
}

.detail-label {
  color: #86909c;
  width: 110px;
  flex-shrink: 0;
}

.detail-value {
  color: #1d2129;
  flex: 1;
}
</style>
