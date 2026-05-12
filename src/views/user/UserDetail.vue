<template>
  <div class="page-container">
    <ErrorBar :message="errorMsg" />

    <PageHeader title="用户详情" show-back back-path="/user/list" />

    <PageCard>
      <a-card :bordered="false" class="info-card">
        <template #title>
          <div class="card-title-with-action">
            <span>用户信息</span>
            <a-button v-if="!isEditing" type="primary" size="small" @click="startEdit">
              <template #icon><icon-edit /></template>
              编辑
            </a-button>
            <a-space v-else>
              <a-button size="small" @click="cancelEdit">取消</a-button>
              <a-button type="primary" size="small" @click="saveEdit">保存</a-button>
            </a-space>
          </div>
        </template>
        <div class="user-info-grid">
          <div class="info-item">
            <span class="info-label">产品名称</span>
            <span class="info-value">{{ productName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">用户名</span>
            <a-input v-if="isEditing" v-model="editForm.name" style="width: 180px;" />
            <span v-else class="info-value">{{ user.name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">用户账号</span>
            <span class="info-value">{{ user.account }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">密码</span>
            <template v-if="isEditing">
              <a-input v-model="editForm.password" placeholder="留空则不修改" style="width: 180px;" />
            </template>
            <span v-else class="info-value">******</span>
          </div>
          <div class="info-item">
            <span class="info-label">用户ID</span>
            <span class="info-value">{{ user.id }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">手机号</span>
            <a-input v-if="isEditing" v-model="editForm.phone" style="width: 180px;" />
            <span v-else class="info-value">{{ user.phone }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">有效期</span>
            <template v-if="isEditing">
              <div style="display: flex; gap: 8px;">
                <a-select v-model="editForm.expireType" style="width: 100px;">
                  <a-option value="permanent">永久</a-option>
                  <a-option value="date">指定日期</a-option>
                </a-select>
                <a-date-picker v-if="editForm.expireType === 'date'" v-model="editForm.expireTime" style="width: 150px;" />
              </div>
            </template>
            <span v-else class="info-value">{{ user.expireTime || '永久' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">状态</span>
            <div v-if="isEditing" class="info-value">
              <a-switch v-model="editForm.status" checked-text="启用" unchecked-text="禁用" />
            </div>
            <span v-else class="info-value">
              <a-tag :color="user.status ? 'green' : 'red'" size="small">{{ user.status ? '启用' : '禁用' }}</a-tag>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">消费总金额</span>
            <span class="info-value highlight">¥{{ user.totalSpend?.toLocaleString() }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">剩余点数</span>
            <span class="info-value highlight">{{ user.balance?.toLocaleString() }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">总订单数量</span>
            <span class="info-value">{{ user.orders }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">预扣额度上限</span>
            <span class="info-value">{{ user.preDeductLimit?.toLocaleString() || '—' }}</span>
          </div>
          <div class="info-item" style="grid-column: span 2;">
            <span class="info-label">用户标签</span>
            <div v-if="isEditing" class="info-value">
              <a-select v-model="editForm.tags" multiple placeholder="请选择标签" allow-create style="width: 100%;">
                <a-option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</a-option>
              </a-select>
            </div>
            <span v-else class="info-value">
              <a-tag v-for="(tag, idx) in (user.tags || [])" :key="idx" :color="tagColors[idx % tagColors.length]" size="small" style="margin-right:4px;">{{ tag }}</a-tag>
              <span v-if="!user.tags || user.tags.length === 0" style="color:#c9cdd4;">—</span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">注册时间</span>
            <span class="info-value">{{ user.createTime }}</span>
          </div>
        </div>
      </a-card>
    </PageCard>

    <PageCard>
      <div class="tab-section">
        <a-tabs v-model:active-key="activeTab" type="line" animation>
          <a-tab-pane key="tenants" title="租户空间">
            <UserTenantList :user-id="userId" />
          </a-tab-pane>
          <a-tab-pane key="orders" title="订单交易明细">
            <div class="toolbar">
              <a-space>
                <a-input-search
                  v-model="searchText"
                  placeholder="搜索订单ID/商品名"
                  style="width: 240px"
                  allow-clear
                  @search="handleSearch"
                  @press-enter="handleSearch"
                />
                <a-range-picker
                  v-model="orderDateRange"
                  style="width: 220px"
                  :placeholder="['开始', '结束']"
                  @change="handleOrderDateChange"
                />
              </a-space>
            </div>
            <a-table
              :columns="columns"
              :data="filteredOrders"
              :pagination="{ pageSize: 20, showTotal: true, showPageSize: true }"
              :scroll="{ x: 1200 }"
              stripe
            >
              <template #orderId="{ record }">
                <a-link @click="goOrderDetail(record.id)">{{ record.id }}</a-link>
              </template>
              <template #goodsName="{ record }">
                <template v-if="record.source === 'manual'">
                  <a-tag size="small" color="orange">商务合作结算</a-tag>
                </template>
                <span v-else>{{ record.goodsName }}</span>
              </template>
              <template #skuName="{ record }">
                <span v-if="record.source === 'manual'" style="color:#c9cdd4;">—</span>
                <span v-else>{{ record.skuName }}</span>
              </template>
              <template #status="{ record }">
                <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
              </template>
              <template #invoiceStatus="{ record }">
                <a-tag v-if="record.invoiceStatus === '已开票'" color="blue">已开票</a-tag>
                <a-tag v-else-if="record.invoiceStatus === '开票中'" color="cyan">开票中</a-tag>
                <span v-else style="color: #86909c;">{{ record.invoiceStatus || '未开票' }}</span>
              </template>
            </a-table>
          </a-tab-pane>
          <a-tab-pane key="points" title="消费明细">
            <div class="toolbar" style="justify-content: space-between;">
              <a-space>
                <a-range-picker v-model="pointsFilter.dateRange" style="width: 220px;" :placeholder="['开始', '结束']" @change="handlePointsSearch" />
              </a-space>
              <a-button type="primary" @click="handleExportPoints">
                <template #icon><icon-download /></template>
                导出
              </a-button>
            </div>
            <a-table
              :columns="pointsColumns"
              :data="filteredPointsLogs"
              :pagination="{ pageSize: 20, showTotal: true, showPageSize: true }"
              :scroll="{ x: 1200 }"
              stripe
            />
          </a-tab-pane>
        </a-tabs>
      </div>
    </PageCard>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconDownload, IconEdit } from '@arco-design/web-vue/es/icon'
import PageHeader from '../../components/PageHeader.vue'
import PageCard from '../../components/PageCard.vue'
import ErrorBar from '../../components/ErrorBar.vue'
import { users, orders, userPointsLogs, products, tenants, consumptionRecords, featurePricing, tenantTaskShareRatios } from '../../mock/data'
import UserTenantList from './components/UserTenantList.vue'

const route = useRoute()
const router = useRouter()

const errorMsg = ref('')

const userId = route.params.id
const user = ref(users.find(u => u.id === userId) || users[0])

const productName = computed(() => {
  const pid = user.value.productId
  const p = products.find(x => x.id === pid)
  return p?.name || user.value.productName || '智马翻译'
})
const searchText = ref('')
const activeTab = ref('tenants')
const tagColors = ['blue', 'green', 'orange', 'purple', 'cyan']

const orderDateRange = ref([])

const availableTags = ['VIP', 'SVIP', '新客户', '老客户', '高消费', '测试用户', '渠道用户']

const isEditing = ref(false)
const editForm = ref({
  name: '',
  phone: '',
  password: '',
  expireType: 'permanent',
  expireTime: '',
  status: true,
  tags: [],
})

function startEdit() {
  editForm.value = {
    name: user.value.name,
    phone: user.value.phone,
    password: '',
    expireType: user.value.expireTime && user.value.expireTime !== '永久' ? 'date' : 'permanent',
    expireTime: user.value.expireTime && user.value.expireTime !== '永久' ? user.value.expireTime : '',
    status: user.value.status,
    tags: user.value.tags || [],
  }
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

function saveEdit() {
  user.value.name = editForm.value.name
  user.value.phone = editForm.value.phone
  user.value.status = editForm.value.status
  user.value.expireTime = editForm.value.expireType === 'date' ? editForm.value.expireTime : '永久'
  user.value.tags = editForm.value.tags || []
  isEditing.value = false
  Message.success('保存成功')
}

const pointsFilter = ref({
  dateRange: []
})

const userOrders = computed(() => orders.filter(o => o.userId === user.value.id))

const userConsumptions = computed(() => {
  return consumptionRecords
    .filter(cr => cr.userId === user.value.id)
    .map(cr => {
      const pricing = featurePricing.find(fp =>
        fp.apiModel === cr.model && fp.model === cr.modelVersion
      ) || { listPrice: 0.1, costPrice: 0.06 }

      const tenant = tenants.find(t => t.name === cr.tenantName)
      const shareConfig = tenantTaskShareRatios.find(ts =>
        ts.tenantId === tenant?.id && ts.taskTypeName === cr.serviceType
      ) || { settlePrice: pricing.listPrice * 0.2 }

      const isPersonal = !tenant || tenant.type === '个人用户' || tenant.type === '团队用户'
      const tenantDisplay = isPersonal ? (cr.userName || '个人') : (tenant?.name || cr.tenantName)

      return {
        ...cr,
        tenantName: tenantDisplay,
        listPrice: pricing.listPrice,
        costPrice: pricing.costPrice,
        settlePrice: shareConfig.settlePrice || (pricing.listPrice * 0.2)
      }
    })
})

const filteredOrders = computed(() => {
  let list = userOrders.value

  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(o => o.id.toLowerCase().includes(kw) || o.goodsName.includes(kw))
  }

  if (orderDateRange.value && orderDateRange.value.length === 2) {
    const start = new Date(orderDateRange.value[0]).getTime()
    const end = new Date(orderDateRange.value[1]).getTime()
    list = list.filter(o => {
      const orderDate = new Date(o.orderTime).getTime()
      return orderDate >= start && orderDate <= end
    })
  }

  return list
})

const filteredPointsLogs = computed(() => {
  let list = userConsumptions.value
  if (pointsFilter.value.dateRange && pointsFilter.value.dateRange.length === 2) {
    const start = new Date(pointsFilter.value.dateRange[0]).getTime()
    const end = new Date(pointsFilter.value.dateRange[1]).getTime()
    list = list.filter(cr => {
      const recordDate = new Date(cr.createTime).getTime()
      return recordDate >= start && recordDate <= end
    })
  }
  return list
})

const columns = [
  { title: '订单ID', slotName: 'orderId', width: 180, fixed: 'left', ellipsis: true, tooltip: true },
  { title: '商品名称', dataIndex: 'goodsName', width: 140, ellipsis: true, tooltip: true },
  { title: 'SKU名称', dataIndex: 'skuName', width: 140, ellipsis: true, tooltip: true },
  { title: '获取权益值', dataIndex: 'points', width: 110 },
  { title: '到账租户', dataIndex: 'receivedTenant', width: 120, ellipsis: true, tooltip: true },
  { title: '渠道来源', dataIndex: 'channelSource', width: 100 },
  { title: '下单时间', dataIndex: 'orderTime', width: 170, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '订单状态', slotName: 'status', width: 100 },
  { title: '支付方式', dataIndex: 'payMethod', width: 100, ellipsis: true, tooltip: true },
  { title: '订单金额', dataIndex: 'amount', width: 100, render: ({ record }) => `¥${record.amount}` },
  { title: '优惠金额', dataIndex: 'discountAmount', width: 100, render: ({ record }) => record.discountAmount ? `¥${record.discountAmount}` : '—' },
  { title: '实付金额', dataIndex: 'actualAmount', width: 100, render: ({ record }) => `¥${record.actualAmount}` },
  { title: '支付手续费', dataIndex: 'commission', width: 110, render: ({ record }) => record.commission ? `¥${record.commission.toFixed(2)}` : '—' },
  { title: '实收金额', dataIndex: 'netAmount', width: 100, render: ({ record }) => record.netAmount ? `¥${record.netAmount.toFixed(2)}` : '—' },
  { title: '分成金额', dataIndex: 'shareAmount', width: 100, ellipsis: true, tooltip: true },
  { title: '开票状态', slotName: 'invoiceStatus', width: 90 },
]

const usageUnitMap = {
  '智马翻译': '点',
  '智马漫影': '次',
  '默认': '点'
}

const usageUnit = computed(() => {
  return usageUnitMap[productName.value] || usageUnitMap['默认']
})

const pointsColumns = [
  { title: '流水号', dataIndex: 'id', width: 160, fixed: 'left' },
  { title: '消费时间', dataIndex: 'createTime', width: 170 },
  { title: '租户', dataIndex: 'tenantName', width: 150, ellipsis: true },
  { title: '任务类型', dataIndex: 'serviceType', width: 100 },
  { title: '用量', dataIndex: 'consumePoints', width: 120, align: 'right', render: ({ record }) => `${record.consumePoints?.toLocaleString()} ${usageUnit.value}` },
  { title: '刊例价', dataIndex: 'listPrice', width: 110, align: 'right', render: ({ record }) => `¥${record.listPrice?.toFixed(2)}/${usageUnit.value}` },
  { title: '成本价', dataIndex: 'costPrice', width: 110, align: 'right', render: ({ record }) => `¥${record.costPrice?.toFixed(2)}/${usageUnit.value}` },
  { title: '结算价', dataIndex: 'settlePrice', width: 110, align: 'right', render: ({ record }) => `¥${record.settlePrice?.toFixed(2)}/${usageUnit.value}` },
  { title: '任务名称', dataIndex: 'businessName', width: 180, ellipsis: true },
  { title: '模型', dataIndex: 'model', width: 120, render: ({ record }) => record.model || '—' },
  { title: '型号', dataIndex: 'modelVersion', width: 120, render: ({ record }) => record.modelVersion || '—' },
]

function statusColor(status) {
  const map = { '已完成': 'green', '进行中': 'blue', '已支付': 'cyan', '待支付': 'orange', '退款成功': 'red' }
  return map[status] || 'gray'
}

function goOrderDetail(id) {
  router.push(`/order/detail/${id}`)
}

function handleSearch() {
}

function handlePointsSearch() {
}

function handleOrderDateChange() {
}

function handleExportPoints() {
  const data = filteredPointsLogs.value
  if (data.length === 0) {
    Message.warning('没有数据可导出')
    return
  }

  const headers = ['流水号', '消费时间', '租户', '服务类型', `用量(${usageUnit.value})`, '刊例价', '成本价', '结算价', '业务名称', '模型', '型号']
  const rows = data.map(row => [
    row.id,
    row.createTime,
    row.tenantName,
    row.serviceType,
    `${row.consumePoints} ${usageUnit.value}`,
    `¥${row.listPrice?.toFixed(2)}`,
    `¥${row.costPrice?.toFixed(2)}`,
    `¥${row.settlePrice?.toFixed(2)}`,
    row.businessName,
    row.model || '—',
    row.modelVersion || '—'
  ])

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `消费明细_${user.value.name}_${new Date().toLocaleDateString('zh-CN')}.csv`
  link.click()
  Message.success('导出成功')
}
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #f5f6f7;
  min-height: 100%;
}

.info-card {
  margin-bottom: 16px;
}

.info-card :deep(.arco-card-header) {
  border-bottom: none;
}

.info-card :deep(.arco-card-body) {
  padding-top: 0;
}

.card-title-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  padding-left: 12px;
  border-left: 4px solid #165DFF;
}

.user-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px 32px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 14px;
  color: #86909c;
}

.info-value {
  font-size: 14px;
  color: #1d2129;
  font-weight: 500;
}

.info-value.highlight {
  color: #165DFF;
  font-size: 14px;
}

.info-card :deep(.arco-tag) {
  font-size: 14px;
}

.tab-section {
  padding: 0;
}

.tab-section :deep(.arco-tabs-nav) {
  margin-bottom: 0;
}

.tab-section :deep(.arco-tabs-content) {
  padding-top: 0;
}

.toolbar {
  margin-bottom: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  box-shadow: none;
  padding: 16px 0;
}

.toolbar > * {
  margin-right: 8px;
}

.toolbar > *:last-child {
  margin-right: 0;
}

.points-income {
  color: #00b42a;
  font-weight: 600;
}

.points-expense {
  color: #f53f3f;
  font-weight: 600;
}
</style>
