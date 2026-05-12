<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <SearchToolbar placeholder="搜索姓名或账号" @search="handleSearch">
      <template #actions>
        <a-button type="primary" @click="goCreate">
          <template #icon><icon-plus /></template>
          创建成员
        </a-button>
        <a-button @click="handleExport">
          <template #icon><icon-download /></template>
          导出
        </a-button>
      </template>
    </SearchToolbar>

    <!-- 批量操作栏 -->
    <BatchBar :selectedCount="selectedKeys.length" @cancel="selectedKeys = []">
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
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
        v-model:selectedKeys="selectedKeys"
        :pagination="{ pageSize: 20, showTotal: true, showPageSize: true }"
        :scroll="{ x: 1200 }"
        row-key="id"
        stripe
        :key="tableKey"
      >
        <template #expireTime="{ record }">
          <a-tag v-if="record.expireTime === '永久'" color="green" style="font-size: 14px; line-height: 1.5;">永久</a-tag>
          <a-tag v-else-if="isExpired(record.expireTime)" color="red" style="white-space: nowrap; font-size: 14px; line-height: 1.5;">
            {{ formatExpireTime(record.expireTime) }}（已过期）
          </a-tag>
          <span v-else style="white-space: nowrap; font-size: 14px; line-height: 1.5;">{{ formatExpireTime(record.expireTime) }}</span>
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
            <a-link @click="goEdit(record)">编辑</a-link>
            <a-popconfirm
              content="确认删除该成员？此操作不可恢复。"
              @ok="handleDelete(record)"
              type="warning"
              position="left"
            >
              <a-link status="danger" @click.stop>删除</a-link>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
    </a-card>

    <!-- 启用/禁用确认 -->
    <a-modal
      v-model:visible="toggleConfirmVisible"
      :title="toggleTarget?.status ? '确认禁用' : '确认启用'"
      :width="360"
      @ok="doToggle"
      @cancel="cancelToggle"
    >
      <p>
        确定要{{ toggleTarget?.status ? '禁用' : '启用' }}
        <strong>{{ toggleTarget?.name }}</strong> 吗？
      </p>
    </a-modal>

    <!-- 批量操作确认 -->
    <a-modal
      v-model:visible="batchConfirmVisible"
      :title="batchAction.title"
      :width="400"
      @ok="doBatchAction"
    >
      <p>{{ batchAction.message }}</p>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconPlus, IconDownload } from '@arco-design/web-vue/es/icon'
import { members as rawMembers, products, roles } from '../../mock/data.js'
import SearchToolbar from '../../components/SearchToolbar.vue'
import BatchBar from '../../components/BatchBar.vue'

const router = useRouter()

const tableData = ref(JSON.parse(JSON.stringify(rawMembers)))
const searchText = ref('')
const selectedKeys = ref([])
const tableKey = ref(0)

const filteredData = computed(() => {
  const kw = searchText.value.trim().toLowerCase()
  if (!kw) return tableData.value
  return tableData.value.filter(
    m => m.name.toLowerCase().includes(kw) || m.account.toLowerCase().includes(kw)
  )
})

const columns = [
  { title: '姓名', dataIndex: 'name', width: 100 },
  { title: '账号', dataIndex: 'account', width: 140 },
  { title: '成员ID', dataIndex: 'id', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', width: 180, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '授权产品', dataIndex: 'authProducts', width: 100, align: 'center' },
  { title: '过期时间', slotName: 'expireTime', width: 240, sortable: { sortDirections: ['ascend', 'descend'], sorter: (a, b) => {
    if (a.expireTime === '永久') return 1
    if (b.expireTime === '永久') return -1
    return a.expireTime.localeCompare(b.expireTime)
  } } },
  { title: '状态', slotName: 'status', width: 90, align: 'center' },
  { title: '操作', slotName: 'actions', width: 170, fixed: 'right' },
]

function handleSearch(value) {
  searchText.value = value
  tableKey.value++
}

function goCreate() {
  router.push('/member/create')
}

function goEdit(record) {
  router.push(`/member/edit/${record.id}`)
}

function handleExport() {
  Message.success('导出成功')
}

function formatExpireTime(time) {
  if (time === '永久') return '永久'
  return time
}

function isExpired(time) {
  if (time === '永久') return false
  return new Date(time) < new Date()
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
  const name = toggleTarget.value?.name
  const newStatus = !toggleTarget.value?.status
  Message.success(`${name} 已${newStatus ? '启用' : '禁用'}`)
}

function cancelToggle() {
  toggleResolve?.(false)
  toggleConfirmVisible.value = false
}

function handleDelete(record) {
  tableData.value = tableData.value.filter(m => m.id !== record.id)
  Message.success('删除成功')
}

const batchConfirmVisible = ref(false)
const batchAction = reactive({ title: '', message: '', action: null })

function batchToggle(enable) {
  batchAction.title = enable ? '批量启用' : '批量禁用'
  batchAction.message = `确定要${enable ? '启用' : '禁用'}选中的 ${selectedKeys.value.length} 个成员吗？`
  batchAction.action = () => {
    selectedKeys.value.forEach(id => {
      const m = tableData.value.find(x => x.id === id)
      if (m) m.status = enable
    })
    Message.success(`已${enable ? '启用' : '禁用'} ${selectedKeys.value.length} 个成员`)
    selectedKeys.value = []
  }
  batchConfirmVisible.value = true
}

function batchDelete() {
  batchAction.title = '批量删除'
  batchAction.message = `确定要删除选中的 ${selectedKeys.value.length} 个成员吗？此操作不可恢复。`
  batchAction.action = () => {
    tableData.value = tableData.value.filter(m => !selectedKeys.value.includes(m.id))
    Message.success(`已删除 ${selectedKeys.value.length} 个成员`)
    selectedKeys.value = []
  }
  batchConfirmVisible.value = true
}

function doBatchAction() {
  batchAction.action?.()
  batchConfirmVisible.value = false
}
</script>

<style scoped>
.page-container {
  padding: 20px;
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
