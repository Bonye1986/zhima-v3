<template>
  <div class="page-container">
    <!-- 产品Tab -->
    <ProductTabs v-model="activeProduct" />

    <!-- 搜索栏 -->
    <SearchToolbar placeholder="搜索批次名称" @search="handleSearch">
      <template #extra>
        <a-select
          v-model="skuFilter"
          placeholder="归属SKU"
          style="width: 140px"
          allow-clear
          allow-search
        >
          <a-option v-for="s in currentSkuOptions" :key="s.code" :value="s.name">{{ s.name }}</a-option>
        </a-select>
        <a-select
          v-model="statusFilter"
          placeholder="状态"
          style="width: 120px"
          allow-clear
        >
          <a-option value="进行中">进行中</a-option>
          <a-option value="已兑完">已兑完</a-option>
          <a-option value="已过期">已过期</a-option>
          <a-option value="已下架">已下架</a-option>
        </a-select>
        <a-range-picker
          v-model="dateFilter"
          :placeholder="['开始', '结束']"
          style="width: 260px"
        />
      </template>
      <template #actions>
        <a-button @click="openExportRecords">
          <template #icon><icon-history /></template>
          导出记录
        </a-button>
        <a-button type="primary" @click="openGenerateModal">
          <template #icon><icon-plus /></template>
          生成兑换码
        </a-button>
      </template>
    </SearchToolbar>

    <!-- 批量操作栏 -->
    <BatchBar :selectedCount="selectedKeys.length" @cancel="selectedKeys = []">
      <template #actions>
        <a-button size="small" type="outline" @click="batchToggleStatus('已下架')">批量下架</a-button>
        <a-button size="small" type="outline" status="danger" @click="batchDelete">批量删除</a-button>
      </template>
    </BatchBar>

    <!-- 表格 -->
    <a-card :bordered="false" class="table-card">
      <a-table :columns="columns" :data="filteredList" :pagination="pagination" :row-selection="{ type: 'checkbox', showCheckedAll: true }" v-model:selectedKeys="selectedKeys" row-key="id" stripe :scroll="{ x: 1200 }">
        <template #status="{ record }">
          <a-tag :color="statusColorMap[record.status]" size="small">{{ record.status }}</a-tag>
        </template>
        <template #actions="{ record }">
          <div class="table-actions">
            <a-link @click="handleExport(record)">导出</a-link>
            <a-link @click="toggleStatus(record)">{{ record.status === '进行中' ? '下架' : '上架' }}</a-link>
            <a-link status="danger" @click="handleDelete(record)">删除</a-link>
            <a-link @click="openRedeemRecords(record)">兑换记录</a-link>
          </div>
        </template>
      </a-table>
    </a-card>

    <!-- 生成兑换码弹窗 -->
    <a-modal v-model:visible="generateModalVisible" title="生成兑换码" @ok="handleGenerate" :mask-closable="false" :width="520">
      <a-form :model="generateForm" layout="vertical">
        <a-form-item label="批次名称" required>
          <a-input v-model="generateForm.batchName" placeholder="请输入批次名称" />
        </a-form-item>
        <a-form-item label="所属产品">
          <a-input :model-value="currentProductName" disabled />
        </a-form-item>
        <a-form-item label="归属商品" required>
          <a-select v-model="generateForm.spuName" placeholder="请选择商品" @change="generateForm.skuName = ''">
            <a-option v-for="s in currentSpuList" :key="s.id" :value="s.name">{{ s.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="归属SKU（仅部分可见）" required>
          <a-select v-model="generateForm.skuName" placeholder="请选择SKU">
            <a-option v-for="s in partialSkus" :key="s.id" :value="s.name">{{ s.name }} ({{ s.code }})</a-option>
          </a-select>
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="生成数量" required>
              <a-input-number v-model="generateForm.count" :min="1" :max="50000" style="width:100%" placeholder="请输入生成数量" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="兑换码前缀">
              <a-input v-model="generateForm.prefix" placeholder="如 VIP" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="有效期" required>
          <a-range-picker v-model="generateForm.validPeriod" style="width:100%" />
        </a-form-item>
        <a-alert type="info">生成完成后将自动下载兑换码文件（CSV格式）。</a-alert>
      </a-form>
    </a-modal>

    <!-- 兑换记录抽屉 -->
    <a-drawer v-model:visible="recordDrawerVisible" title="兑换记录" :width="1200" :footer="false">
      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; gap: 12px;">
          <a-input-search
            v-model="recordSearchText"
            placeholder="搜索用户名/账号/手机号"
            style="width: 240px"
            allow-clear
          />
          <a-select v-model="recordFilter" placeholder="兑换结果" style="width: 120px" allow-clear>
            <a-option value="兑换成功">兑换成功</a-option>
            <a-option value="待兑换">待兑换</a-option>
          </a-select>
        </div>
        <a-button type="primary" @click="exportRecords">
          <template #icon><icon-download /></template>
          导出
        </a-button>
      </div>
      <a-table :columns="recordColumns" :data="filteredRecords" :pagination="recordPagination" row-key="seq" stripe size="small" :scroll="{ x: 1000 }">
        <template #result="{ record }">
          <a-tag :color="record.result === '兑换成功' ? 'green' : 'orange'" size="small">{{ record.result }}</a-tag>
        </template>
      </a-table>
    </a-drawer>

    <!-- 导出记录抽屉 -->
    <a-drawer v-model:visible="exportRecordDrawerVisible" title="导出记录" :width="1000" :footer="false">
      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; gap: 12px;">
          <a-input-search
            v-model="exportSearchText"
            placeholder="搜索批次名称/SKU名称"
            style="width: 240px"
            allow-clear
          />
          <a-select v-model="exportStatusFilter" placeholder="导出状态" style="width: 120px" allow-clear>
            <a-option value="成功">成功</a-option>
            <a-option value="失败">失败</a-option>
          </a-select>
        </div>
      </div>
      <a-table :columns="exportRecordColumns" :data="filteredExportRecords" :pagination="exportRecordPagination" row-key="id" stripe size="small">
        <template #status="{ record }">
          <a-tag :color="record.status === '成功' ? 'green' : 'red'" size="small">{{ record.status }}</a-tag>
        </template>
      </a-table>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus, IconDownload, IconHistory } from '@arco-design/web-vue/es/icon'
import { products, spuList, skuList, redeemCodes } from '../../mock/data.js'
import ProductTabs from '../../components/ProductTabs.vue'
import SearchToolbar from '../../components/SearchToolbar.vue'
import BatchBar from '../../components/BatchBar.vue'

const activeProduct = ref(products[0]?.id || 'P001')
const searchText = ref('')
const skuFilter = ref('')
const statusFilter = ref('')
const dateFilter = ref([])
const selectedKeys = ref([])
const generateModalVisible = ref(false)
const recordDrawerVisible = ref(false)
const exportRecordDrawerVisible = ref(false)
const recordFilter = ref('')
const recordSearchText = ref('')
const recordPagination = ref({ pageSize: 20, showTotal: true, showPageSize: true })
const exportRecordPagination = ref({ pageSize: 20, showTotal: true, showPageSize: true })
const exportStatusFilter = ref('')
const exportSearchText = ref('')

const tableData = ref(JSON.parse(JSON.stringify(redeemCodes)))

const statusColorMap = { '进行中': 'green', '已兑完': 'gray', '已过期': 'red', '已下架': 'orange' }

const pagination = ref({ pageSize: 20, showTotal: true, showPageSize: true })

const columns = [
  { title: '批次信息', dataIndex: 'batchName', width: 150 },
  { title: '批次ID', dataIndex: 'batchId', width: 150 },
  { title: '归属SKU', dataIndex: 'skuName', width: 130 },
  { title: 'SKU编码', dataIndex: 'skuCode', width: 120 },
  { title: '创建人', dataIndex: 'creator', width: 80 },
  { title: '创建时间', dataIndex: 'createTime', width: 180, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '生成总数', dataIndex: 'total', width: 90 },
  { title: '已兑换', dataIndex: 'redeemed', width: 80 },
  { title: '有效期', dataIndex: 'validPeriod', width: 220 },
  { title: '状态', slotName: 'status', width: 90 },
  { title: '操作', slotName: 'actions', width: 280, fixed: 'right' },
]

const filteredList = computed(() => {
  let list = tableData.value

  // 根据当前产品筛选
  if (activeProduct.value !== 'all') {
    const productSkus = skuList.filter(s => s.productId === activeProduct.value).map(s => s.code)
    list = list.filter(r => productSkus.includes(r.skuCode))
  }

  // 搜索批次名称
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(r => r.batchName.toLowerCase().includes(kw))
  }

  // 归属SKU筛选
  if (skuFilter.value) {
    list = list.filter(r => r.skuName === skuFilter.value)
  }

  // 状态筛选
  if (statusFilter.value) {
    list = list.filter(r => r.status === statusFilter.value)
  }

  // 创建时间筛选
  if (dateFilter.value && dateFilter.value.length === 2) {
    const startDate = new Date(dateFilter.value[0]).getTime()
    const endDate = new Date(dateFilter.value[1]).getTime()
    list = list.filter(r => {
      const createTime = new Date(r.createTime).getTime()
      return createTime >= startDate && createTime <= endDate
    })
  }

  return list
})

