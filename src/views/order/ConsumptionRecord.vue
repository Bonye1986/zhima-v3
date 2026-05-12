<template>
  <div class="page-container">
    <!-- 产品线Tab -->
    <ProductTabs v-model="activeProduct" @change="handleProductChange" />

    <!-- 统计卡片 -->
    <a-row :gutter="16" style="margin-bottom: 16px; margin-top: 16px;">
      <a-col :span="4" v-for="stat in statistics" :key="stat.label">
        <a-card :bordered="false" class="stat-card">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value" :class="stat.class">{{ stat.value }}</div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 视图1: 用户消费汇总 -->
    <template v-if="viewMode === 'summary'">
      <!-- 搜索筛选栏 -->
      <div class="filter-bar" style="margin-bottom: 16px;">
        <div class="filter-left">
          <a-range-picker
            v-model="dateRange"
            style="width: 240px"
            :placeholder="['开始日期', '结束日期']"
            @change="handleDateChange"
          />
          <a-select
            v-model="settlementStatusFilter"
            placeholder="结算状态"
            allow-clear
            style="width: 120px"
          >
            <a-option value="">全部</a-option>
            <a-option value="已结算">已结算</a-option>
            <a-option value="待结算">待结算</a-option>
          </a-select>
          <a-select
            v-model="invoiceStatusFilter"
            placeholder="开票状态"
            allow-clear
            style="width: 120px"
          >
            <a-option value="">全部</a-option>
            <a-option value="已开票">已开票</a-option>
            <a-option value="开票中">开票中</a-option>
            <a-option value="未开票">未开票</a-option>
          </a-select>
        </div>
        <div class="filter-right">
          <a-button type="primary" @click="handleExport">
            <template #icon><icon-download /></template>
            导出
          </a-button>
        </div>
      </div>

      <!-- 用户汇总表格 -->
      <a-card :bordered="false" class="table-card">
        <a-table
          :data="[...userSummary, userTotalRow]"
          :columns="summaryColumns"
          :pagination="false"
          stripe
          :scroll="{ x: 1800 }"
          row-key="userAccount"
        >
          <template #accountName="{ record }">
            <span>{{ record.accountName }}</span>
          </template>
          <template #userName="{ record }">
            <span>{{ record.userName }}</span>
          </template>
          <template #tenant="{ record }">
            <span>{{ record.tenant }}</span>
          </template>
          <template #customerSource="{ record }">
            <a-tag v-if="record.customerSource === '运营方'" color="blue">{{ record.customerSource }}</a-tag>
            <span v-else>{{ record.customerSource }}</span>
          </template>
          <template #settlementStatus="{ record }">
            <a-tag v-if="record.settlementStatus === '已结算'" color="green">{{ record.settlementStatus }}</a-tag>
            <a-tag v-else-if="record.settlementStatus === '待结算'" color="orange">{{ record.settlementStatus }}</a-tag>
            <span v-else>—</span>
          </template>
          <template #invoiceStatus="{ record }">
            <a-tag v-if="record.invoiceStatus === '已开票'" color="blue">{{ record.invoiceStatus }}</a-tag>
            <a-tag v-else-if="record.invoiceStatus === '开票中'" color="cyan">{{ record.invoiceStatus }}</a-tag>
            <a-tag v-else-if="record.invoiceStatus === '未开票'" color="gray">{{ record.invoiceStatus }}</a-tag>
            <span v-else>—</span>
          </template>
          <template #actions="{ record }">
            <a-button v-if="record.userName !== '合计'" type="text" size="small" @click="viewUserDetail(record)">
              查看
            </a-button>
          </template>
        </a-table>
      </a-card>
    </template>

    <!-- 视图2: 用户任务消耗明细 -->
    <template v-else>
      <!-- 返回标题栏 -->
      <div class="detail-header" style="margin-bottom: 16px;">
        <a-button type="text" @click="backToSummary">
          <template #icon><icon-left /></template>
          返回汇总
        </a-button>
        <span class="detail-title">{{ selectedUserName }} - 任务消耗明细（共{{ filteredTaskRecords.length }}笔）</span>
      </div>

      <!-- 搜索筛选栏 -->
      <SearchToolbar placeholder="搜索流水号/任务名称/模型" @search="handleDetailSearch">
        <template #extra>
          <a-range-picker
            v-model="detailDateRange"
            style="width: 240px"
            :placeholder="['开始日期', '结束日期']"
            @change="handleDetailDateChange"
          />
        </template>
        <template #actions>
          <a-button @click="handleDetailExport">
            <template #icon><icon-download /></template>
            导出
          </a-button>
        </template>
      </SearchToolbar>

      <!-- 明细表格 -->
      <a-card :bordered="false" class="table-card">
        <a-table
          :data="filteredTaskRecords"
          :columns="detailColumns"
          :pagination="{ pageSize: 20, showTotal: true, showPageSize: true }"
          :scroll="{ x: 2000 }"
          stripe
          row-key="id"
        >
          <template #id="{ record }">
            <span class="mono-text">{{ record.id }}</span>
          </template>
          <template #actions="{ record }">
            <a-button type="text" size="small" @click="goDetail(record.id)">详情</a-button>
          </template>
        </a-table>
      </a-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconDownload, IconLeft } from '@arco-design/web-vue/es/icon'
