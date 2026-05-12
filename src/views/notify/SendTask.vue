<template>
  <div class="page-container">
    <!-- 产品Tab - 内联实现 -->
    <div class="product-tabs-wrapper">
      <div class="custom-tabs">
        <div
          v-for="p in products"
          :key="p.id"
          :class="['tab-item', { active: activeProduct === p.id }]"
          @click="activeProduct = p.id"
        >
          {{ p.name }}
        </div>
      </div>
    </div>

    <!-- 搜索栏 -->
    <SearchToolbar placeholder="搜索任务名称" @search="handleSearch">
      <template #actions>
        <a-button type="primary" @click="goCreate">
          <template #icon><icon-plus /></template>
          新建任务
        </a-button>
      </template>
    </SearchToolbar>

    <!-- 批量操作栏 -->
    <BatchBar :selectedCount="selectedKeys.length" @cancel="clearSelection">
      <template #actions>
        <a-button size="small" type="outline" status="success" @click="batchExecute">批量执行</a-button>
        <a-button size="small" type="outline" status="warning" @click="batchPause">批量暂停</a-button>
        <a-button size="small" type="outline" status="danger" @click="batchCancel">批量取消</a-button>
      </template>
    </BatchBar>

    <!-- 表格 -->
    <a-card :bordered="false">
      <a-table :columns="columns" :data="filteredList" :pagination="pagination" :row-selection="{ type: 'checkbox', showCheckedAll: true }" v-model:selectedKeys="selectedKeys" row-key="id" stripe @filter-change="handleFilterChange" :scroll="{ x: 1200 }">
        <template #status="{ record }">
          <a-tag :color="taskStatusColor[record.status]" size="small">{{ record.status }}</a-tag>
        </template>
        <template #actions="{ record }">
          <div class="table-actions">
            <a-link @click="goDetail(record)">详情</a-link>
            <a-link v-if="record.status === '执行中'" status="warning" @click="changeStatus(record, '已暂停')">暂停</a-link>
            <a-link v-if="record.status === '待执行' || record.status === '已暂停'" status="success" @click="confirmExecute(record)">执行</a-link>
            <a-link v-if="record.status !== '已完成' && record.status !== '已取消'" status="danger" @click="confirmCancel(record)">取消</a-link>
          </div>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import { products, sendTasks } from '../../mock/data.js'
import SearchToolbar from '../../components/SearchToolbar.vue'
import BatchBar from '../../components/BatchBar.vue'

const router = useRouter()
const activeProduct = ref('P001')
const searchText = ref('')
const typeFilter = ref('')
const methodFilter = ref('')
const statusFilter = ref('')
const selectedKeys = ref([])

const tableData = ref(JSON.parse(JSON.stringify(sendTasks)))

const taskStatusColor = { '已完成': 'green', '待执行': 'blue', '执行中': 'orange', '已暂停': 'gray', '已取消': 'red' }

const pagination = ref({ pageSize: 20, showTotal: true, showPageSize: true })

const columns = [
  { title: '任务ID', dataIndex: 'id', width: 110, ellipsis: true, tooltip: true },
  { title: '名称', dataIndex: 'name', width: 150, ellipsis: true, tooltip: true },
  { 
    title: '类型', 
    dataIndex: 'method', 
    width: 110, 
    ellipsis: true, 
    tooltip: true,
    filterable: {
      filters: [
        { text: '短信', value: '短信' },
        { text: '邮件', value: '邮件' },
      ],
      multiple: false,
      alignLeft: true,
    }
  },
  { 
    title: '发送方式', 
    dataIndex: 'type', 
    width: 120, 
    ellipsis: true, 
    tooltip: true,
    filterable: {
      filters: [
        { text: '立即发送', value: '立即发送' },
        { text: '定时发送', value: '定时发送' },
      ],
      multiple: false,
      alignLeft: true,
    }
  },
  { title: '发送模板', dataIndex: 'template', width: 130, ellipsis: true, tooltip: true },
  { title: '目标人数', dataIndex: 'targetCount', width: 110 },
  { 
    title: '状态', 
    slotName: 'status', 
    dataIndex: 'status',
    width: 110,
    filterable: {
      filters: [
        { text: '待执行', value: '待执行' },
        { text: '执行中', value: '执行中' },
        { text: '已完成', value: '已完成' },
        { text: '已暂停', value: '已暂停' },
        { text: '已取消', value: '已取消' },
      ],
      multiple: false,
      alignLeft: true,
    }
  },
  { 
    title: '创建时间', 
    dataIndex: 'createTime', 
    width: 170, 
    ellipsis: true, 
    tooltip: true,
    sortable: {
      sortDirections: ['ascend', 'descend'],
    }
  },
  { title: '操作', slotName: 'actions', width: 200, fixed: 'right' },
]

const filteredList = computed(() => {
  let list = tableData.value
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(t => t.name.toLowerCase().includes(kw))
  }
  if (typeFilter.value) {
    list = list.filter(t => t.method === typeFilter.value)
  }
  if (methodFilter.value) {
    list = list.filter(t => t.type === methodFilter.value)
  }
  if (statusFilter.value) {
    list = list.filter(t => t.status === statusFilter.value)
  }
  return list
})

