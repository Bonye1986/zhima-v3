<template>
  <div class="page-container">
    <!-- 产品线Tab -->
    <ProductTabs v-model="activeProduct" @change="handleProductChange" />

    <!-- 搜索栏 -->
    <SearchToolbar placeholder="搜索订单号/客户名/收款编号" @search="handleSearch">
      <template #extra>
        <a-range-picker v-model="dateFilter" :placeholder="['开始', '结束']" style="width: 240px;" />
      </template>
      <template #actions>
        <a-button @click="handleExport">
          <template #icon><icon-download /></template>
          导出
        </a-button>
      </template>
    </SearchToolbar>

    <!-- Tab和列表合并 -->
    <PageCard>
      <a-tabs v-model="activeTab" type="line">
        <a-tab-pane key="pending" title="待确认收款">
          <!-- 批量操作栏 -->
          <BatchBar :selectedCount="selectedPending.length" @cancel="selectedPending = []">
            <template #actions>
              <a-button size="small" type="outline" @click="batchConfirm">批量确认</a-button>
            </template>
          </BatchBar>
          <a-table
            :columns="pendingColumns"
            :data="filteredPending"
            :pagination="{ pageSize: 20, showTotal: true, showPageSize: true }"
            :row-selection="{ type: 'checkbox', showCheckedAll: true }"
            :scroll="{ x: 1200 }"
            @selection-change="(keys) => selectedPending = keys"
            row-key="orderId"
            stripe
          >
            <template #orderId="{ record }">
              <a-link @click="Message.info('跳转订单：' + record.orderId)">{{ record.orderId }}</a-link>
            </template>
            <template #amount="{ record }">¥{{ record.amount.toFixed(2) }}</template>
            <template #discountAmount="{ record }">{{ record.discountAmount ? `¥${record.discountAmount.toFixed(2)}` : '—' }}</template>
            <template #actualAmount="{ record }">¥{{ record.actualAmount?.toFixed(2) || record.amount.toFixed(2) }}</template>
            <template #voucher="{ record }">
              <a-image :src="record.voucher" width="40" height="40" fit="cover" style="border-radius:4px;cursor:pointer;" />
            </template>
            <template #actions="{ record }">
              <div class="table-actions">
                <a-link status="success" @click="openConfirmModal(record)">确认到账</a-link>
                <a-link status="danger" @click="openRejectModal(record)">驳回</a-link>
                <a-link v-if="record.type === '购买订单'" @click="openOrderDetail(record)">查看订单</a-link>
                <a-link v-if="record.type === '充值订单'" @click="openRechargeDetail(record)">查看充值</a-link>
              </div>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="records" title="收款记录">
          <a-table
            :columns="recordColumns"
            :data="filteredRecords"
            :pagination="{ pageSize: 20, showTotal: true, showPageSize: true }"
            :scroll="{ x: 1200 }"
            row-key="receiptNo"
            stripe
          >
            <template #amount="{ record }">¥{{ record.amount?.toFixed(2) || record.originalPrice?.toFixed(2) }}</template>
            <template #discountAmount="{ record }">{{ record.discountAmount ? `¥${record.discountAmount.toFixed(2)}` : '—' }}</template>
            <template #actualAmount="{ record }">¥{{ record.actualAmount?.toFixed(2) || record.amount?.toFixed(2) }}</template>
            <template #actions="{ record }">
              <div class="table-actions">
                <a-link @click="openReceiptDetail(record)">详情</a-link>
              </div>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </PageCard>

    <!-- 确认到账弹窗 -->
    <a-modal v-model:visible="confirmModalVisible" title="确认到账" @ok="handleConfirm" :mask-closable="false" width="600px">
      <a-descriptions :column="2" bordered size="small" style="margin-bottom: 20px;">
        <a-descriptions-item label="订单号" :span="2">{{ currentRecord?.orderId }}</a-descriptions-item>
        <a-descriptions-item label="客户/租户">{{ currentRecord?.customer }}</a-descriptions-item>
        <a-descriptions-item label="归属产品">{{ currentRecord?.productName }}</a-descriptions-item>
        <a-descriptions-item label="业务类型">{{ currentRecord?.goodsName || '—' }}</a-descriptions-item>
        <a-descriptions-item label="权益值">{{ currentRecord?.points || '—' }}</a-descriptions-item>
        <a-descriptions-item label="订单金额">¥{{ currentRecord?.originalPrice?.toFixed(2) || currentRecord?.amount?.toFixed(2) }}</a-descriptions-item>
        <a-descriptions-item label="优惠金额">{{ currentRecord?.discountAmount ? `¥${Number(currentRecord.discountAmount).toFixed(2)}` : '—' }}</a-descriptions-item>
        <a-descriptions-item label="实付金额">¥{{ currentRecord?.actualAmount?.toFixed(2) || currentRecord?.amount?.toFixed(2) }}</a-descriptions-item>
        <a-descriptions-item label="支付方式" :span="2">{{ currentRecord?.payMethod || '银行转账' }}</a-descriptions-item>
      </a-descriptions>

      <a-form :model="confirmForm" layout="vertical">
        <a-form-item label="实际到账金额（元）" required>
          <a-input-number v-model="confirmForm.actualAmount" :min="0" :precision="2" placeholder="请输入实际到账金额" style="width:100%" />
        </a-form-item>
        <a-form-item label="到账日期" required>
          <a-date-picker v-model="confirmForm.arrivalDate" placeholder="请选择到账日期" style="width:100%" />
        </a-form-item>
        <a-form-item label="收款银行账户" required>
          <a-select v-model="confirmForm.bankAccount" placeholder="请选择收款银行账户">
            <a-option :value="unionBankAccount">{{ unionBankAccount }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model="confirmForm.remark" placeholder="请输入备注（可选）" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 驳回弹窗 -->
    <a-modal v-model:visible="rejectModalVisible" title="驳回收款" @ok="handleReject" :mask-closable="false" width="400px">
      <a-form :model="rejectForm" layout="vertical">
        <a-form-item label="驳回原因" required>
          <a-radio-group v-model="rejectForm.reason" direction="vertical">
            <a-radio value="转账金额不符">转账金额不符</a-radio>
            <a-radio value="转账凭证模糊">转账凭证模糊</a-radio>
            <a-radio value="付款账户信息不匹配">付款账户信息不匹配</a-radio>
            <a-radio value="其他">其他</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item v-if="rejectForm.reason === '其他'" label="自定义原因" required>
          <a-textarea v-model="rejectForm.customReason" placeholder="请输入驳回原因" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 订单/充值详情弹窗 -->
    <a-modal v-model:visible="orderDetailVisible" :title="currentRecord?.type === '充值订单' ? '充值订单详情' : '订单详情'" :footer="false" width="600px">
      <a-descriptions :column="2" bordered size="small">
        <a-descriptions-item label="订单号" :span="2">{{ currentRecord?.orderId }}</a-descriptions-item>
        <a-descriptions-item label="订单状态"><a-tag :color="getStatusColor(currentRecord?.orderStatus || '待确认收款')" size="small">{{ currentRecord?.orderStatus || '待确认收款' }}</a-tag></a-descriptions-item>
        <a-descriptions-item label="租户">{{ currentRecord?.customer }}</a-descriptions-item>
        <a-descriptions-item label="业务类型">{{ currentRecord?.goodsName || '—' }}</a-descriptions-item>
        <a-descriptions-item label="权益值">{{ currentRecord?.points || '—' }}</a-descriptions-item>
        <a-descriptions-item v-if="currentRecord?.type !== '充值订单'" label="到账权益值">{{ currentRecord?.receivedPoints || '—' }}</a-descriptions-item>
        <a-descriptions-item label="订单金额">¥{{ currentRecord?.originalPrice?.toFixed(2) || currentRecord?.amount?.toFixed(2) }}</a-descriptions-item>
        <a-descriptions-item label="优惠金额">{{ currentRecord?.discountAmount !== undefined && currentRecord?.discountAmount !== null ? `¥${Number(currentRecord.discountAmount).toFixed(2)}` : '—' }}</a-descriptions-item>
        <a-descriptions-item label="实付金额">¥{{ currentRecord?.actualAmount !== undefined && currentRecord?.actualAmount !== null ? Number(currentRecord.actualAmount).toFixed(2) : Number(currentRecord?.amount || 0).toFixed(2) }}</a-descriptions-item>
        <a-descriptions-item label="支付方式">{{ currentRecord?.payMethod || '—' }}</a-descriptions-item>
        <a-descriptions-item label="付款账户">{{ currentRecord?.payAccount || '—' }}</a-descriptions-item>
        <a-descriptions-item label="提交时间">{{ currentRecord?.submitTime }}</a-descriptions-item>
        <a-descriptions-item label="交易单号" :span="2">{{ currentRecord?.transactionId || '—' }}</a-descriptions-item>
        <a-descriptions-item label="转账凭证" :span="2">
          <a-image v-if="currentRecord?.voucher" :src="currentRecord?.voucher" width="200" height="200" fit="cover" style="border-radius:4px;" />
          <span v-else>—</span>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>

    <!-- 收款详情弹窗 -->
    <a-modal v-model:visible="receiptDetailVisible" title="收款详情" :footer="false" width="500px">
      <div class="detail-content">
        <div class="detail-item">
          <span class="detail-label">收款编号：</span>
          <span class="detail-value">{{ currentRecord?.receiptNo }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">关联订单号：</span>
          <span class="detail-value">{{ currentRecord?.orderId }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">归属产品：</span>
          <span class="detail-value">{{ currentRecord?.productName }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">客户名称：</span>
          <span class="detail-value">{{ currentRecord?.customer }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">收款金额：</span>
          <span class="detail-value" style="color: #00b42a; font-weight: 500;">¥{{ currentRecord?.amount?.toFixed(2) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">支付方式：</span>
          <span class="detail-value">{{ currentRecord?.payMethod }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">收款银行账户：</span>
          <span class="detail-value">{{ currentRecord?.bankAccount }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">到账时间：</span>
          <span class="detail-value">{{ currentRecord?.arrivalTime }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">确认方式：</span>
          <span class="detail-value">{{ currentRecord?.confirmType }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">操作人：</span>
          <span class="detail-value">{{ currentRecord?.operator }}</span>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconDownload } from '@arco-design/web-vue/es/icon'
import ProductTabs from '../../components/ProductTabs.vue'
import SearchToolbar from '../../components/SearchToolbar.vue'
import BatchBar from '../../components/BatchBar.vue'
import PageCard from '../../components/PageCard.vue'

const activeProduct = ref('P001')
const activeTab = ref('pending')

function handleProductChange(productId) {
  activeProduct.value = productId
  Message.info(`切换到产品线: ${productId}`)
}

const searchText = ref('')
const dateFilter = ref([])

const selectedPending = ref([])
const confirmModalVisible = ref(false)
const rejectModalVisible = ref(false)
const orderDetailVisible = ref(false)
const receiptDetailVisible = ref(false)
const currentRecord = ref({})

const unionBankAccount = ref('长沙市智音视界科技有限公司 - 招商银行 **** 1234')

const pendingList = ref([
  { orderId: 'ZM20260410003', productId: 'P001', productName: '智马翻译', customer: '吴四', amount: 349.00, orderStatus: '待确认收款', voucher: 'https://via.placeholder.com/100x100/E8F0FE/165DFF?text=凭证', payAccount: '工行 **** 4444', submitTime: '2026-04-18 09:15:00', goodsName: '翻译点数包', goodsType: '点数包', points: '2000点', receivedPoints: '2000点', tenant: '星辰教育', originalPrice: 399.00, discountAmount: 50.00, actualAmount: 349.00, shareAmount: '—', payMethod: '对公转账', transactionId: '', type: '购买订单' },
  { orderId: 'ZM20260415004', productId: 'P001', productName: '智马翻译', customer: '周三', amount: 199.00, orderStatus: '待确认收款', voucher: 'https://via.placeholder.com/100x100/E8F0FE/165DFF?text=凭证', payAccount: '招行 **** 3333', submitTime: '2026-04-17 16:00:00', goodsName: '生成次数包', goodsType: '次数包', points: '100次', receivedPoints: '100次', tenant: '个人', originalPrice: 199.00, discountAmount: 0, actualAmount: 199.00, shareAmount: '—', payMethod: '对公转账', transactionId: '', type: '购买订单' },
  { orderId: 'ZM20260420006', productId: 'P001', productName: '智马翻译', customer: '马投科技', amount: 2700.00, orderStatus: '待确认收款', voucher: 'https://via.placeholder.com/100x100/E8F0FE/165DFF?text=凭证', payAccount: '建行 **** 8888', submitTime: '2026-04-20 16:00:00', goodsName: '权益充值', goodsType: '充值', points: '30000点', receivedPoints: '—', tenant: '马投科技', originalPrice: 3000.00, discountAmount: 300.00, actualAmount: 2700.00, shareAmount: '—', payMethod: '对公转账', transactionId: '', type: '充值订单' },
])

const receiptRecords = ref([
  { receiptNo: 'REC20260410003', productId: 'P001', orderId: 'ZM20260410003', productName: '智马翻译', customer: '吴四', amount: 349.00, payMethod: '对公转账', bankAccount: '工商银行 **** 5678', arrivalTime: '2026-04-10 15:00:00', confirmType: '手动', operator: '张三', goodsName: '翻译点数包', goodsType: '点数包', points: '2000点', receivedPoints: '2000点', tenant: '星辰教育', originalPrice: 399.00, discountAmount: 50.00, actualAmount: 349.00, shareAmount: '—', transactionId: 'BANK20260410091500003', voucher: 'https://via.placeholder.com/100x100/E8F0FE/165DFF?text=凭证', payAccount: '工行 **** 4444' },
  { receiptNo: 'REC20260415004', productId: 'P001', orderId: 'ZM20260415004', productName: '智马翻译', customer: '周三', amount: 199.00, payMethod: '对公转账', bankAccount: '招商银行 **** 1234', arrivalTime: '2026-04-17 16:05:00', confirmType: '手动', operator: '张三', goodsName: '生成次数包', goodsType: '次数包', points: '100次', receivedPoints: '100次', tenant: '个人', originalPrice: 199.00, discountAmount: 0, actualAmount: 199.00, shareAmount: '—', transactionId: 'BANK20260417160500002', voucher: 'https://via.placeholder.com/100x100/E8F0FE/165DFF?text=凭证', payAccount: '招行 **** 3333' },
  { receiptNo: 'REC20260420006', productId: 'P001', orderId: 'ZM20260420006', productName: '智马翻译', customer: '马投科技', amount: 2700.00, payMethod: '对公转账', bankAccount: '建设银行 **** 9012', arrivalTime: '2026-04-20 16:05:00', confirmType: '手动', operator: '张三', goodsName: '权益充值', goodsType: '充值', points: '30000点', receivedPoints: '30000点', tenant: '马投科技', originalPrice: 3000.00, discountAmount: 300.00, actualAmount: 2700.00, shareAmount: '—', transactionId: 'BANK20260420160500004', voucher: 'https://via.placeholder.com/100x100/E8F0FE/165DFF?text=凭证', payAccount: '建行 **** 8888' },
])

const pendingColumns = [
  { title: '订单号', slotName: 'orderId', width: 180, ellipsis: true, tooltip: true },
  { title: '租户', dataIndex: 'customer', width: 120, ellipsis: true, tooltip: true },
  { title: '订单金额', slotName: 'amount', width: 100 },
  { title: '优惠金额', slotName: 'discountAmount', width: 100 },
  { title: '实付金额', slotName: 'actualAmount', width: 100 },
  { title: '转账凭证', slotName: 'voucher', width: 90 },
  { title: '付款账户', dataIndex: 'payAccount', width: 140, ellipsis: true, tooltip: true },
  { title: '提交时间', dataIndex: 'submitTime', width: 170, ellipsis: true, tooltip: true },
  { title: '操作', slotName: 'actions', width: 200, fixed: 'right' },
]

const recordColumns = [
  { title: '收款编号', dataIndex: 'receiptNo', width: 170, ellipsis: true, tooltip: true },
  { title: '关联订单号', dataIndex: 'orderId', width: 170, ellipsis: true, tooltip: true },
  { title: '租户', dataIndex: 'customer', width: 120, ellipsis: true, tooltip: true },
  { title: '订单金额', slotName: 'amount', width: 100 },
  { title: '优惠金额', slotName: 'discountAmount', width: 100 },
  { title: '实付金额', slotName: 'actualAmount', width: 100 },
  { title: '到账时间', dataIndex: 'arrivalTime', width: 170, ellipsis: true, tooltip: true },
  { title: '确认方式', dataIndex: 'confirmType', width: 90 },
  { title: '操作人', dataIndex: 'operator', width: 100 },
  { title: '操作', slotName: 'actions', width: 80, fixed: 'right' },
]

const filteredPending = computed(() => {
  let list = pendingList.value.filter(item => item.productId === activeProduct.value)
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(item => item.orderId.toLowerCase().includes(kw) || item.customer.toLowerCase().includes(kw))
  }
  if (dateFilter.value && dateFilter.value.length === 2) {
    const start = new Date(dateFilter.value[0]).getTime()
    const end = new Date(dateFilter.value[1]).getTime()
    list = list.filter(item => {
      const t = new Date(item.submitTime).getTime()
      return t >= start && t <= end
    })
  }
  return list
})

const filteredRecords = computed(() => {
  let list = receiptRecords.value.filter(item => item.productId === activeProduct.value)
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(item => item.receiptNo.toLowerCase().includes(kw) || item.orderId.toLowerCase().includes(kw))
  }
  if (dateFilter.value && dateFilter.value.length === 2) {
    const start = new Date(dateFilter.value[0]).getTime()
    const end = new Date(dateFilter.value[1]).getTime()
    list = list.filter(item => {
      const t = new Date(item.arrivalTime).getTime()
      return t >= start && t <= end
    })
  }
  return list
})

function handleSearch() {}

function handleExport() {
  Message.success('导出成功')
}

function getStatusColor(status) {
  const map = {
    '待确认收款': 'purple',
    '待支付': 'orange',
    '已支付': 'blue',
    '待生效': 'blue',
    '生效中': 'arcoblue',
    '已完成': 'green',
    '已关闭': 'gray',
    '退款中': 'gold',
    '退款成功': 'red',
    '退款异常': 'magenta'
  }
  return map[status] || 'gray'
}

function openConfirmModal(record) {
  currentRecord.value = record
  confirmModalVisible.value = true
}

function openRejectModal(record) {
  currentRecord.value = record
  rejectModalVisible.value = true
}

function openOrderDetail(record) {
  currentRecord.value = record
  orderDetailVisible.value = true
}

function openRechargeDetail(record) {
  currentRecord.value = record
  orderDetailVisible.value = true
}

function openReceiptDetail(record) {
  currentRecord.value = record
  receiptDetailVisible.value = true
}

const confirmForm = ref({
  actualAmount: null,
  arrivalDate: '',
  bankAccount: '',
  remark: ''
})

const rejectForm = ref({
  reason: '',
  customReason: ''
})

function handleConfirm() {
  if (!confirmForm.value.actualAmount) {
    Message.error('请输入实际到账金额')
    return
  }
  if (!confirmForm.value.arrivalDate) {
    Message.error('请选择到账日期')
    return
  }
  if (!confirmForm.value.bankAccount) {
    Message.error('请选择收款银行账户')
    return
  }
  Message.success('确认到账成功')
  confirmModalVisible.value = false
  pendingList.value = pendingList.value.filter(item => item.orderId !== currentRecord.value.orderId)
  receiptRecords.value.unshift({
    receiptNo: 'REC' + Date.now(),
    productId: currentRecord.value.productId,
    orderId: currentRecord.value.orderId,
    productName: currentRecord.value.productName,
    customer: currentRecord.value.customer,
    amount: confirmForm.value.actualAmount,
    payMethod: '银行转账',
    bankAccount: confirmForm.value.bankAccount,
    arrivalTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    confirmType: '手动',
    operator: '当前用户'
  })
  confirmForm.value = { actualAmount: null, arrivalDate: '', bankAccount: '', remark: '' }
}

function handleReject() {
  if (!rejectForm.value.reason) {
    Message.error('请选择驳回原因')
    return
  }
  if (rejectForm.value.reason === '其他' && !rejectForm.value.customReason) {
    Message.error('请输入自定义原因')
    return
  }
  Message.success('驳回成功')
  rejectModalVisible.value = false
  pendingList.value = pendingList.value.filter(item => item.orderId !== currentRecord.value.orderId)
  rejectForm.value = { reason: '', customReason: '' }
}

function batchConfirm() {
  Message.success(`批量确认 ${selectedPending.value.length} 条记录`)
  selectedPending.value = []
}
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #f5f6f7;
  min-height: calc(100vh - 56px);
}

:deep(.arco-table-th) {
  background: #fafafa;
  font-weight: 500;
}

:deep(.arco-table-th:hover) {
  background: #f5f5f5;
}

:deep(.arco-tabs-nav) {
  margin-bottom: 16px;
}

.table-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
  flex-wrap: nowrap;
}

.table-actions :deep(.arco-link) {
  white-space: nowrap;
  flex-shrink: 0;
  font-size: 13px;
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
  margin-bottom: 12px;
  line-height: 22px;
}

.detail-label {
  color: #86909c;
  width: 100px;
  flex-shrink: 0;
}

.detail-value {
  color: #1d2129;
  flex: 1;
}
</style>