import ProductTabs from '../../components/ProductTabs.vue'
import SearchToolbar from '../../components/SearchToolbar.vue'
import { users, tenants, consumptionRecords, featurePricing, tenantTaskShareRatios, orders } from '../../mock/data.js'

const router = useRouter()

// 产品线
const activeProduct = ref('P001')

// 视图状态
const viewMode = ref('summary') // 'summary' | 'detail'
const selectedUserName = ref('')
const selectedUserAccount = ref('')

// 汇总视图筛选
const dateRange = ref([])
const settlementStatusFilter = ref('')
const invoiceStatusFilter = ref('')

// 明细视图筛选
const detailSearchKeyword = ref('')
const detailDateRange = ref([])

// 产品切换
function handleProductChange(productId) {
  activeProduct.value = productId
  // 重置视图
  viewMode.value = 'summary'
  selectedUserName.value = ''
  selectedUserAccount.value = ''
}

// 服务类型映射
const serviceTypeMap = {
  '文档翻译': { apiModel: 'Nano-Banana-Pro', model: '2K' },
  '批量翻译': { apiModel: 'Gemini-2.5-Pro', model: '4K' },
  '实时翻译': { apiModel: 'GPT-4o-Realtime', model: '含音频' },
  '漫画生成': { apiModel: 'Sora-Image', model: '2K' },
  '视频生成': { apiModel: 'Veo-3.1-Fast-Preview', model: '4K' }
}

// 产品名称映射
const productNameMap = {
  'P001': '智马翻译',
  'P002': '智马漫影'
}