function handleFilterChange(dataIndex, filteredValues) {
  if (dataIndex === 'method') {
    typeFilter.value = filteredValues[0] || ''
  } else if (dataIndex === 'type') {
    methodFilter.value = filteredValues[0] || ''
  } else if (dataIndex === 'status') {
    statusFilter.value = filteredValues[0] || ''
  }
}

function handleSearch(val) {
  searchText.value = val
}

function confirmExecute(record) {
  Modal.confirm({
    title: '确认执行',
    content: `确定要执行任务「${record.name}」吗？`,
    onOk: () => {
      changeStatus(record, '执行中')
    }
  })
}

function confirmCancel(record) {
  Modal.confirm({
    title: '确认取消',
    content: `确定要取消任务「${record.name}」吗？取消后任务将停止执行。`,
    onOk: () => {
      changeStatus(record, '已取消')
    }
  })
}

function changeStatus(record, newStatus) {
  record.status = newStatus
  Message.success(`任务已${newStatus}`)
}

function batchExecute() {
  if (selectedKeys.value.length === 0) {
    Message.warning('请选择要执行的任务')
    return
  }
  const canExecute = selectedKeys.value.filter(key => {
    const task = tableData.value.find(t => t.id === key)
    return task && (task.status === '待执行' || task.status === '已暂停')
  })
  if (canExecute.length === 0) {
    Message.warning('选中的任务中没有可执行的任务（仅待执行或已暂停状态可执行）')
    return
  }
  Modal.confirm({
    title: '确认批量执行',
    content: `确定要执行选中的 ${canExecute.length} 个任务吗？`,
    onOk: () => {
      let count = 0
      canExecute.forEach(key => {
        const task = tableData.value.find(t => t.id === key)
        if (task) {
          task.status = '执行中'
          count++
        }
      })
      Message.success(`已成功执行 ${count} 个任务`)
      selectedKeys.value = []
    }
  })
}

function batchPause() {
  if (selectedKeys.value.length === 0) {
    Message.warning('请选择要暂停的任务')
    return
  }
  const canPause = selectedKeys.value.filter(key => {
    const task = tableData.value.find(t => t.id === key)
    return task && task.status === '执行中'
  })
  if (canPause.length === 0) {
    Message.warning('选中的任务中没有可暂停的任务（仅执行中状态可暂停）')
    return
  }
  Modal.confirm({
    title: '确认批量暂停',
    content: `确定要暂停选中的 ${canPause.length} 个任务吗？`,
    onOk: () => {
      let count = 0
      canPause.forEach(key => {
        const task = tableData.value.find(t => t.id === key)
        if (task) {
          task.status = '已暂停'
          count++
        }
      })
      Message.success(`已成功暂停 ${count} 个任务`)
      selectedKeys.value = []
    }
  })
}

function batchCancel() {
  if (selectedKeys.value.length === 0) {
    Message.warning('请选择要取消的任务')
    return
  }
  const canCancel = selectedKeys.value.filter(key => {
    const task = tableData.value.find(t => t.id === key)
    return task && task.status !== '已完成' && task.status !== '已取消'
  })
  if (canCancel.length === 0) {
    Message.warning('选中的任务中没有可取消的任务')
    return
  }
  Modal.confirm({
    title: '确认批量取消',
    content: `确定要取消选中的 ${canCancel.length} 个任务吗？取消后任务将停止执行。`,
    onOk: () => {
      let count = 0
      canCancel.forEach(key => {
        const task = tableData.value.find(t => t.id === key)
        if (task) {
          task.status = '已取消'
          count++
        }
      })
      Message.success(`已成功取消 ${count} 个任务`)
      selectedKeys.value = []
    }
  })
}

function clearSelection() {
  selectedKeys.value = []
}

function goDetail(record) {
  router.push(`/notify/task/detail/${record.id}`)
}

function goCreate() {
  router.push('/notify/task/create')
}
</script>

<style scoped>
.page-container {
  background: #f5f6f7;
  min-height: calc(100vh - 56px);
  padding: 20px;
}

/* 内联 ProductTabs */
.product-tabs-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.custom-tabs {
  display: flex;
  gap: 8px;
}

.tab-item {
  padding: 8px 20px;
  font-size: 14px;
  color: #4e5969;
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.2s;
}

.tab-item:hover { color: #165dff; }

.tab-item.active {
  background: #f2f3f5;
  color: #165dff;
  font-weight: 500;
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

:deep(.arco-table-cell-fixed-right) {
  background: #fff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.08);
}

:deep(.arco-table-tr:hover .arco-table-cell-fixed-right) {
  background: #f5f6f7;
}

:deep(.arco-table-cell-fixed-right::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 20px;
  background: linear-gradient(to right, rgba(0,0,0,0.02), transparent);
  pointer-events: none;
}
</style>
