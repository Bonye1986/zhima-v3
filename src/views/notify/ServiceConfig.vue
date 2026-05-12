<template>
  <div class="page-container">
    <!-- 未保存提示 -->
    <a-alert v-if="hasUnsaved" type="warning" banner closable style="margin-bottom: 16px;">
      您有未保存的配置修改，请及时保存！
      <template #action>
        <a-button size="small" type="primary" @click="handleSaveApi">立即保存</a-button>
      </template>
    </a-alert>

    <!-- API凭证配置 -->
    <a-card :bordered="false" style="margin-bottom: 16px;">
      <template #title>
        <span class="card-title">API凭证配置</span>
      </template>
      <a-form :model="apiForm" layout="vertical" style="max-width: 600px;">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="AccessKey ID" required>
              <a-input v-model="apiForm.accessKeyId" placeholder="请输入 AccessKey ID" @input="markDirty" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="AccessKey Secret" required>
              <a-input-password v-model="apiForm.accessKeySecret" placeholder="请输入 AccessKey Secret" @input="markDirty" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="发信域名">
              <a-input v-model="apiForm.domain" placeholder="如 mail.example.com" @input="markDirty" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="发信地址">
              <a-input v-model="apiForm.senderAddress" placeholder="如 noreply@example.com" @input="markDirty" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item>
          <a-button type="primary" @click="handleSaveApi">保存配置</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 签名管理 -->
    <a-card :bordered="false">
      <template #title>
        <span class="card-title">签名管理</span>
      </template>
      <template #extra>
        <a-button type="primary" size="small" @click="openSignModal()">
          <template #icon><icon-plus /></template>
          添加签名
        </a-button>
      </template>

      <!-- 批量操作栏 -->
      <BatchBar :selectedCount="selectedKeys.length" @cancel="clearSelection">
        <template #actions>
          <a-button size="small" type="outline" status="danger" @click="batchDelete">批量删除</a-button>
        </template>
      </BatchBar>

      <a-table :columns="signColumns" :data="signList" :pagination="{ pageSize: 20, showTotal: true, showPageSize: true }" row-key="id" size="small" stripe v-model:selected-keys="selectedKeys" :row-selection="{ type: 'checkbox', showCheckedAll: true }">
        <template #status="{ record }">
          <a-tag :color="record.status === '已审核' ? 'green' : 'orange'" size="small">{{ record.status }}</a-tag>
        </template>
        <template #actions="{ record, rowIndex }">
          <a-space>
            <a-link @click="openSignModal(record, rowIndex)">编辑</a-link>
            <a-link status="danger" @click="deleteSign(rowIndex)">删除</a-link>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <!-- 添加/编辑签名弹窗 -->
    <a-modal v-model:visible="signModalVisible" :title="editSignIndex >= 0 ? '编辑签名' : '添加签名'" @ok="handleSignOk" :mask-closable="false" width="520px">
      <a-form :model="signForm" layout="vertical">
        <a-form-item label="签名名称" required>
          <a-input v-model="signForm.name" placeholder="请输入签名名称" />
        </a-form-item>
        <a-form-item label="签名来源" required>
          <a-select v-model="signForm.source" placeholder="请选择签名来源">
            <a-option value="企事业单位">企事业单位</a-option>
            <a-option value="工信部备案网站">工信部备案网站</a-option>
            <a-option value="商标名">商标名</a-option>
            <a-option value="APP名称">APP名称</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="关联资质用途">
          <a-radio-group v-model="signForm.usage">
            <a-radio value="自用">自用</a-radio>
            <a-radio value="他用">他用</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="关联资质名称">
          <a-select v-model="signForm.qualName" placeholder="请选择关联资质">
            <a-option value="智马科技营业执照">智马科技营业执照</a-option>
            <a-option value="ICP备案证明">ICP备案证明</a-option>
            <a-option value="商标注册证">商标注册证</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import BatchBar from '../../components/BatchBar.vue'

const hasUnsaved = ref(false)

const apiForm = ref({
  accessKeyId: 'LTAI5t****Qm2x',
  accessKeySecret: '••••••••••••',
  domain: 'mail.zhima.com',
  senderAddress: 'noreply@zhima.com',
})

function markDirty() { hasUnsaved.value = true }

function handleSaveApi() {
  Message.success('API凭证保存成功')
  hasUnsaved.value = false
}

const selectedKeys = ref([])

const signList = ref([
  { id: 'SG001', name: '智马翻译', qual: '智马科技营业执照', source: '企事业单位', status: '已审核', createTime: '2026-01-15 10:00:00', updateTime: '2026-03-01 09:00:00' },
  { id: 'SG002', name: '智马漫影', qual: 'ICP备案证明', source: '工信部备案网站', status: '审核中', createTime: '2026-02-20 14:00:00', updateTime: '2026-04-10 11:00:00' },
])

const signColumns = [
  { title: '签名名称', dataIndex: 'name', width: 120 },
  { title: '关联资质', dataIndex: 'qual', width: 160 },
  { title: '签名来源', dataIndex: 'source', width: 130 },
  { title: '签名状态', slotName: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', width: 170 },
  { title: '更新时间', dataIndex: 'updateTime', width: 170 },
  { title: '操作', slotName: 'actions', width: 120, align: 'center' },
]

function clearSelection() {
  selectedKeys.value = []
}

const signModalVisible = ref(false)
const editSignIndex = ref(-1)
const signForm = ref({ name: '', source: '', usage: '自用', qualName: '' })

function openSignModal(record, index) {
  if (record) {
    editSignIndex.value = index
    signForm.value = { name: record.name, source: record.source, usage: '自用', qualName: record.qual }
  } else {
    editSignIndex.value = -1
    signForm.value = { name: '', source: '', usage: '自用', qualName: '' }
  }
  signModalVisible.value = true
}

function handleSignOk() {
  if (!signForm.value.name || !signForm.value.source) { Message.error('请填写必填项'); return }
  if (editSignIndex.value >= 0) {
    Object.assign(signList.value[editSignIndex.value], {
      name: signForm.value.name,
      source: signForm.value.source,
      qual: signForm.value.qualName,
      updateTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    })
    Message.success('编辑成功')
  } else {
    signList.value.push({
      id: `SG${String(signList.value.length + 1).padStart(3, '0')}`,
      name: signForm.value.name,
      source: signForm.value.source,
      qual: signForm.value.qualName,
      status: '审核中',
      createTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      updateTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    })
    Message.success('添加成功')
  }
  signModalVisible.value = false
}

function deleteSign(index) {
  const record = signList.value[index]
  Modal.confirm({
    title: '确认删除',
    content: `您即将删除签名"${record.name}"，此操作不可逆，是否继续？`,
    okText: '确认删除',
    okButtonProps: { status: 'danger' },
    cancelText: '取消',
    onOk: () => {
      signList.value.splice(index, 1)
      Message.success('删除成功')
    },
  })
}

function batchDelete() {
  if (selectedKeys.value.length === 0) {
    Message.warning('请先选择要删除的签名')
    return
  }
  Modal.confirm({
    title: '确认批量删除',
    content: `您即将删除 ${selectedKeys.value.length} 个签名，此操作不可逆，是否继续？`,
    okText: '确认删除',
    okButtonProps: { status: 'danger' },
    cancelText: '取消',
    onOk: () => {
      signList.value = signList.value.filter(item => !selectedKeys.value.includes(item.id))
      selectedKeys.value = []
      Message.success('批量删除成功')
    },
  })
}
</script>

<style scoped>
.page-container {
  background: #f5f6f7;
  min-height: calc(100vh - 56px);
  padding: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}
</style>
