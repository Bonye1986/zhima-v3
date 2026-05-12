<template>
  <div class="page-container">
    <ErrorBar :message="errorMsg" />

    <ProductTabs v-model="activeProduct" @change="handleProductChange" />

    <SearchToolbar placeholder="搜索租户名称" @search="handleSearch">
      <template #extra>
        <a-select
          v-model="filterType"
          placeholder="租户类型"
          allow-clear
          style="width: 140px"
          @change="handleSearch"
        >
          <a-option value="运营方">运营方</a-option>
          <a-option value="团队用户">团队用户</a-option>
          <a-option value="大客户">大客户</a-option>
        </a-select>
        <a-select
          v-model="filterSettlement"
          placeholder="结算方式"
          allow-clear
          style="width: 120px"
          @change="handleSearch"
        >
          <a-option value="预充权益">预充权益</a-option>
          <a-option value="自行购买">自行购买</a-option>
          <a-option value="按量计费">按量计费</a-option>
        </a-select>
        <a-select
          v-model="filterStatus"
          placeholder="状态"
          allow-clear
          style="width: 100px"
          @change="handleSearch"
        >
          <a-option :value="true">启用</a-option>
          <a-option :value="false">禁用</a-option>
        </a-select>
        <a-select
          v-model="filterChannelId"
          placeholder="渠道来源"
          allow-clear
          style="width: 140px"
          @change="handleSearch"
        >
          <a-option value="">全部</a-option>
          <a-option value="__none__">自然注册</a-option>
          <a-option v-for="ch in channelOptions" :key="ch.id" :value="ch.id">{{ ch.name }}</a-option>
        </a-select>
        <a-range-picker
          v-model="filterDateRange"
          :placeholder="['开始', '结束']"
          style="width: 260px"
          @change="handleSearch"
        />
      </template>
      <template #actions>
        <a-button type="primary" @click="goCreate">
          <template #icon><icon-plus /></template>
          创建租户
        </a-button>
        <a-button @click="handleExport">
          <template #icon><icon-download /></template>
          导出
        </a-button>
      </template>
    </SearchToolbar>

    <BatchBar :selectedCount="selectedKeys.length" @cancel="selectedKeys = []">
      <template #actions>
        <a-button size="small" type="outline" @click="batchToggle(true)">批量启用</a-button>
        <a-button size="small" type="outline" @click="batchToggle(false)">批量禁用</a-button>
        <a-button size="small" type="outline" status="danger" @click="batchDelete">批量删除</a-button>
      </template>
    </BatchBar>

    <PageCard>
      <a-table
        :columns="columns"
        :data="filteredList"
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
        v-model:selectedKeys="selectedKeys"
        :pagination="pagination"
        :scroll="{ x: 1800 }"
        row-key="id"
        stripe
      >
        <template #type="{ record }">
          <a-tag :color="getTypeColor(record.type)" size="small">{{ record.type }}</a-tag>
        </template>
        <template #channelId="{ record }">
          <a-tag v-if="record.channelId" color="orange" size="small">{{ getChannelName(record.channelId) }}</a-tag>
          <span v-else class="text-gray">—</span>
        </template>
        <template #totalSpend="{ record }">
          ¥{{ record.totalSpend?.toLocaleString() }}
        </template>
        <template #shareRatio="{ record }">
          {{ record.shareRatio }}%
        </template>
        <template #balance="{ record }">
          {{ record.balance?.toLocaleString() }} {{ getProductUnit(record.productId) }}
        </template>
        <template #sso="{ record }">
          <a-tag :color="record.sso ? 'green' : 'gray'">{{ record.sso ? '是' : '否' }}</a-tag>
        </template>
        <template #channelTag="{ record }">
          {{ record.channelTag || '-' }}
        </template>
        <template #cycle="{ record }">
          <span v-if="record.cycle">
            {{ record.cycle }}
            <span v-if="record.settlementDay" style="color: #86909c; font-size: 12px;">
              ({{ record.cycle === '年结' ? record.settlementDay + '月' : record.settlementDay + '日' }})
            </span>
          </span>
          <span v-else>-</span>
        </template>
        <template #expireTime="{ record }">
          {{ record.expireTime || '-' }}
        </template>
        <template #status="{ record }">
          <a-switch
            v-model="record.status"
            :before-change="() => confirmToggle(record)"
            checked-text="启用"
            unchecked-text="禁用"
          />
        </template>
        <template #actions="{ record }">
          <div class="table-actions">
            <a-button type="text" size="small" @click="goDetail(record)">详情</a-button>
            <a-button type="text" size="small" @click="goEdit(record)">编辑</a-button>
            <a-button type="text" size="small" @click="openSettlementModal(record)">
              {{ record.settlement === '按量计费' ? '结算' : '充值' }}
            </a-button>
            <a-popconfirm
              content="确定要删除该租户吗？"
              type="warning"
              @ok="handleDelete(record)"
            >
              <a-button type="text" size="small" status="danger">删除</a-button>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
    </PageCard>

    <!-- 创建租户弹窗 -->
    <a-modal
      v-model:visible="createModalVisible"
      title="创建租户"
      :width="640"
      :ok-text="'创建'"
      @ok="handleCreateSubmit"
      @cancel="createModalVisible = false"
    >
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="租户名称" field="name" required>
              <a-input v-model="formData.name" placeholder="请输入租户名称" />
            </a-form-item>
            <a-form-item label="租户类型" field="type" required>
              <a-select v-model="formData.type" placeholder="请选择租户类型" @change="handleTypeChange">
                <a-option value="团队用户">团队用户</a-option>
                <a-option value="运营方">运营方</a-option>
                <a-option value="大客户">大客户</a-option>
              </a-select>
            </a-form-item>
            <a-form-item label="扣费方式" field="deductionMethod" required>
              <a-select v-model="formData.deductionMethod" placeholder="请选择扣费方式">
                <a-option value="先扣费">先扣费</a-option>
                <a-option value="导出后扣费">导出后扣费</a-option>
              </a-select>
            </a-form-item>
            <a-form-item label="结算方式" field="settlement">
              <a-select v-model="formData.settlement" placeholder="请选择结算方式">
                <a-option value="预充权益">预充权益</a-option>
                <a-option value="自行购买">自行购买</a-option>
                <a-option v-if="formData.type === '团队用户'" value="按量计费">按量计费</a-option>
              </a-select>
            </a-form-item>
            <a-form-item v-if="formData.settlement === '按量计费'" label="结算周期" field="cycle">
              <a-select v-model="formData.cycle" placeholder="请选择结算周期">
                <a-option value="">请选择</a-option>
                <a-option value="月结">月结</a-option>
                <a-option value="季结">季结</a-option>
                <a-option value="年结">年结</a-option>
              </a-select>
            </a-form-item>
            <a-form-item v-if="formData.cycle" :label="formData.cycle === '月结' ? '结算日' : (formData.cycle === '季结' ? '季度结算日' : '年度结算月')" field="settlementDay">
              <a-input-number v-model="formData.settlementDay" :min="1" :max="formData.cycle === '年结' ? 12 : 31" :placeholder="formData.cycle === '月结' ? '每月几号结算' : (formData.cycle === '季结' ? '每季度第几天结算(1-31)' : '每年第几月结算(1-12)')" style="width: 100%" />
            </a-form-item>
            <a-form-item v-if="formData.type === '运营方'" label="分成比例" field="shareRatio">
              <a-input-number v-model="formData.shareRatio" :min="0" :max="100" suffix="%" style="width: 100%" placeholder="请输入分成比例" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="过期时间" field="expireTime">
              <a-date-picker v-model="formData.expireTime" placeholder="请选择过期时间" style="width: 100%" />
            </a-form-item>
            <a-form-item label="发票抬头" field="invoiceTitle">
              <a-input v-model="formData.invoiceTitle" placeholder="请输入发票抬头" />
            </a-form-item>
            <a-form-item label="发票税号" field="invoiceTaxNo">
              <a-input v-model="formData.invoiceTaxNo" placeholder="请输入发票税号" />
            </a-form-item>
            <a-form-item label="预扣额度上限" field="preDeductLimit">
              <a-input-number v-model="formData.preDeductLimit" :min="0" :step="1000" placeholder="请输入预扣额度上限" style="width: 100%" />
            </a-form-item>
            <a-form-item v-if="formData.type === '运营方'" label="渠道标识" field="channelTag">
              <a-input v-model="formData.channelTag" placeholder="请输入渠道标识" />
            </a-form-item>
            <a-form-item v-if="formData.type && formData.type !== '运营方'" label="渠道来源" field="channelId">
              <a-select v-model="formData.channelId" placeholder="请选择渠道来源（可选）" allow-clear>
                <a-option v-for="ch in channelOptions" :key="ch.id" :value="ch.id">{{ ch.name }}</a-option>
              </a-select>
            </a-form-item>
            <div style="display: flex; gap: 16px;">
              <a-form-item v-if="formData.type === '运营方'" label="单点登录" field="sso" style="flex: 1;">
                <a-switch v-model="formData.sso" checked-text="是" unchecked-text="否" />
              </a-form-item>
              <a-form-item label="状态" field="status" :style="{ flex: formData.type === '运营方' ? 1 : '0 0 100%' }">
                <a-switch v-model="formData.status" checked-text="启用" unchecked-text="禁用" />
              </a-form-item>
            </div>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 编辑租户弹窗 -->
    <a-modal
      v-model:visible="editModalVisible"
      title="编辑租户"
      :width="640"
      :ok-text="'保存'"
      @ok="handleEditSubmit"
      @cancel="editModalVisible = false"
    >
      <a-form ref="editFormRef" :model="formData" :rules="rules" layout="vertical">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="租户名称" field="name" required>
              <a-input v-model="formData.name" placeholder="请输入租户名称" />
            </a-form-item>
            <a-form-item label="租户类型" field="type" required>
              <a-select v-model="formData.type" placeholder="请选择租户类型" disabled>
                <a-option value="团队用户">团队用户</a-option>
                <a-option value="运营方">运营方</a-option>
              </a-select>
            </a-form-item>
            <a-form-item label="结算方式" field="settlement">
              <a-select v-model="formData.settlement" placeholder="请选择结算方式">
                <a-option value="预充权益">预充权益</a-option>
                <a-option value="自行购买">自行购买</a-option>
                <a-option v-if="formData.type === '团队用户'" value="按量计费">按量计费</a-option>
              </a-select>
            </a-form-item>
            <a-form-item v-if="formData.settlement === '按量计费'" label="结算周期" field="cycle">
              <a-select v-model="formData.cycle" placeholder="请选择结算周期">
                <a-option value="">请选择</a-option>
                <a-option value="月结">月结</a-option>
                <a-option value="季结">季结</a-option>
                <a-option value="年结">年结</a-option>
              </a-select>
            </a-form-item>
            <a-form-item v-if="formData.cycle" :label="formData.cycle === '月结' ? '结算日' : (formData.cycle === '季结' ? '季度结算日' : '年度结算月')" field="settlementDay">
              <a-input-number v-model="formData.settlementDay" :min="1" :max="formData.cycle === '年结' ? 12 : 31" :placeholder="formData.cycle === '月结' ? '每月几号结算' : (formData.cycle === '季结' ? '每季度第几天结算(1-31)' : '每年第几月结算(1-12)')" style="width: 100%" />
            </a-form-item>
            <a-form-item v-if="formData.type === '运营方'" label="分成比例" field="shareRatio">
              <a-input-number v-model="formData.shareRatio" :min="0" :max="100" suffix="%" style="width: 100%" placeholder="请输入分成比例" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="过期时间" field="expireTime">
              <a-date-picker v-model="formData.expireTime" placeholder="请选择过期时间" style="width: 100%" />
            </a-form-item>
            <a-form-item label="发票抬头" field="invoiceTitle">
              <a-input v-model="formData.invoiceTitle" placeholder="请输入发票抬头" />
            </a-form-item>
            <a-form-item label="发票税号" field="invoiceTaxNo">
              <a-input v-model="formData.invoiceTaxNo" placeholder="请输入发票税号" />
            </a-form-item>
            <a-form-item label="预扣额度上限" field="preDeductLimit">
              <a-input-number v-model="formData.preDeductLimit" :min="0" :step="1000" placeholder="请输入预扣额度上限" style="width: 100%" />
            </a-form-item>
            <a-form-item v-if="formData.type === '运营方'" label="渠道标识" field="channelTag">
              <a-input v-model="formData.channelTag" placeholder="请输入渠道标识" />
            </a-form-item>
            <a-form-item v-if="formData.type && formData.type !== '运营方'" label="渠道来源" field="channelId">
              <a-select v-model="formData.channelId" placeholder="请选择渠道来源（可选）" allow-clear>
                <a-option v-for="ch in channelOptions" :key="ch.id" :value="ch.id">{{ ch.name }}</a-option>
              </a-select>
            </a-form-item>
            <div style="display: flex; gap: 16px;">
              <a-form-item v-if="formData.type === '运营方'" label="单点登录" field="sso" style="flex: 1;">
                <a-switch v-model="formData.sso" checked-text="是" unchecked-text="否" />
              </a-form-item>
              <a-form-item label="状态" field="status" :style="{ flex: formData.type === '运营方' ? 1 : '0 0 100%' }">
                <a-switch v-model="formData.status" checked-text="启用" unchecked-text="禁用" />
              </a-form-item>
            </div>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 结算/充值弹窗 -->
    <a-modal
      v-model:visible="settlementModalVisible"
      :title="currentTenant?.settlement === '按量计费' ? '按量计费结算' : '权益充值'"
      :width="480"
      :ok-text="currentTenant?.settlement === '按量计费' ? '确认结算' : '确认充值'"
      @ok="handleSettlementSubmit"
      @cancel="settlementModalVisible = false"
    >
      <a-form layout="vertical">
        <template v-if="currentTenant?.settlement === '预充权益'">
          <a-form-item label="到账租户">
            <a-input :model-value="currentTenant?.name" disabled />
          </a-form-item>
          <a-form-item label="充值权益值" required>
            <a-input-number
              v-model="settlementForm.points"
              :min="0"
              style="width: 100%"
              placeholder="请输入充值权益值"
              @change="calculateSettlementAmount"
            >
              <template #suffix>点</template>
            </a-input-number>
          </a-form-item>
          <a-form-item label="刊例价计费">
            <div style="display: flex; align-items: baseline; gap: 12px;">
              <span style="font-size: 20px; font-weight: 600; color: #1d2129;">¥{{ settlementForm.originalAmount?.toFixed(2) || '0.00' }}</span>
              <span style="color: #86909c; font-size: 14px;">按 0.5 元/点 计算</span>
            </div>
          </a-form-item>
          <a-form-item label="协议价格" required>
            <a-input-number
              v-model="settlementForm.agreementPrice"
              :min="0"
              :precision="2"
              style="width: 100%"
              placeholder="请输入协议价格"
              @change="calculateSettlementDiscount"
            />
          </a-form-item>
          <a-form-item label="优惠差额">
            <div style="font-size: 18px; font-weight: 500; color: #00b42a;">
              -¥{{ Math.abs(settlementForm.discountAmount || 0).toFixed(2) }}
            </div>
          </a-form-item>
          <a-form-item label="实际支付金额" required>
            <a-input-number
              v-model="settlementForm.actualAmount"
              :min="0"
              :precision="2"
              style="width: 100%"
              placeholder="请输入实际支付金额"
            />
          </a-form-item>
        </template>
        <template v-else>
          <a-form-item label="消耗权益值">
            <span style="font-size: 16px; color: #1d2129;">{{ settlementForm.consumePoints || 0 }} 点</span>
          </a-form-item>
          <a-form-item label="计费单价" required>
            <a-input-number
              v-model="settlementForm.unitPrice"
              :min="0"
              :precision="4"
              style="width: 100%"
              placeholder="请输入计费单价"
              @change="calculatePayAsYouGoSettlement"
            >
              <template #suffix>元/点</template>
            </a-input-number>
          </a-form-item>
          <a-form-item label="调整金额">
            <a-input-group style="width: 100%">
              <a-select v-model="settlementForm.adjustType" style="width: 100px" @change="calculatePayAsYouGoSettlement">
                <a-option value="add">增加</a-option>
                <a-option value="subtract">减少</a-option>
              </a-select>
              <a-input-number
                v-model="settlementForm.adjustAmount"
                :min="0"
                :precision="2"
                style="width: calc(100% - 100px)"
                placeholder="0.00"
                @change="calculatePayAsYouGoSettlement"
              />
            </a-input-group>
          </a-form-item>
          <a-form-item label="实际结算金额">
            <span style="font-size: 18px; font-weight: 600; color: #165DFF;">
              ¥{{ settlementForm.actualAmount?.toFixed(2) || '0.00' }}
            </span>
          </a-form-item>
        </template>
      </a-form>
    </a-modal>

    <!-- 结算链接弹窗 -->
    <a-modal
      v-model:visible="settlementLinkVisible"
      title="结算链接"
      :mask-closable="false"
      :width="480"
      :footer="false"
    >
      <a-alert type="warning" style="margin-bottom: 16px;">
        请保存此结算链接，关闭该窗口后无法再次查看此链接
      </a-alert>
      <a-form layout="vertical">
        <a-form-item label="结算链接">
          <a-input v-model="generatedSettlementLink" readonly style="width: 100%" />
        </a-form-item>
      </a-form>
      <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
        <a-button type="primary" @click="copySettlementLink">复制</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus, IconDownload } from '@arco-design/web-vue/es/icon'