// 生成消费记录数据
const allConsumptionData = computed(() => {
  const currentProductName = productNameMap[activeProduct.value] || '智马翻译'
  
  return consumptionRecords.filter(cr => cr.productName === currentProductName).map((cr, index) => {
    const user = users.find(u => u.id === cr.userId)
    const tenant = tenants.find(t => t.name === cr.tenantName)
    
    // 从 featurePricing 获取价格
    const serviceType = cr.serviceType || '文档翻译'
    const mapping = serviceTypeMap[serviceType] || { apiModel: '-', model: '-' }
    const pricing = featurePricing.find(fp => 
      fp.apiModel === mapping.apiModel && fp.model === mapping.model
    ) || { listPrice: 0.1, costPrice: 0.06 }
    
    // 从 tenantTaskShareRatios 查找结算价
    const shareConfig = tenantTaskShareRatios.find(ts => 
      ts.tenantId === tenant?.id && ts.taskTypeName === serviceType
    ) || { settlePrice: pricing.listPrice * 0.2 }
    
    const consumePoints = cr.consumePoints || 0
    const listPrice = pricing.listPrice
    const costPrice = pricing.costPrice
    const settlePrice = shareConfig.settlePrice || (listPrice * 0.2)
    const saleAmount = consumePoints * listPrice
    const totalCost = consumePoints * costPrice
    
    // 判断客户来源
    const channelTenant = tenant && tenants.find(t => t.id === tenant.channelId && t.type === '运营方')
    const customerSource = channelTenant ? '运营方' : '直接客户'
    
    // 租户显示：个人用户显示用户名称，公司显示公司名称
    const isPersonal = !tenant || tenant.type === '个人用户' || tenant.type === '团队用户'
    const tenantDisplay = isPersonal ? (user?.name || '个人') : (tenant?.name || '个人')
    
    // 结算状态和开票状态
    const settlementStatus = index % 2 === 0 ? '已结算' : '待结算'
    const userOrders = orders.filter(o => o.userId === cr.userId && o.tenant === cr.tenantName)
    const latestOrder = userOrders.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime))[0]
    const invoiceStatus = latestOrder ? latestOrder.invoiceStatus : '未开票'
    
    return {
      ...cr,
      accountName: user?.account || cr.userAccount || '-',
      userName: user?.name || cr.userName || '-',
      tenant: tenantDisplay,
      customerSource,
      apiModel: mapping.apiModel,
      model: mapping.model,
      consumePoints,
      listPrice,
      costPrice,
      settlePrice,
      saleAmount: Math.round(saleAmount * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      settlementStatus,
      invoiceStatus,
      orderMonth: cr.createTime?.substring(0, 7) || ''
    }
  }).sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
})

// 筛选后的消费记录
const filteredConsumptions = computed(() => {
  let list = allConsumptionData.value
  
  // 日期筛选
  if (dateRange.value && dateRange.value.length === 2) {
    const start = new Date(dateRange.value[0]).getTime()
    const end = new Date(dateRange.value[1]).getTime()
    list = list.filter(cr => {
      const recordDate = new Date(cr.createTime).getTime()
      return recordDate >= start && recordDate <= end
    })
  }
  
  // 结算状态筛选
  if (settlementStatusFilter.value) {
    list = list.filter(cr => cr.settlementStatus === settlementStatusFilter.value)
  }
  
  // 开票状态筛选
  if (invoiceStatusFilter.value) {
    list = list.filter(cr => cr.invoiceStatus === invoiceStatusFilter.value)
  }
  
  return list
})

// 统计卡片数据
const statistics = computed(() => {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const todayRecords = filteredConsumptions.value.filter(cr => cr.id.includes(today))
  
  const todayCount = todayRecords.length
  const todayPoints = todayRecords.reduce((sum, cr) => sum + cr.consumePoints, 0)
  const totalCount = filteredConsumptions.value.length
  const totalPoints = filteredConsumptions.value.reduce((sum, cr) => sum + cr.consumePoints, 0)
  const totalSaleAmount = filteredConsumptions.value.reduce((sum, cr) => sum + (cr.saleAmount || 0), 0)
  const totalCostAmount = filteredConsumptions.value.reduce((sum, cr) => sum + (cr.totalCost || 0), 0)
  
  const unit = getUsageUnit(activeProduct.value)
  
  return [
    { label: '今日消费笔数', value: todayCount, class: '' },
    { label: `今日用量(${unit})`, value: todayPoints.toLocaleString(), class: 'points' },
    { label: '累计消费笔数', value: totalCount, class: '' },
    { label: `累计用量(${unit})`, value: totalPoints.toLocaleString(), class: 'points' },
    { label: '累计销售金额', value: '¥' + totalSaleAmount.toFixed(2), class: 'success' },
    { label: '累计成本', value: '¥' + totalCostAmount.toFixed(2), class: '' },
  ]
})

