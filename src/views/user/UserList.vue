<template>
  <div class="page-container">
    <ErrorBar :message="errorMsg" />

    <ProductTabs v-model="activeProduct" @change="handleProductChange" />

    <SearchToolbar placeholder="搜索用户名/账号/手机号" @search="handleSearch">
      <template #extra>
        <a-select
          v-model="filterStatus"
          placeholder="状态"
          style="width: 120px"
          allow-clear
          @change="handleSearch"
          @clear="handleSearch"
        >
          <a-option value="">全部</a-option>
          <a-option value="启用">启用</a-option>
          <a-option value="禁用">禁用</a-option>
        </a-select>
        <a-range-picker
          v-model="filterDateRange"
          style="width: 240px"
          :placeholder="['开始', '结束']"
          @change="handleSearch"
        />
      </template>
      <template #actions>
        <a-button type="primary" @click="goCreate">
          <template #icon><icon-plus /></template>
          创建用户
        </a-button>
        <a-button type="outline" @click="goBatchCreate">批量创建</a-button>
        <a-button @click="handleExport">
          <template #icon><icon-download /></template>
          导出
        </a-button>
      </template>
    </SearchToolbar>

    <BatchBar :selectedCount="selectedKeys.length" @cancel="selectedKeys = []">
      <template #actions>
        <a-button size="small" type="outline" @click="handleBatchEnable(true)">批量启用</a-button>
        <a-button size="small" type="outline" @click="handleBatchEnable(false)">批量禁用</a-button>
        <a-button size="small" type="outline" status="danger" @click="handleBatchDelete">批量删除</a-button>
      </template>
    </BatchBar>

    <PageCard>
      <a-table
        :columns="columns"
        :data="filteredUsers"
        :pagination="pagination"
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
        v-model:selectedKeys="selectedKeys"
        row-key="id"
        stripe
        :scroll="{ x: 1400 }"
      >
        <template #tenants="{ record }">
          <template v-if="record.tenantRoles && record.tenantRoles.length > 0">
            <a-space :size="4" wrap>
              <a-tag v-for="(tr, idx) in record.tenantRoles.slice(0, 2)" :key="idx" :color="roleColor(tr.role)" size="small">{{ getTenantName(tr.tenantId || tr.tenant) }}({{ tr.role }})</a-tag>
              <a-tag v-if="record.tenantRoles.length > 2" size="small" color="gray">+{{ record.tenantRoles.length - 2 }}</a-tag>
            </a-space>
          </template>
          <span v-else-if="record.tenants && record.tenants.length > 0">
            <a-space :size="4" wrap>
              <a-tag v-for="tid in record.tenants.slice(0, 2)" :key="tid" color="blue" size="small">{{ getTenantName(tid) }}</a-tag>
              <a-tag v-if="record.tenants.length > 2" size="small" color="gray">+{{ record.tenants.length - 2 }}</a-tag>
            </a-space>
          </span>
          <span v-else class="text-gray">-</span>
        </template>
        <template #tags="{ record }">
          <template v-if="record.tags && record.tags.length > 0">
            <a-space :size="4" wrap>
              <a-tag v-for="(tag, idx) in record.tags.slice(0, 3)" :key="idx" :color="tagColors[idx % tagColors.length]" size="small">{{ tag }}</a-tag>
              <a-tag v-if="record.tags.length > 3" size="small" color="gray">+{{ record.tags.length - 3 }}</a-tag>
            </a-space>
          </template>
          <span v-else class="text-gray">-</span>
        </template>
        <template #status="{ record }">
          <a-switch v-model="record.status" checked-text="启用" unchecked-text="禁用" @change="(val) => handleStatusChange(record, val)" />
        </template>
        <template #actions="{ record }">
          <div class="table-actions">
            <a-button type="text" size="small" @click="goEdit(record)">编辑</a-button>
            <a-button type="text" size="small" status="danger" @click="handleDelete(record)">删除</a-button>
            <a-button type="text" size="small" @click="goDetail(record)">详情</a-button>
          </div>
        </template>
      </a-table>
    </PageCard>

    <!-- 创建用户弹窗 -->
    <a-modal
      v-model:visible="createModalVisible"
      title="创建用户"
      :width="720"
      :ok-text="'创建'"
      @ok="handleCreateSubmit"
      @cancel="createModalVisible = false"
    >
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="产品名称" field="productName">
              <a-input v-model="formData.productName" readonly />
            </a-form-item>
            <a-form-item label="用户名" field="name" required>
              <a-input v-model="formData.name" placeholder="请输入用户名" />
            </a-form-item>
            <a-form-item label="用户账号" field="account" required>
              <a-input v-model="formData.account" placeholder="请输入用户账号" />
            </a-form-item>
            <a-form-item label="手机号" field="phone">
              <a-input v-model="formData.phone" placeholder="请输入手机号" />
            </a-form-item>
            <a-form-item label="密码" field="password" required>
              <a-input-password v-model="formData.password" placeholder="8位以上，字母+数字" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="归属租户及角色" field="tenantRoles">
              <div style="display: block; width: 100%;">
                <div v-for="(tr, idx) in formData.tenantRoles" :key="idx" style="margin-bottom: 8px; display: flex; width: 100%;">
                  <a-select v-model="tr.tenantId" placeholder="选择租户" style="flex: 1;" allow-search>
                    <a-option v-for="tenant in tenantOptions" :key="tenant.id" :value="tenant.id">{{ tenant.name }}</a-option>
                  </a-select>
                  <a-select v-model="tr.role" placeholder="选择角色" style="width: 120px; margin-left: 8px;">
                    <a-option v-for="role in roleOptions" :key="role" :value="role">{{ role }}</a-option>
                  </a-select>
                  <a-button type="text" status="danger" @click="removeTenantRole(idx)" style="margin-left: 8px; width: 32px;">
                    <template #icon><icon-delete /></template>
                  </a-button>
                </div>
                <div style="margin-top: 0;">
                  <a-button type="dashed" @click="addTenantRole">
                    <template #icon><icon-plus /></template>
                    添加租户
                  </a-button>
                </div>
              </div>
            </a-form-item>
            <a-form-item label="有效期" field="expireTime">
              <div style="display: flex; gap: 8px; width: 100%;">
                <a-select v-model="expireType" @change="handleExpireTypeChange" style="width: 35%;">
                  <a-option value="permanent">永久</a-option>
                  <a-option value="date">指定日期</a-option>
                </a-select>
                <a-date-picker v-if="expireType === 'date'" v-model="formData.expireTime" placeholder="请选择有效期" style="width: 65%;" />
                <div v-else style="width: 65%;"></div>
              </div>
            </a-form-item>
            <a-form-item label="标签" field="tags">
              <a-select v-model="formData.tags" placeholder="请选择用户分群作为标签" multiple allow-create style="width: 100%;">
                <a-option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 编辑用户弹窗 -->
    <a-modal
      v-model:visible="editModalVisible"
      title="编辑用户"
      :width="720"
      :ok-text="'保存'"
      @ok="handleEditSubmit"
      @cancel="editModalVisible = false"
    >
      <a-form ref="editFormRef" :model="formData" :rules="editRules" layout="vertical">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="产品名称" field="productName">
              <a-input v-model="formData.productName" readonly />
            </a-form-item>
            <a-form-item label="用户名" field="name" required>
              <a-input v-model="formData.name" placeholder="请输入用户名" />
            </a-form-item>
            <a-form-item label="用户账号" field="account" required>
              <a-input v-model="formData.account" placeholder="请输入用户账号" />
            </a-form-item>
            <a-form-item label="手机号" field="phone">
              <a-input v-model="formData.phone" placeholder="请输入手机号" />
            </a-form-item>
            <a-form-item label="密码" field="password">
              <a-input-password v-model="formData.password" placeholder="不修改请留空" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="归属租户及角色" field="tenantRoles">
              <div style="display: block; width: 100%;">
                <div v-for="(tr, idx) in formData.tenantRoles" :key="idx" style="margin-bottom: 8px; display: flex; width: 100%;">
                  <a-select v-model="tr.tenantId" placeholder="选择租户" style="flex: 1;" allow-search>
                    <a-option v-for="tenant in tenantOptions" :key="tenant.id" :value="tenant.id">{{ tenant.name }}</a-option>
                  </a-select>
                  <a-select v-model="tr.role" placeholder="选择角色" style="width: 120px; margin-left: 8px;">
                    <a-option v-for="role in roleOptions" :key="role" :value="role">{{ role }}</a-option>
                  </a-select>
                  <a-button type="text" status="danger" @click="removeTenantRole(idx)" style="margin-left: 8px; width: 32px;">
                    <template #icon><icon-delete /></template>
                  </a-button>
                </div>
                <div style="margin-top: 0;">
                  <a-button type="dashed" @click="addTenantRole">
                    <template #icon><icon-plus /></template>
                    添加租户
                  </a-button>
                </div>
              </div>
            </a-form-item>
            <a-form-item label="有效期" field="expireTime">
              <div style="display: flex; gap: 8px; width: 100%;">
                <a-select v-model="expireType" @change="handleExpireTypeChange" style="width: 35%;">
                  <a-option value="permanent">永久</a-option>
                  <a-option value="date">指定日期</a-option>
                </a-select>
                <a-date-picker v-if="expireType === 'date'" v-model="formData.expireTime" placeholder="请选择有效期" style="width: 65%;" />
                <div v-else style="width: 65%;"></div>
              </div>
            </a-form-item>
            <a-form-item label="标签" field="tags">
              <a-select v-model="formData.tags" placeholder="请选择用户分群作为标签" multiple allow-create style="width: 100%;">
                <a-option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus, IconDownload, IconDelete } from '@arco-design/web-vue/es/icon'