import ProductTabs from '../../components/ProductTabs.vue'
import SearchToolbar from '../../components/SearchToolbar.vue'
import BatchBar from '../../components/BatchBar.vue'
import ErrorBar from '../../components/ErrorBar.vue'
import PageCard from '../../components/PageCard.vue'
import { tenants, products } from '../../mock/data'

const router = useRouter()

const errorMsg = ref('')

const createModalVisible = ref(false)
const editModalVisible = ref(false)
const formRef = ref(null)
const editFormRef = ref(null)
const editingTenantId = ref('')

const formData = ref({
  name: '',
  type: '团队用户',
  settlement: '预充权益',
  cycle: '',
  settlementDay: null,
  shareRatio: null,
  preDeductLimit: 0,
  expireTime: '',
  invoiceTitle: '',
  invoiceTaxNo: '',
  channelTag: '',
  channelId: null,
  sso: false,
  status: true,
})

const channelOptions = computed(() => {
  return tenants.filter(t => t.type === '运营方')
})

const settlementModalVisible = ref(false)
const settlementLinkVisible = ref(false)
const currentTenant = ref(null)
const generatedSettlementLink = ref('')
const settlementForm = ref({
  points: 0,
  originalAmount: 0,
  agreementPrice: 0,
  discountAmount: 0,
  consumePoints: 0,
  unitPrice: 0,
  adjustType: 'add',
  adjustAmount: 0,
  actualAmount: 0,
})