// 用户层级汇总
const userSummary = computed(() => {
  const map = new Map()
  filteredConsumptions.value.forEach(cr => {
    const key = cr.userId || cr.userAccount
    if (!map.has(key)) {
      map.set(key, {
        userId: cr.userId,
        accountName: cr.accountName,
        userName: cr.userName,
        tenant: cr.tenant,
        customerSource: cr.customerSource,
        count: 0,
        consumePoints: 0,
        saleAmount: 0,
        totalCost: 0,
        settlementStatus: cr.settlementStatus,
        invoiceStatus: cr.invoiceStatus,
      })
    }
    const item = map.get(key)
    item.count++
    item.consumePoints += cr.consumePoints
    item.saleAmount += cr.saleAmount || 0
    item.totalCost += cr.totalCost || 0
  })
  
  return Array.from(map.values()).sort((a, b) => b.consumePoints - a.consumePoints)
})

// 合计行
const userTotalRow = computed(() => {
  const total = userSummary.value.reduce((sum, item) => ({
    accountName: '合计',
    userName: '—',
    tenant: '—',
    customerSource: '—',
    count: sum.count + item.count,
    consumePoints: sum.consumePoints + item.consumePoints,
    saleAmount: sum.saleAmount + item.saleAmount,
    totalCost: sum.totalCost + item.totalCost,
    settlementStatus: '',
    invoiceStatus: '',
  }), { accountName: '合计', userName: '—', tenant: '—', customerSource: '—', count: 0, consumePoints: 0, saleAmount: 0, totalCost: 0, settlementStatus: '', invoiceStatus: '' })
  
  return total
})

// 当前选中用户的明细记录
const userTaskRecords = computed(() => {
  return filteredConsumptions.value.filter(cr => cr.userAccount === selectedUserAccount.value)
})

// 明细视图过滤
const filteredTaskRecords = computed(() => {
  let result = userTaskRecords.value
  
  // 日期筛选
  if (detailDateRange.value && detailDateRange.value.length === 2) {
    const start = new Date(detailDateRange.value[0]).getTime()
    const end = new Date(detailDateRange.value[1]).getTime()
    result = result.filter(cr => {
      const recordDate = new Date(cr.createTime).getTime()
      return recordDate >= start && recordDate <= end
    })
  }
  
  // 搜索
  if (detailSearchKeyword.value) {
    const kw = detailSearchKeyword.value.toLowerCase()
    result = result.filter(cr => 
      cr.id.toLowerCase().includes(kw) ||
      cr.businessName?.toLowerCase().includes(kw) ||
      cr.serviceType?.toLowerCase().includes(kw) ||
      cr.apiModel?.toLowerCase().includes(kw) ||
      cr.model?.toLowerCase().includes(kw)
    )
  }
  
  return result
})

// 用量单位映射
const usageUnitMap = {
  'P001': '点',
  'P002': '次',
  '默认': '点'
}

// 获取用量单位
function getUsageUnit(productId) {
  return usageUnitMap[productId] || usageUnitMap['默认']
}

// 汇总表格列
const summaryColumns = [
  { title: '账号', dataIndex: 'accountName', width: 140, fixed: 'left', ellipsis: true },
  { title: '用户名称', dataIndex: 'userName', width: 120, ellipsis: true },
  { title: '租户', dataIndex: 'tenant', width: 180, ellipsis: true },
  { title: '客户来源', slotName: 'customerSource', width: 100, align: 'center' },
  { title: '消费笔数', dataIndex: 'count', width: 100, align: 'right' },
  { title: '用量', dataIndex: 'consumePoints', width: 120, align: 'right', render: ({ record }) => `${record.consumePoints?.toLocaleString()} ${getUsageUnit(activeProduct.value)}` },
  { title: '销售金额合计', dataIndex: 'saleAmount', width: 140, align: 'right', render: ({ record }) => `¥${record.saleAmount?.toFixed(2)}` },
  { title: '采购成本合计', dataIndex: 'totalCost', width: 140, align: 'right', render: ({ record }) => `¥${record.totalCost?.toFixed(2)}` },
  { title: '结算状态', slotName: 'settlementStatus', width: 100, align: 'center' },
  { title: '开票状态', slotName: 'invoiceStatus', width: 100, align: 'center' },
  { title: '操作', slotName: 'actions', width: 80, fixed: 'right', align: 'center' },
]