const currentProductName = computed(() => {
  if (activeProduct.value === 'all') return products[0]?.name || ''
  return products.find(p => p.id === activeProduct.value)?.name || ''
})

const currentSpuList = computed(() => {
  const pid = activeProduct.value === 'all' ? products[0]?.id : activeProduct.value
  return spuList.filter(s => s.productId === pid)
})

const currentSkuOptions = computed(() => {
  const pid = activeProduct.value === 'all' ? products[0]?.id : activeProduct.value
  return skuList.filter(s => s.productId === pid)
})

const partialSkus = computed(() => {
  // 先根据选择的商品筛选SKU，再筛选出适用范围为"部分可见"的
  let list = skuList.filter(s => s.visibility === '部分可见')
  if (generateForm.value.spuName) {
    list = list.filter(s => s.spu === generateForm.value.spuName)
  }
  return list
})

const generateForm = ref({ batchName: '', spuName: '', skuName: '', count: 100, prefix: '', validPeriod: [] })

// 监听产品切换，清除筛选条件
watch(activeProduct, () => {
  searchText.value = ''
  skuFilter.value = ''
  statusFilter.value = ''
  dateFilter.value = []
})

function handleSearch(value) {
  searchText.value = value || ''
}

function openGenerateModal() {
  generateForm.value = { batchName: '', spuName: '', skuName: '', count: 100, prefix: '', validPeriod: [] }
  generateModalVisible.value = true
}