const listPrice = 0.5

const rules = {
  name: [{ required: true, message: '请输入租户名称' }],
  type: [{ required: true, message: '请选择租户类型' }],
  settlement: [{ required: true, message: '请选择结算方式' }],
  invoiceTitle: [{ required: true, message: '请输入发票抬头' }],
  invoiceTaxNo: [{ required: true, message: '请输入发票税号' }],
}

function openCreateModal() {
  editingTenantId.value = ''
  formData.value = {
    name: '',
    type: '团队用户',
    deductionMethod: '先扣费',
    settlement: '预充权益',
    cycle: '',
    shareRatio: null,
    expireTime: '',
    invoiceTitle: '',
    invoiceTaxNo: '',
    channelTag: '',
    sso: false,
    status: true,
  }
  createModalVisible.value = true
}

function openEditModal(record) {
  editingTenantId.value = record.id
  const settlement = record.type === '运营方' && record.settlement === '按量计费'
    ? '预充权益'
    : (record.settlement || '预充权益')
  formData.value = {
    name: record.name,
    type: record.type,
    deductionMethod: record.deductionMethod || '先扣费',
    settlement: settlement,
    cycle: record.cycle || '',
    settlementDay: record.settlementDay,
    shareRatio: record.shareRatio,
    expireTime: record.expireTime === '永久' ? '' : record.expireTime,
    invoiceTitle: record.invoiceTitle,
    invoiceTaxNo: record.invoiceTaxNo,
    preDeductLimit: record.preDeductLimit || 0,
    channelTag: record.channelTag || '',
    channelId: record.channelId || null,
    sso: record.sso,
    status: record.status,
  }
  editModalVisible.value = true
}