import ProductTabs from '../../components/ProductTabs.vue'
import SearchToolbar from '../../components/SearchToolbar.vue'
import BatchBar from '../../components/BatchBar.vue'
import ErrorBar from '../../components/ErrorBar.vue'
import PageCard from '../../components/PageCard.vue'
import { users, tenants, userGroups } from '../../mock/data'

function getTenantName(tenantId) {
  const t = tenants.find(t => t.id === tenantId)
  return t?.name || tenantId
}

const errorMsg = ref('')

const tenantOptions = ref(tenants.map(t => ({ id: t.id, name: t.name })))

const router = useRouter()

const createModalVisible = ref(false)
const editModalVisible = ref(false)
const formRef = ref(null)
const editFormRef = ref(null)
const editingUserId = ref('')

const formData = ref({
  productName: '',
  name: '',
  account: '',
  phone: '',
  password: '',
  tenantRoles: [],
  expireTime: '',
  tags: [],
})

const expireType = ref('permanent')

const roleOptions = ['超级管理员', '管理员', '翻译人员', '校对人员']

const availableTags = computed(() => {
  return userGroups
    .filter(g => g.productId === activeProduct.value)
    .map(g => g.name)
})

const rules = {
  name: [{ required: true, message: '请输入用户名' }],
  account: [{ required: true, message: '请输入用户账号' }],
  password: [{ required: true, message: '请输入密码' }],
}