function handleGenerate() {
  if (!generateForm.value.batchName) { Message.error('请输入批次名称'); return }
  if (!generateForm.value.skuName) { Message.error('请选择SKU'); return }
  const newBatch = {
    id: `RC${String(tableData.value.length + 1).padStart(3, '0')}`,
    batchName: generateForm.value.batchName,
    batchId: `BATCH${Date.now()}`,
    skuName: generateForm.value.skuName,
    skuCode: 'ZM-TR-NEW',
    createTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    total: generateForm.value.count,
    redeemed: 0,
    validPeriod: generateForm.value.validPeriod.join(' 至 '),
    status: '进行中',
  }
  tableData.value.unshift(newBatch)
  Message.success('生成成功，兑换码已下载')
  generateModalVisible.value = false
}

function handleExport(record) {
  Message.success(`批次「${record.batchName}」的兑换码已导出`)
}

function toggleStatus(record) {
  if (record.status === '进行中') {
    Modal.warning({
      title: '确认下架',
      content: '下架后用户将无法通过此批次码完成兑换，已发放但未领取的码将失效，是否继续？',
      hideCancel: false,
      onOk() {
        record.status = '已下架'
        Message.success('已下架')
      }
    })
  } else {
    record.status = '进行中'
    Message.success('已上架')
  }
}

function handleDelete(record) {
  Modal.warning({
    title: '确认删除',
    content: `确定要删除批次「${record.batchName}」吗？`,
    hideCancel: false,
    onOk() {
      tableData.value = tableData.value.filter(r => r.id !== record.id)
      Message.success('删除成功')
    }
  })
}

// 批量操作
function batchToggleStatus(status) {
  if (selectedKeys.value.length === 0) return
  let count = 0
  selectedKeys.value.forEach(key => {
    const item = tableData.value.find(r => r.id === key)
    if (item && item.status === '进行中') {
      item.status = status
      count++
    }
  })
  Message.success(`已下架 ${count} 个批次`)
  selectedKeys.value = []
}

function batchDelete() {
  if (selectedKeys.value.length === 0) {
    Message.warning('请选择要删除的记录')
    return
  }
  const toDelete = selectedKeys.value.slice()
  tableData.value = tableData.value.filter(r => !toDelete.includes(r.id))
  selectedKeys.value = []
  Message.success(`已删除 ${toDelete.length} 个批次`)
}

// 兑换记录
const mockRecords = [
  { seq: 1, code: 'VIP-A1B2C3', userName: '刘一', account: '13800001111', userId: 'U10001', phone: '13800001111', email: 'liu@test.com', result: '兑换成功', redeemTime: '2026-03-05 10:00:00' },
  { seq: 2, code: 'VIP-D4E5F6', userName: '陈二', account: '13800002222', userId: 'U10002', phone: '13800002222', email: 'chen@test.com', result: '兑换成功', redeemTime: '2026-03-06 14:00:00' },
  { seq: 3, code: 'VIP-G7H8I9', userName: '周三', account: '13800003333', userId: 'U10003', phone: '13800003333', email: 'zhou@test.com', result: '待兑换', redeemTime: '-' },
]