function handleTypeChange(type) {
  if (type === '大客户') {
    formData.value.deductionMethod = '导出后扣费'
  } else {
    formData.value.deductionMethod = '先扣费'
  }
}

async function handleCreateSubmit() {
  const errors = await formRef.value?.validate()
  if (errors) return

  const newTenant = {
    id: 'T' + String(tenants.length + 1).padStart(3, '0'),
    ...formData.value,
    productId: activeProduct.value,
    userCount: 0,
    balance: 0,
    totalSpend: 0,
    createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
  }
  tableData.value.unshift(newTenant)
  createModalVisible.value = false
  Message.success('创建成功')
}

async function handleEditSubmit() {
  const errors = await editFormRef.value?.validate()
  if (errors) return

  const idx = tableData.value.findIndex(t => t.id === editingTenantId.value)
  if (idx >= 0) {
    tableData.value[idx].name = formData.value.name
    tableData.value[idx].type = formData.value.type
    tableData.value[idx].settlement = formData.value.settlement
    tableData.value[idx].cycle = formData.value.cycle
    tableData.value[idx].settlementDay = formData.value.settlementDay
    tableData.value[idx].shareRatio = formData.value.shareRatio
    if (formData.value.expireTime) {
      const date = new Date(formData.value.expireTime)
      tableData.value[idx].expireTime = date.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    } else {
      tableData.value[idx].expireTime = '永久'
    }
    tableData.value[idx].invoiceTitle = formData.value.invoiceTitle
    tableData.value[idx].invoiceTaxNo = formData.value.invoiceTaxNo
    tableData.value[idx].preDeductLimit = formData.value.preDeductLimit
    tableData.value[idx].channelTag = formData.value.channelTag
    tableData.value[idx].channelId = formData.value.channelId
    tableData.value[idx].sso = formData.value.sso
    tableData.value[idx].status = formData.value.status
    tableData.value[idx].deductionMethod = formData.value.deductionMethod
  }
  editModalVisible.value = false
  Message.success('保存成功')
}