const editRules = {
  name: [{ required: true, message: '请输入用户名' }],
  account: [{ required: true, message: '请输入用户账号' }],
}

function openCreateModal() {
  editingUserId.value = ''
  formData.value = {
    productName: activeProduct.value === 'P001' ? '智马翻译' : '智马漫影',
    name: '',
    account: '',
    password: '',
    tenantRoles: [],
    expireTime: '',
    tags: [],
  }
  expireType.value = 'permanent'
  createModalVisible.value = true
}

function openEditModal(record) {
  editingUserId.value = record.id
  formData.value = {
    productName: activeProduct.value === 'P001' ? '智马翻译' : '智马漫影',
    name: record.name,
    account: record.account,
    phone: record.phone || '',
    password: '',
    tenantRoles: record.tenantRoles ? record.tenantRoles.map(tr => ({ tenantId: tr.tenant || tr.tenantId, role: tr.role })) : [],
    expireTime: record.expireTime && record.expireTime !== '永久' ? record.expireTime : '',
    tags: record.tags || [],
  }
  expireType.value = record.expireTime && record.expireTime !== '永久' ? 'date' : 'permanent'
  editModalVisible.value = true
}

function addTenantRole() {
  formData.value.tenantRoles.push({ tenantId: '', role: '管理员' })
}

