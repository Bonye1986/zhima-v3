<template>
  <div class="page-container">
    <!-- 筛选器 -->
    <SearchToolbar placeholder="搜索操作描述" @search="handleSearch">
      <template #extra>
        <a-range-picker v-model="filters.dateRange" :placeholder="['开始', '结束']" style="width: 240px" />
        <a-input v-model="filters.operator" placeholder="操作人" allow-clear style="width: 140px" />
        <a-select v-model="filters.system" placeholder="系统模块" allow-clear style="width: 140px">
          <a-option value="成员管理">成员管理</a-option>
          <a-option value="用户管理">用户管理</a-option>
          <a-option value="订单管理">订单管理</a-option>
          <a-option value="商品管理">商品管理</a-option>
          <a-option value="通知管理">通知管理</a-option>
          <a-option value="财务管理">财务管理</a-option>
        </a-select>
        <a-select v-model="filters.type" placeholder="操作类型" allow-clear style="width: 120px">
          <a-option value="CREATE">创建</a-option>
          <a-option value="UPDATE">更新</a-option>
          <a-option value="DELETE">删除</a-option>
          <a-option value="DISABLE">禁用</a-option>
          <a-option value="ENABLE">启用</a-option>
        </a-select>
        <a-select v-model="filters.target" placeholder="操作对象" allow-clear style="width: 120px">
          <a-option value="后台成员">后台成员</a-option>
          <a-option value="用户">用户</a-option>
          <a-option value="订单">订单</a-option>
          <a-option value="SKU">SKU</a-option>
          <a-option value="通知任务">通知任务</a-option>
        </a-select>
      </template>
      <template #actions>
        <a-button type="primary" @click="handleSearch">查询</a-button>
        <a-button @click="resetFilters">重置</a-button>
        <a-button @click="handleExport">
          <template #icon><icon-download /></template>
          导出
        </a-button>
      </template>
    </SearchToolbar>

    <!-- 批量操作栏 -->
    <BatchBar :selectedCount="selectedKeys.length" @cancel="clearSelection">
      <template #actions>
        <a-button size="small" type="primary" @click="batchExport">
          <template #icon><icon-download /></template>
          批量导出
        </a-button>
      </template>
    </BatchBar>

    <!-- 表格 -->
    <a-card :bordered="false">
      <a-table :columns="columns" :data="filteredLogs" :pagination="pagination" :row-selection="{ type: 'checkbox', showCheckedAll: true }" v-model:selectedKeys="selectedKeys" row-key="time" :scroll="{ x: 1400 }" stripe>
        <template #type="{ record }">
          <a-tag :color="typeColorMap[record.type] || 'gray'" size="small">{{ typeNameMap[record.type] || record.type }}</a-tag>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconDownload } from '@arco-design/web-vue/es/icon'
import { operationLogs } from '../../mock/data.js'
import SearchToolbar from '../../components/SearchToolbar.vue'
import BatchBar from '../../components/BatchBar.vue'

const tableData = ref(JSON.parse(JSON.stringify(operationLogs)))
const selectedKeys = ref([])

const filters = ref({
  dateRange: [],
  operator: '',
  system: undefined,
  type: undefined,
  target: undefined,
})

const pagination = ref({ pageSize: 20, showTotal: true, showPageSize: true })

const typeColorMap = { CREATE: 'green', UPDATE: 'blue', DELETE: 'red', DISABLE: 'orange', ENABLE: 'cyan' }
const typeNameMap = { CREATE: '创建', UPDATE: '更新', DELETE: '删除', DISABLE: '禁用', ENABLE: '启用' }

const columns = [
  { title: '操作时间', dataIndex: 'time', width: 170, ellipsis: true, tooltip: true },
  { title: '操作人ID', dataIndex: 'operatorId', width: 100, ellipsis: true, tooltip: true },
  { title: '操作人账号', dataIndex: 'operatorAccount', width: 120, ellipsis: true, tooltip: true },
  { title: '操作人姓名', dataIndex: 'operatorName', width: 100, ellipsis: true, tooltip: true },
  { title: '系统', dataIndex: 'system', width: 100, ellipsis: true, tooltip: true },
  { title: '操作类型', slotName: 'type', width: 90 },
  { title: '操作对象', dataIndex: 'target', width: 100, ellipsis: true, tooltip: true },
  { title: '操作IP', dataIndex: 'ip', width: 140, ellipsis: true, tooltip: true },
  { title: '操作描述', dataIndex: 'desc', width: 300, ellipsis: true, tooltip: true },
]

const filteredLogs = computed(() => {
  let list = tableData.value
  if (filters.value.operator) {
    const kw = filters.value.operator.toLowerCase()
    list = list.filter(l => l.operatorName.toLowerCase().includes(kw) || l.operatorAccount.toLowerCase().includes(kw))
  }
  if (filters.value.system) list = list.filter(l => l.system === filters.value.system)
  if (filters.value.type) list = list.filter(l => l.type === filters.value.type)
  if (filters.value.target) list = list.filter(l => l.target === filters.value.target)
  return list
})

function handleSearch() {
  Message.info('已刷新查询结果')
}

function resetFilters() {
  filters.value = { dateRange: [], operator: '', system: undefined, type: undefined, target: undefined }
}

function handleExport() {
  Message.success('导出成功，请查看下载文件')
}

function batchExport() {
  if (selectedKeys.value.length === 0) {
    Message.warning('请选择要导出的记录')
    return
  }
  Message.success(`已导出 ${selectedKeys.value.length} 条操作日志`)
  selectedKeys.value = []
}

function clearSelection() {
  selectedKeys.value = []
}
</script>

<style scoped>
.page-container {
  background: #f5f6f7;
  min-height: calc(100vh - 56px);
  padding: 20px;
}
</style>