const activeProduct = ref('P001')
const searchText = ref('')
const filterType = ref('')
const filterSettlement = ref('')
const filterStatus = ref('')
const filterChannelId = ref(undefined)
const filterDateRange = ref([])

const tableData = ref([...tenants])
const selectedKeys = ref([])

const columns = [
  { title: '租户ID', dataIndex: 'id', width: 90 },
  { title: '租户名称', dataIndex: 'name', width: 120 },
  { title: '租户类型', slotName: 'type', width: 100 },
  { title: '渠道来源', slotName: 'channelId', width: 120 },
  { title: '扣费方式', dataIndex: 'deductionMethod', width: 120 },
  { title: '累计购买金额', slotName: 'totalSpend', width: 130 },
  { title: '子用户数', dataIndex: 'userCount', width: 90 },
  { title: '分成比例', slotName: 'shareRatio', width: 90 },
  { title: '剩余权益值', slotName: 'balance', width: 110 },
  { title: '结算方式', dataIndex: 'settlement', width: 100 },
  { title: '结算周期', slotName: 'cycle', width: 90 },
  { title: '过期时间', slotName: 'expireTime', width: 180 },
  { title: '单点登录', slotName: 'sso', width: 90, align: 'center' },
  { title: '渠道标识', slotName: 'channelTag', width: 100 },
  { title: '状态', slotName: 'status', width: 90, align: 'center' },
  { title: '创建时间', dataIndex: 'createTime', width: 170 },
  { title: '操作', slotName: 'actions', width: 210, fixed: 'right' }
]