function removeTenantRole(idx) {
  formData.value.tenantRoles.splice(idx, 1)
}

async function handleCreateSubmit() {
  const errors = await formRef.value?.validate()
  if (errors) return

  const tenantIds = formData.value.tenantRoles.map(tr => tr.tenantId).filter(Boolean)
  const newUser = {
    id: 'U' + Date.now().toString().slice(-6),
    ...formData.value,
    tenants: tenantIds,
    tenantRoles: formData.value.tenantRoles.map(tr => ({ tenant: tr.tenantId, role: tr.role })),
    expireTime: expireType.value === 'date' ? formData.value.expireTime : '永久',
    status: true,
    createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    balance: 0,
    totalSpend: 0,
    orders: 0,
  }
  tableData.value.unshift(newUser)
  createModalVisible.value = false
  Message.success('创建成功')
}

async function handleEditSubmit() {
  const errors = await editFormRef.value?.validate()
  if (errors) return

  const idx = tableData.value.findIndex(u => u.id === editingUserId.value)
  if (idx >= 0) {
    const tenantIds = formData.value.tenantRoles.map(tr => tr.tenantId).filter(Boolean)
    tableData.value[idx].name = formData.value.name
    tableData.value[idx].account = formData.value.account
    tableData.value[idx].phone = formData.value.phone
    tableData.value[idx].tenantRoles = formData.value.tenantRoles.map(tr => ({ tenant: tr.tenantId, role: tr.role }))
    tableData.value[idx].tenants = tenantIds
    tableData.value[idx].expireTime = expireType.value === 'date' ? formData.value.expireTime : '永久'
    tableData.value[idx].tags = formData.value.tags
    if (formData.value.password) {
    }
  }
  editModalVisible.value = false
  Message.success('保存成功')
}

function roleColor(role) {
  const map = {
    '团队超级管理员': '#f53f3f',
    '创建者': '#f53f3f',
    '超级管理员': '#f53f3f',
    '管理员': '#ff7d00',
    '翻译人员': '#00b42a',
    '校对人员': '#722ed1',
  }
  return map[role] || '#165DFF'
}

const activeProduct = ref('P001')
const searchText = ref('')
const filterStatus = ref(undefined)
const filterDateRange = ref([])
const selectedKeys = ref([])
const tagColors = ['blue', 'green', 'orange', 'purple', 'cyan', 'red']
const tableData = ref(JSON.parse(JSON.stringify(users)))

const pagination = ref({
  pageSize: 20,
  showTotal: true,
  showPageSize: true,
  pageSizeOptions: [20, 50, 100]
})

const columns = computed(() => [
  { title: '用户ID', dataIndex: 'id', width: 120 },
  { title: '用户名', dataIndex: 'name', width: 90 },
  { title: '归属租户', slotName: 'tenants', width: 200 },
  { title: '用户账号', dataIndex: 'account', width: 135 },
  { title: '手机号', dataIndex: 'phone', width: 130 },
  { title: '标签', slotName: 'tags', width: 140, ellipsis: true, tooltip: true },
  { title: '过期时间', dataIndex: 'expireTime', width: 130, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '创建时间', dataIndex: 'createTime', width: 180, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '状态', slotName: 'status', width: 90, align: 'center' },
  { title: '操作', slotName: 'actions', width: 170, fixed: 'right' },
])