// 明细表格列
const detailColumns = [
  { title: '流水号', slotName: 'id', width: 160, fixed: 'left' },
  { title: '消费时间', dataIndex: 'createTime', width: 170 },
  { title: '任务名称', dataIndex: 'businessName', width: 180, ellipsis: true },
  { title: '服务类型', dataIndex: 'serviceType', width: 100 },
  { title: 'API模型', dataIndex: 'apiModel', width: 180, ellipsis: true },
  { title: '型号', dataIndex: 'model', width: 120, align: 'center' },
  { title: '用量', dataIndex: 'consumePoints', width: 120, align: 'right', render: ({ record }) => `${record.consumePoints?.toLocaleString()} ${getUsageUnit(activeProduct.value)}` },
  { title: '刊例价', dataIndex: 'listPrice', width: 110, align: 'right', render: ({ record }) => `¥${record.listPrice?.toFixed(2)}/${getUsageUnit(activeProduct.value)}` },
  { title: '成本价', dataIndex: 'costPrice', width: 110, align: 'right', render: ({ record }) => `¥${record.costPrice?.toFixed(2)}/${getUsageUnit(activeProduct.value)}` },
  { title: '结算价', dataIndex: 'settlePrice', width: 110, align: 'right', render: ({ record }) => `¥${record.settlePrice?.toFixed(2)}/${getUsageUnit(activeProduct.value)}` },
  { title: '操作', slotName: 'actions', width: 80, fixed: 'right' },
]

// 视图切换方法
function viewUserDetail(record) {
  selectedUserName.value = record.userName
  selectedUserAccount.value = record.accountName
  viewMode.value = 'detail'
  detailDateRange.value = [...dateRange.value]
}

function backToSummary() {
  viewMode.value = 'summary'
  selectedUserName.value = ''
  selectedUserAccount.value = ''
  detailSearchKeyword.value = ''
  detailDateRange.value = []
}

// 筛选方法
function handleDateChange() {
  // 日期变化时自动筛选
}

function handleDetailSearch(value) {
  detailSearchKeyword.value = value || ''
}

function handleDetailDateChange() {
  // 日期筛选逻辑在 computed 中处理
}

function handleExport() {
  console.log('导出汇总数据', userSummary.value)
  Message.success(`将导出 ${userSummary.value.length} 条用户汇总记录`)
}

function handleDetailExport() {
  console.log('导出明细数据', filteredTaskRecords.value)
  Message.success(`将导出 ${filteredTaskRecords.value.length} 条明细记录`)
}

function goDetail(id) {
  router.push(`/order/consumption-record/${id}`)
}
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #f5f6f7;
  min-height: calc(100vh - 56px);
}

.stat-card {
  text-align: center;
  background: #fff;
  border-radius: 8px;
}

.stat-card :deep(.arco-card-body) {
  padding: 12px 8px;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-2);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
}

.stat-value.points {
  color: #f53f3f;
}

.stat-value.success {
  color: #00b42a;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.filter-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-right {
  display: flex;
  align-items: center;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.points-value {
  color: #f53f3f;
  font-weight: 500;
}

.mono-text {
  font-family: monospace;
  font-size: 13px;
}

/* 明细视图标题栏 */
.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
}
</style>
