<template>
  <div class="page-container">
    <ErrorBar :message="errorMsg" />

    <PageHeader title="批量创建用户" show-back back-path="/user/list" />

    <PageCard>
      <a-form :model="batchForm" layout="vertical">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="产品名称">
              <a-input v-model="batchForm.productName" readonly />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="归属租户" required>
              <a-select v-model="batchForm.tenantId" placeholder="请选择归属租户" allow-search>
                <a-option v-for="tenant in tenantOptions" :key="tenant.id" :value="tenant.id">{{ tenant.name }}</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="默认有效期">
              <div style="display: flex; gap: 8px; width: 100%;">
                <a-select v-model="batchForm.expireType" style="width: 35%;">
                  <a-option value="permanent">永久</a-option>
                  <a-option value="date">指定日期</a-option>
                </a-select>
                <a-date-picker v-if="batchForm.expireType === 'date'" v-model="batchForm.expireTime" placeholder="请选择有效期" style="width: 65%;" />
                <div v-else style="width: 65%;"></div>
              </div>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="默认标签">
              <a-select v-model="batchForm.tags" placeholder="请选择用户分群作为标签" multiple allow-create>
                <a-option v-for="group in tagOptions" :key="group.id" :value="group.name">{{ group.name }}</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <div class="batch-table-header">
        <span class="batch-title">用户列表</span>
        <a-space>
          <a-button type="primary" size="small" @click="addBatchRow">
            <template #icon><icon-plus /></template>
            添加行
          </a-button>
          <a-button size="small" @click="downloadBatchTemplate">
            <template #icon><icon-download /></template>
            下载模板
          </a-button>
          <a-upload action="/" :auto-upload="false" :show-file-list="false" @change="handleBatchUpload">
            <a-button size="small">
              <template #icon><icon-upload /></template>
              导入Excel
            </a-button>
          </a-upload>
        </a-space>
      </div>
      <a-table :columns="batchColumns" :data="batchList" :pagination="false" row-key="id" size="small">
        <template #name="{ record }">
          <a-input v-model="record.name" placeholder="用户名" size="small" />
        </template>
        <template #account="{ record }">
          <a-input v-model="record.account" placeholder="手机号" size="small" />
        </template>
        <template #password="{ record }">
          <a-input-password v-model="record.password" placeholder="8位以上" size="small" />
        </template>
        <template #role="{ record }">
          <a-select v-model="record.role" placeholder="选择角色" size="small" style="width: 100px;">
            <a-option value="超级管理员">超级管理员</a-option>
            <a-option value="管理员">管理员</a-option>
            <a-option value="翻译人员">翻译人员</a-option>
            <a-option value="校对人员">校对人员</a-option>
          </a-select>
        </template>
        <template #actions="{ rowIndex }">
          <a-button type="text" status="danger" size="small" @click="removeBatchRow(rowIndex)">
            <template #icon><icon-delete /></template>
          </a-button>
        </template>
      </a-table>
    </PageCard>

    <FormActionsBar
      @cancel="router.push('/user/list')"
      @confirm="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import PageHeader from '../../components/PageHeader.vue'
import PageCard from '../../components/PageCard.vue'
import FormActionsBar from '../../components/FormActionsBar.vue'
import ErrorBar from '../../components/ErrorBar.vue'
import { users, tenants, userGroups } from '../../mock/data'
import { IconDelete, IconPlus, IconDownload, IconUpload } from '@arco-design/web-vue/es/icon'

const router = useRouter()
const route = useRoute()

const errorMsg = ref('')

const productName = route.query.productName || '智马翻译'

const tenantOptions = computed(() => {
  return tenants
    .filter(t => t.type === '企业用户' || t.type === '渠道商')
    .map(t => ({ id: t.id, name: t.name }))
})

const tagOptions = computed(() => {
  const productId = productName === '智马翻译' ? 'P001' : 'P002'
  return userGroups
    .filter(g => g.productId === productId)
    .map(g => ({ id: g.id, name: g.name }))
})

const batchForm = reactive({
  productName: productName,
  tenantId: '',
  expireType: 'permanent',
  expireTime: '',
  tags: []
})

const batchList = ref([
  { id: 1, name: '', account: '', tenantId: '', role: '成员' },
  { id: 2, name: '', account: '', tenantId: '', role: '成员' },
  { id: 3, name: '', account: '', tenantId: '', role: '成员' },
])

let batchIdCounter = 4

const batchColumns = [
  { title: '用户名', slotName: 'name', width: 150 },
  { title: '用户账号', slotName: 'account', width: 150 },
  { title: '密码', slotName: 'password', width: 150 },
  { title: '角色', slotName: 'role', width: 120 },
  { title: '操作', slotName: 'actions', width: 80 },
]

function addBatchRow() {
  batchList.value.push({
    id: batchIdCounter++,
    name: '',
    account: '',
    password: '',
    role: '成员'
  })
}

function removeBatchRow(index) {
  batchList.value.splice(index, 1)
}

function downloadBatchTemplate() {
  const headers = ['用户名', '用户账号', '密码', '角色']
  const csvContent = headers.join(',') + '\n' + '示例用户,13800138000,Password123,成员'
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = '用户批量导入模板.csv'
  link.click()
  URL.revokeObjectURL(link.href)
  Message.success('模板下载成功')
}

function handleBatchUpload(fileList) {
  Message.info('导入功能需要后端支持，当前为演示')
}

async function handleSubmit() {
  const validUsers = batchList.value.filter(u => u.name && u.account)
  if (validUsers.length === 0) {
    Message.error('请至少填写一个有效的用户信息')
    return
  }

  const productId = productName === '智马翻译' ? 'P001' : 'P002'

  validUsers.forEach((u, index) => {
    const newUserId = `U${10000 + users.length + 1 + index}`
    const newUser = {
      id: newUserId,
      name: u.name,
      account: u.account,
      phone: u.account,
      password: u.password,
      productId: productId,
      tenants: batchForm.tenantId ? [batchForm.tenantId] : [],
      tenantRoles: batchForm.tenantId ? [{ tenant: batchForm.tenantId, role: u.role }] : [],
      role: u.role || '成员',
      tags: batchForm.tags || [],
      expireTime: batchForm.expireTime,
      createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      status: true,
      totalSpend: 0,
      balance: 0,
      orders: 0
    }
    users.unshift(newUser)
  })

  Message.success(`成功创建 ${validUsers.length} 个用户`)
  router.push('/user/list')
}
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #f5f6f7;
  min-height: calc(100vh - 56px);
}

.batch-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.batch-title {
  font-weight: 500;
  color: #1d2129;
}

:deep(.arco-card-body) {
  padding: 24px;
}
</style>