const filteredUsers = computed(() => {
  let list = tableData.value
  if (activeProduct.value === 'P001') {
    list = list.filter(u => u.tenants.some(tid => {
      const t = tenants.find(tc => tc.id === tid)
      return t && t.productId === 'P001'
    }))
  } else {
    list = list.filter(u => u.tenants.some(tid => {
      const t = tenants.find(tc => tc.id === tid)
      return t && t.productId === 'P002'
    }))
  }
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(u => u.name.toLowerCase().includes(kw) || u.account.includes(kw) || u.phone.includes(kw))
  }
  if (filterStatus.value !== undefined && filterStatus.value !== null && filterStatus.value !== '') {
    const statusBool = filterStatus.value === '启用'
    list = list.filter(u => u.status === statusBool)
  }
  if (filterDateRange.value && filterDateRange.value.length === 2) {
    const start = filterDateRange.value[0]
    const end = filterDateRange.value[1]
    list = list.filter(u => u.createTime >= start && u.createTime <= end)
  }
  return list
})

function handleSearch(val) {
  searchText.value = val || ''
}

function handleProductChange() {
  selectedKeys.value = []
}

function goCreate() {
  openCreateModal()
}

function goBatchCreate() {
  const productName = activeProduct.value === 'P001' ? '智马翻译' : '智马漫影'
  router.push({
    path: '/user/batch-create',
    query: { productName: productName }
  })
}

function goEdit(record) {
  openEditModal(record)
}

function handleDelete(record) {
  Modal.warning({
    title: '确认删除',
    content: `您即将删除用户「${record.name}」，此操作不可逆，用户所有数据将被永久移除！`,
    okText: '确认删除',
    cancelText: '取消',
    hideCancel: false,
    onOk() {
      tableData.value = tableData.value.filter(u => u.id !== record.id)
      Message.success('删除成功')
    }
  })
}

function handleBatchDelete() {
  Modal.warning({
    title: '批量删除',
    content: `确定要删除选中的 ${selectedKeys.value.length} 个用户吗？此操作不可逆！`,
    okText: '确认删除',
    cancelText: '取消',
    hideCancel: false,
    onOk() {
      tableData.value = tableData.value.filter(u => !selectedKeys.value.includes(u.id))
      selectedKeys.value = []
      Message.success('批量删除成功')
    }
  })
}

function handleBatchEnable(enable) {
  const action = enable ? '启用' : '禁用'
  Modal.confirm({
    title: `批量${action}`,
    content: `确定要${action}选中的 ${selectedKeys.value.length} 个用户吗？`,
    onOk() {
      tableData.value.forEach(u => {
        if (selectedKeys.value.includes(u.id)) {
          u.status = enable
        }
      })
      selectedKeys.value = []
      Message.success(`批量${action}成功`)
    }
  })
}

function handleStatusChange(record, val) {
  const action = val ? '启用' : '禁用'
  Modal.confirm({
    title: `确认${action}`,
    content: `确定要${action}用户「${record.name}」吗？`,
    onOk: () => {
      Message.success(`用户「${record.name}」已${action}`)
    },
    onCancel: () => {
      record.status = !val
    }
  })
}

function goDetail(record) {
  router.push(`/user/detail/${record.id}`)
}

function handleExport() {
  Message.success('正在导出当前筛选数据...')
}

function handleExpireTypeChange(val) {
  if (val === 'permanent') {
    formData.value.expireTime = ''
  }
}
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #f5f6f7;
  min-height: 100%;
}

.text-gray {
  color: #c9cdd4;
}

:deep(.arco-tag) {
  font-size: 14px;
}

:deep(.arco-table-th) {
  background: #fafafa !important;
  font-weight: 500;
}

:deep(.arco-btn-size-small) {
  padding: 0 8px;
}

:deep(.arco-table-tr:hover .arco-table-td) {
  background: #f2f3f5;
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