const pagination = ref({
  pageSize: 20,
  showTotal: true,
  showPageSize: true,
  pageSizeOptions: [20, 50, 100]
})

const filteredList = computed(() => {
  let result = tableData.value

  if (activeProduct.value) {
    result = result.filter(item => item.productId === activeProduct.value)
  }

  result = result.filter(item => item.type === '团队用户' || item.type === '运营方' || item.type === '大客户')

  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    result = result.filter(item => item.name.toLowerCase().includes(keyword))
  }

  if (filterType.value) {
    result = result.filter(item => item.type === filterType.value)
  }

  if (filterSettlement.value) {
    result = result.filter(item => item.settlement === filterSettlement.value)
  }

  if (filterStatus.value !== '') {
    result = result.filter(item => item.status === filterStatus.value)
  }

  if (filterChannelId.value && filterChannelId.value !== '' && filterChannelId.value !== '__all__') {
    if (filterChannelId.value === '__none__') {
      result = result.filter(item => !item.channelId)
    } else {
      result = result.filter(item => item.channelId === filterChannelId.value)
    }
  }

  return result
})

function handleProductChange(key) {
  activeProduct.value = key
}

function handleSearch(val) {
  searchText.value = val || ''
}

function batchToggle(status) {
  selectedKeys.value.forEach(key => {
    const item = tableData.value.find(item => item.id === key)
    if (item) {
      item.status = status
    }
  })
}