// 导出记录
const exportRecordsData = ref([
  { id: 1, operateTime: '2026-03-01 15:30:00', operatorId: 'ADMIN001', operatorName: '张三', batchName: '大客户促销A', batchId: 'BATCH20260301', spuName: '翻译点数包', skuName: '新客体验包', exportCount: 500, status: '成功' },
  { id: 2, operateTime: '2026-03-15 11:00:00', operatorId: 'ADMIN002', operatorName: '李四', batchName: '渠道推广B', batchId: 'BATCH20260315', spuName: '翻译点数包', skuName: '新客体验包', exportCount: 200, status: '成功' },
  { id: 3, operateTime: '2026-04-01 10:30:00', operatorId: 'ADMIN001', operatorName: '张三', batchName: '内部测试C', batchId: 'BATCH20260401', spuName: '翻译点数包', skuName: '300点套餐', exportCount: 50, status: '成功' },
  { id: 4, operateTime: '2026-04-10 14:20:00', operatorId: 'ADMIN003', operatorName: '王五', batchName: '失败测试', batchId: 'BATCH20260410', spuName: '翻译点数包', skuName: '测试套餐', exportCount: 0, status: '失败' },
])

const exportRecordColumns = computed(() => [
  { title: '操作时间', dataIndex: 'operateTime', width: 160, ellipsis: true, tooltip: true },
  { title: '操作人ID', dataIndex: 'operatorId', width: 100, ellipsis: true, tooltip: true },
  { title: '操作人', dataIndex: 'operatorName', width: 100, ellipsis: true, tooltip: true },
  { title: '批次名称', dataIndex: 'batchName', width: 110, ellipsis: true, tooltip: true },
  { title: '码批次ID', dataIndex: 'batchId', width: 140, ellipsis: true, tooltip: true },
  { title: '商品名称', dataIndex: 'spuName', width: 110, ellipsis: true, tooltip: true },
  { title: 'SKU名称', dataIndex: 'skuName', width: 110, ellipsis: true, tooltip: true },
  { title: '导出数量', dataIndex: 'exportCount', width: 80, ellipsis: true },
  { title: '导出状态', slotName: 'status', dataIndex: 'status', width: 90, ellipsis: true },
])

const filteredExportRecords = computed(() => {
  let list = [...exportRecordsData.value]
  
  // 搜索过滤
  if (exportSearchText.value) {
    const keyword = exportSearchText.value.toLowerCase()
    list = list.filter(r => 
      r.batchName?.toLowerCase().includes(keyword) ||
      r.skuName?.toLowerCase().includes(keyword) ||
      r.spuName?.toLowerCase().includes(keyword)
    )
  }
  
  // 根据导出状态筛选
  if (exportStatusFilter.value) {
    list = list.filter(r => r.status === exportStatusFilter.value)
  }
  
  return list
})

const filteredRecords = computed(() => {
  let list = [...mockRecords]
  
  // 搜索过滤
  if (recordSearchText.value) {
    const kw = recordSearchText.value.toLowerCase()
    list = list.filter(r => 
      r.userName.toLowerCase().includes(kw) || 
      r.account.toLowerCase().includes(kw) || 
      r.phone.toLowerCase().includes(kw)
    )
  }
  
  // 结果过滤
  if (recordFilter.value) {
    list = list.filter(r => r.result === recordFilter.value)
  }
  
  return list
})

const recordColumns = [
  { title: '序号', dataIndex: 'seq', width: 50 },
  { title: 'Code', dataIndex: 'code', width: 100 },
  { title: '用户名', dataIndex: 'userName', width: 80 },
  { title: '账号', dataIndex: 'account', width: 120 },
  { title: 'ID', dataIndex: 'userId', width: 80 },
  { title: '手机号', dataIndex: 'phone', width: 110 },
  { title: '邮箱', dataIndex: 'email', width: 160 },
  { title: '兑换结果', slotName: 'result', width: 80 },
  { title: '兑换时间', dataIndex: 'redeemTime', width: 160 },
]

function openRedeemRecords(record) {
  recordDrawerVisible.value = true
}

function openExportRecords() {
  exportRecordDrawerVisible.value = true
}

function exportRecords() {
  Message.success('兑换记录已导出')
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

/* 操作列按钮不换行 */
:deep(.arco-table-cell-actions) {
  white-space: nowrap;
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

.table-card {
  border-radius: 4px;
}
</style>
