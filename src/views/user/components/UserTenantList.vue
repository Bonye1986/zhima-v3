<template>
  <div class="tenant-list-container">
    <a-table
      :columns="columns"
      :data="filteredTenants"
      :pagination="pagination"
      row-key="tenantId"
      stripe
    >
      <template #tenantName="{ record }">
        <div class="tenant-name-text">{{ record.tenantName }}</div>
      </template>
      <template #role="{ record }">
        <a-tag :color="roleColor(record.role)">{{ record.role }}</a-tag>
      </template>
      <template #teamPoints="{ record }">
        <span :class="{ 'low-points': (record.teamPoints || 0) < 100 }">
          {{ (record.teamPoints || 0).toLocaleString() }}
        </span>
      </template>
      <template #actions="{ record }">
        <div class="table-actions">
          <a-button type="text" size="small" @click="showTenantDetail(record)">详情</a-button>
          <a-button v-if="!record.isMySpace && record.role !== '团队超级管理员'" type="text" size="small" @click="handleExit(record)">退出</a-button>
        </div>
      </template>
    </a-table>

    <!-- 租户空间详情弹窗 — 所有编辑都 inline -->
    <a-modal
      v-model:visible="detailModalVisible"
      title="租户空间详情"
      :width="900"
      :footer="false"
    >
      <div class="detail-content" v-if="currentTenant">
        <!-- Header -->
        <div class="detail-header">
          <div class="tenant-header-row">
            <div class="tenant-header-left">
              <div v-if="isEditing" class="tenant-title-name">
                <a-input v-model="editSnapshot.tenantName" style="width: 220px;" />
              </div>
              <div v-else class="tenant-title-name">{{ currentTenant.tenantName }}</div>
              <div class="tenant-title-id">ID: {{ currentTenant.tenantId }}</div>
            </div>
            <div class="tenant-actions">
              <a-button v-if="!isEditing" size="small" @click="startEdit">
                <template #icon><icon-edit /></template>
                编辑
              </a-button>
              <a-space v-else>
                <a-button size="small" @click="cancelEdit">取消</a-button>
                <a-button type="primary" size="small" @click="saveEdit">保存</a-button>
              </a-space>
            </div>
          </div>
          <div class="tenant-stats-row">
            <div class="stat-item">
              <span class="stat-label">团队剩余点数</span>
              <span class="stat-value highlight">{{ (currentTenant.tenantInfo?.remainingPoints ?? 0).toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">创建时间</span>
              <span class="stat-value">{{ currentTenant.tenantInfo?.createTime || '—' }}</span>
            </div>
          </div>
        </div>

        <a-divider />

        <!-- 成员列表 -->
        <div class="members-section">
          <div class="section-header">
            <span class="section-title">成员列表</span>
            <span class="section-count">共 {{ editMembers.length }} 人</span>
          </div>
          <a-table
            :columns="isEditing ? memberColumnsEdit : memberColumnsView"
            :data="editMembers"
            :pagination="{ pageSize: 10, showTotal: true }"
            row-key="userId"
            stripe
            size="small"
          >
            <template #userName="{ record }">
              <span class="user-name">{{ record.userName }}</span>
            </template>
            <template #role="{ record }">
              <a-tag :color="roleColor(record.role)" size="small">{{ record.role }}</a-tag>
            </template>
            <template #teamPoints="{ record }">
              <span :class="{ 'low-points': (record.teamPoints || 0) < 100 }">
                {{ (record.teamPoints || 0).toLocaleString() }}
              </span>
            </template>
            <template #roleEdit="{ record }">
              <a-select v-model="record.role" size="small" style="width: 130px;">
                <a-option v-for="r in roleOptions" :key="r" :value="r">{{ r }}</a-option>
              </a-select>
            </template>
            <template #teamPointsEdit="{ record }">
              <a-input-number v-model="record.teamPoints" :min="0" :step="100" size="small" style="width: 120px;" />
            </template>
            <template #actionsEdit="{ record }">
              <a-button v-if="!record.isCreator" type="text" size="small" status="danger" @click="removeMember(record)">移除</a-button>
              <span v-else style="color:#c9cdd4;">—</span>
            </template>
          </a-table>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { IconEdit } from '@arco-design/web-vue/es/icon'
import { users, tenants } from '../../../mock/data'

const props = defineProps({
  userId: { type: String, required: true },
})

const columns = [
  { title: '租户空间ID', dataIndex: 'tenantId', width: 220 },
  { title: '租户空间名称', slotName: 'tenantName', width: 260 },
  { title: '团队身份', slotName: 'role', width: 120 },
  { title: '可用团队点数', slotName: 'teamPoints', width: 120, align: 'right' },
  { title: '加入团队时间', dataIndex: 'joinTime', width: 180 },
  { title: '操作', slotName: 'actions', width: 150, fixed: 'right' },
]

const memberColumnsView = [
  { title: '用户ID', dataIndex: 'userId', width: 120 },
  { title: '用户名称', slotName: 'userName', width: 160 },
  { title: '用户账号', dataIndex: 'userAccount', width: 140 },
  { title: '团队身份', slotName: 'role', width: 120 },
  { title: '可用团队点数', slotName: 'teamPoints', width: 120, align: 'right' },
  { title: '加入团队时间', dataIndex: 'joinTime', width: 180 },
]

const memberColumnsEdit = [
  { title: '用户ID', dataIndex: 'userId', width: 120 },
  { title: '用户名称', slotName: 'userName', width: 160 },
  { title: '用户账号', dataIndex: 'userAccount', width: 140 },
  { title: '团队身份', slotName: 'roleEdit', width: 160 },
  { title: '可用团队点数', slotName: 'teamPointsEdit', width: 150 },
  { title: '操作', slotName: 'actionsEdit', width: 100, fixed: 'right' },
]

const roleOptions = ['团队超级管理员', '管理员', '成员', '访客', '翻译人员', '校对人员']

const pagination = ref({ total: 0, current: 1, pageSize: 20, showTotal: true, showPageSize: true })

const detailModalVisible = ref(false)
const currentTenant = ref(null)
const isEditing = ref(false)

const editSnapshot = ref({ tenantName: '' })
const editMembers = ref([])

const userTenants = ref([])

function buildUserTenants() {
  const user = users.find(u => u.id === props.userId)
  if (!user) { userTenants.value = []; pagination.value.total = 0; return }
  const tenantIds = user.tenants || []
  if (tenantIds.length === 0) { userTenants.value = []; pagination.value.total = 0; return }

  const personalEntry = {
    tenantId: `PS_${user.id}`,
    tenantName: `${user.name} 空间`,
    role: '创建者',
    teamPoints: user.balance || 0,
    joinTime: user.createTime,
    tenantInfo: { remainingPoints: user.balance || 0, createTime: user.createTime },
    isMySpace: true,
  }

  const tenantEntries = tenantIds.map((tid, idx) => {
    const t = tenants.find(x => x.id === tid)
    const r = user.tenantRoles.find(tr => tr.tenant === tid)
    return {
      tenantId: tid,
      tenantName: `${t?.name || tid} 空间`,
      role: r?.role || '成员',
      teamPoints: user.balance || 0,
      joinTime: user.createTime,
      tenantInfo: { remainingPoints: t?.balance || 0, createTime: t?.createTime },
      isMySpace: idx === 0,
    }
  })

  userTenants.value = [personalEntry, ...tenantEntries]
  pagination.value.total = userTenants.value.length
}

watch(() => props.userId, () => { buildUserTenants() }, { immediate: true })

const filteredTenants = computed(() => userTenants.value)

const memberMapping = {
  'T001': [
    { userId: 'U10001', userName: '刘一', userAccount: '13800001111', role: '管理员', teamPoints: 1200, joinTime: '2026-01-20 08:00:00' },
    { userId: 'matou_12345', userName: '张三', userAccount: '13800123456', role: '成员', teamPoints: 5000, joinTime: '2026-02-15 10:30:00' },
    { userId: 'U10003', userName: '周三', userAccount: '13800003333', role: '成员', teamPoints: 800, joinTime: '2026-03-10 15:00:00' },
    { userId: 'U10004', userName: '吴四', userAccount: '13800004444', role: '成员', teamPoints: 8000, joinTime: '2026-01-05 09:30:00' },
  ],
  'T002': [
    { userId: 'U10004', userName: '吴四', userAccount: '13800004444', role: '管理员', teamPoints: 1500, joinTime: '2026-02-20 11:00:00' },
    { userId: 'U10005', userName: '郑五', userAccount: '13800005555', role: '成员', teamPoints: 600, joinTime: '2026-03-01 08:30:00' },
  ],
  'T003': [
    { userId: 'U10001', userName: '刘一', userAccount: '13800001111', role: '成员', teamPoints: 500, joinTime: '2026-03-15 10:00:00' },
    { userId: 'U10003', userName: '周三', userAccount: '13800003333', role: '成员', teamPoints: 200, joinTime: '2026-04-10 14:00:00' },
    { userId: 'U10005', userName: '郑五', userAccount: '13800005555', role: '成员', teamPoints: 400, joinTime: '2026-03-25 16:00:00' },
  ],
  'T004': [
    { userId: 'matou_12345', userName: '张三', userAccount: '13800123456', role: '管理员', teamPoints: 3000, joinTime: '2026-04-01 09:00:00' },
  ],
}

function loadMembers(record) {
  const user = users.find(u => u.id === props.userId)
  if (!user) return []
  if (record.tenantId.startsWith('PS_')) {
    return [{
      userId: user.id, userName: user.name, userAccount: user.account,
      role: '创建者', teamPoints: user.balance || 0, joinTime: user.createTime, isCreator: true,
    }]
  }
  return (memberMapping[record.tenantId] || []).map(m => ({
    ...m, teamPoints: m.teamPoints ?? 0, isCreator: m.role === '创建者',
  }))
}

function showTenantDetail(record) {
  currentTenant.value = record
  isEditing.value = false
  editMembers.value = loadMembers(record)
  detailModalVisible.value = true
}

function startEdit() {
  if (!currentTenant.value) return
  editSnapshot.value = { tenantName: currentTenant.value.tenantName }
  editMembers.value = loadMembers(currentTenant.value).map(m => ({ ...m }))
  isEditing.value = true
}

function cancelEdit() {
  editMembers.value = loadMembers(currentTenant.value)
  isEditing.value = false
}

function saveEdit() {
  if (!currentTenant.value) return
  currentTenant.value.tenantName = editSnapshot.value.tenantName
  const idx = userTenants.value.findIndex(t => t.tenantId === currentTenant.value.tenantId)
  if (idx >= 0) {
    userTenants.value[idx].tenantName = editSnapshot.value.tenantName
  }
  isEditing.value = false
  Message.success('保存成功')
}

function removeMember(record) {
  Modal.confirm({
    title: '确认移除',
    content: `确定将 ${record.userName} 移出该空间？`,
    onOk: () => {
      editMembers.value = editMembers.value.filter(m => m.userId !== record.userId)
      Message.success('已移除')
    },
  })
}

function roleColor(role) {
  const map = {
    '团队超级管理员': '#f53f3f', '创建者': '#f53f3f', '超级管理员': '#f53f3f',
    '管理员': '#ff7d00', '成员': '#1890ff', '访客': '#8c8c8c',
    '翻译人员': '#00b42a', '校对人员': '#722ed1',
  }
  return map[role] || 'arcoblue'
}

function handleExit(record) {
  if (record.isMySpace) return
  Message.info(`退出租户 ${record.tenantName}`)
}
</script>

<style scoped>
.tenant-list-container {
  margin-top: 16px;
}

.tenant-name-text {
  font-weight: 500;
  color: #1d2129;
}

.low-points {
  color: #f53f3f;
  font-weight: 600;
}

.detail-content {
  padding: 8px 0;
}

.detail-header {
  margin-bottom: 16px;
}

.tenant-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.tenant-header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tenant-title-name {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}

.tenant-title-id {
  font-size: 13px;
  color: #86909c;
}

.tenant-stats-row {
  display: flex;
  gap: 32px;
  margin-top: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 13px;
  color: #86909c;
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
}

.stat-value.highlight {
  color: #165DFF;
  font-size: 20px;
  font-weight: 600;
}

.members-section {
  margin-top: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
}

.section-count {
  font-size: 13px;
  color: #86909c;
}

.user-name {
  font-weight: 500;
  color: #1d2129;
  font-size: 13px;
}

.table-actions {
  display: flex;
  gap: 4px;
  padding: 0 6px;
}
</style>