function batchDelete() {
  tableData.value = tableData.value.filter(item => !selectedKeys.value.includes(item.id))
  selectedKeys.value = []
  Message.success('批量删除成功')
}

function goCreate() {
  openCreateModal()
}

function handleDelete(record) {
  setTimeout(() => {
    tableData.value = tableData.value.filter(item => item.id !== record.id)
    Message.success('删除成功')
  }, 100)
}

function confirmToggle(record) {
  return new Promise((resolve) => {
    Modal.confirm({
      title: '确认切换状态',
      content: `确定要${record.status ? '禁用' : '启用'}租户「${record.name}」吗？`,
      onOk: () => {
        record.status = !record.status
        Message.success(`租户已${record.status ? '启用' : '禁用'}`)
        resolve(true)
      },
      onCancel: () => {
        resolve(false)
      }
    })
  })
}

function goDetail(record) {
  router.push(`/user/tenant/detail/${record.id}`)
}

function goEdit(record) {
  router.push(`/user/tenant/detail/${record.id}?edit=1`)
}

function openSettlementModal(record) {
  currentTenant.value = record
  if (record.settlement === '预充权益') {
    const points = 1000
    const original = points * listPrice
    settlementForm.value = {
      points: points,
      originalAmount: original,
      agreementPrice: original * 0.8,
      discountAmount: original * 0.2,
      actualAmount: original * 0.8,
      consumePoints: 0,
      unitPrice: 0,
      adjustType: 'add',
      adjustAmount: 0,
    }
  } else {
    const consumePoints = Math.floor(Math.random() * 10000) + 1000
    settlementForm.value = {
      points: 0,
      originalAmount: 0,
      agreementPrice: 0,
      discountAmount: 0,
      consumePoints: consumePoints,
      unitPrice: 0.5,
      adjustType: 'add',
      adjustAmount: 0,
      actualAmount: consumePoints * 0.5,
    }
  }
  settlementModalVisible.value = true
}

function calculateSettlementAmount() {
  const points = Number(settlementForm.value.points) || 0
  settlementForm.value.originalAmount = points * listPrice
  calculateSettlementDiscount()
}

function calculateSettlementDiscount() {
  const original = settlementForm.value.originalAmount || 0
  const agreement = Number(settlementForm.value.agreementPrice) || 0
  settlementForm.value.discountAmount = original - agreement
}

function calculatePayAsYouGoSettlement() {
  const points = Number(settlementForm.value.consumePoints) || 0
  const unitPrice = Number(settlementForm.value.unitPrice) || 0
  const adjust = Number(settlementForm.value.adjustAmount) || 0
  const adjustType = settlementForm.value.adjustType
  const baseAmount = points * unitPrice
  if (adjustType === 'add') {
    settlementForm.value.actualAmount = baseAmount + adjust
  } else {
    settlementForm.value.actualAmount = Math.max(0, baseAmount - adjust)
  }
}

function handleSettlementSubmit() {
  const linkId = `SL${Date.now().toString(36).toUpperCase().slice(-8)}`
  generatedSettlementLink.value = `${window.location.origin}/settle/${linkId}`

  Message.success('结算单创建成功')
  settlementModalVisible.value = false
  settlementLinkVisible.value = true
}

function copySettlementLink() {
  navigator.clipboard.writeText(generatedSettlementLink.value).then(() => {
    Message.success('链接已复制到剪贴板')
  }).catch(() => {
    Message.error('复制失败，请手动复制')
  })
}

function getChannelName(channelId) {
  const t = tenants.find(t => t.id === channelId)
  return t?.name || channelId
}

function getTypeColor(type) {
  if (type === '运营方') return 'orange'
  if (type === '大客户') return 'purple'
  if (type === '团队用户') return 'cyan'
  if (type === '企业用户') return 'blue'
  return 'blue'
}

function getProductUnit(productId) {
  const product = products.find(p => p.id === productId)
  return product?.unit || '点'
}

const handleExport = () => {
  Message.success('正在导出当前筛选数据...')
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

.text-gray {
  color: #c9cdd4;
}
</style>
