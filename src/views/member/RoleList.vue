<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <SearchToolbar placeholder="搜索角色名称" @search="handleSearch">
      <template #actions>
        <a-button type="primary" @click="goCreate">
          <template #icon><icon-plus /></template>
          创建角色
        </a-button>
      </template>
    </SearchToolbar>

    <!-- 批量操作栏 -->
    <BatchBar :selectedCount="selectedKeys.length" @cancel="clearSelection">
      <template #actions>
        <a-button size="small" type="outline" @click="batchToggle(true)">批量启用</a-button>
        <a-button size="small" type="outline" @click="batchToggle(false)">批量禁用</a-button>
        <a-button size="small" type="outline" status="danger" @click="batchDelete">批量删除</a-button>
      </template>
    </BatchBar>

    <!-- 数据表格 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data="filteredData"
        :pagination="{ pageSize: 20, showTotal: true, showPageSize: true }"
        :scroll="{ x: 1250 }"
        row-key="id"
        stripe
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
        v-model:selectedKeys="selectedKeys"
      >
        <template #name="{ record }">
          <div class="role-name-cell">
            <span>{{ record.name }}</span>
            <a-tag v-if="record.builtin" size="small" color="arcoblue">系统内置</a-tag>
          </div>
        </template>

        <template #status="{ record }">
          <a-switch
            v-model="record.status"
            :before-change="() => confirmToggle(record)"
            checked-text="启用"
            unchecked-text="禁用"
            :disabled="record.builtin"
          />
        </template>

        <template #actions="{ record }">
          <div class="table-actions">
            <a-link
              @click="goEdit(record)"
              :disabled="record.builtin"
            >编辑</a-link>
            <a-popconfirm
              v-if="!record.builtin"
              content="确认删除该角色？此操作不可恢复。"
              @ok="handleDelete(record)"
              type="warning"
            >
              <a-link status="danger">删除</a-link>
            </a-popconfirm>
            <a-tooltip v-else content="系统内置角色不可删除">
              <a-link disabled>删除</a-link>
            </a-tooltip>
          </div>
        </template>
      </a-table>
    </a-card>

    <!-- 详情抽屉 -->
    <a-drawer
      v-model:visible="detailVisible"
      title="角色详情"
      :width="480"
    >
      <template v-if="detailRecord">
        <a-descriptions :column="1" :label-style="{ width: '100px' }">
          <a-descriptions-item label="角色名称">
            {{ detailRecord.name }}
            <a-tag v-if="detailRecord.builtin" size="small" color="arcoblue" style="margin-left: 8px">系统内置</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="描述">{{ detailRecord.desc }}</a-descriptions-item>
          <a-descriptions-item label="角色归属">{{ detailRecord.belong }}</a-descriptions-item>
          <a-descriptions-item label="关联成员数">{{ detailRecord.memberCount }} 人</a-descriptions-item>
          <a-descriptions-item label="创建人">{{ detailRecord.creator }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ detailRecord.createTime }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-badge :status="detailRecord.status ? 'success' : 'default'" :text="detailRecord.status ? '启用' : '禁用'" />
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </a-drawer>

    <!-- 启用/禁用确认 -->
    <a-modal
      v-model:visible="toggleConfirmVisible"
      :title="toggleTarget?.status ? '确认禁用' : '确认启用'"
      :width="360"
      @ok="doToggle"
      @cancel="cancelToggle"
    >
      <p>
        确定要{{ toggleTarget?.status ? '禁用' : '启用' }}角色
        <strong>{{ toggleTarget?.name }}</strong> 吗？
      </p>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import { roles as rawRoles } from '../../mock/data.js'
import SearchToolbar from '../../components/SearchToolbar.vue'
import BatchBar from '../../components/BatchBar.vue'

const router = useRouter()
const tableData = ref(JSON.parse(JSON.stringify(rawRoles)))
const searchText = ref('')
const selectedKeys = ref([])

const filteredData = computed(() => {
  const kw = searchText.value.trim().toLowerCase()
  if (!kw) return tableData.value
  return tableData.value.filter(r => r.name.toLowerCase().includes(kw))
})

const columns = [
  { title: '角色名称', slotName: 'name', width: 180 },
  { title: '描述', dataIndex: 'desc', width: 200 },
  { title: '关联成员数', dataIndex: 'memberCount', width: 120, align: 'center' },
  { title: '角色归属', dataIndex: 'belong', width: 120 },
  { title: '创建人', dataIndex: 'creator', width: 120 },
  { title: '创建时间', dataIndex: 'createTime', width: 180, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '状态', slotName: 'status', width: 90, align: 'center' },
  { title: '操作', slotName: 'actions', width: 170, fixed: 'right' }
]

function handleSearch(value) {
  searchText.value = value
}

function goCreate() {
  router.push({ name: 'RoleEdit' })
}

function goEdit(record) {
  if (record.builtin) {
    Message.warning('系统内置角色不可编辑')
    return
  }
  router.push({ name: 'RoleEdit', params: { id: record.id } })
}

const detailVisible = ref(false)
const detailRecord = ref(null)

function goDetail(record) {
  detailRecord.value = record
  detailVisible.value = true
}

function handleDelete(record) {
  tableData.value = tableData.value.filter(r => r.id !== record.id)
  Message.success(`已删除角色 ${record.name}`)
}

const toggleConfirmVisible = ref(false)
const toggleTarget = ref(null)
let toggleResolve = null

function confirmToggle(record) {
  return new Promise((resolve) => {
    toggleTarget.value = record
    toggleResolve = resolve
    toggleConfirmVisible.value = true
  })
}

function doToggle() {
  toggleResolve?.(true)
  toggleConfirmVisible.value = false
  Message.success(`${toggleTarget.value?.name} 已${!toggleTarget.value?.status ? '启用' : '禁用'}`)
  toggleTarget.value = null
}

function cancelToggle() {
  toggleResolve?.(false)
  toggleConfirmVisible.value = false
  toggleTarget.value = null
}

function batchToggle(status) {
  let count = 0
  selectedKeys.value.forEach(key => {
    const item = tableData.value.find(r => r.id === key)
    if (item && !item.builtin) {
      item.status = status
      count++
    }
  })
  Message.success(`已${status ? '启用' : '禁用'} ${count} 个角色`)
}

function batchDelete() {
  const toDelete = selectedKeys.value.filter(id => {
    const r = tableData.value.find(r => r.id === id)
    return r && !r.builtin
  })
  tableData.value = tableData.value.filter(r => !toDelete.includes(r.id))
  selectedKeys.value = []
  Message.success(`已删除 ${toDelete.length} 个角色`)
}

function clearSelection() {
  selectedKeys.value = []
}
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #f5f6f7;
  min-height: calc(100vh - 56px);
}

.role-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
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
