<template>
  <PageCard>
    <ProductTabs v-model="activeProduct" />
    <SearchToolbar placeholder="搜索分群名称" v-model="searchText" @search="()=>{}">
      <template #actions>
        <a-button type="primary" @click="goCreate"><icon-plus /> 新建分群</a-button>
      </template>
    </SearchToolbar>
    <BatchBar v-if="selectedKeys.length>0" :selectedCount="selectedKeys.length" @cancel="selectedKeys=[]">
      <template #actions>
        <a-button type="outline" status="danger" @click="batchDelete">批量删除</a-button>
      </template>
    </BatchBar>
    <a-card :bordered="false">
      <a-table :columns="cols" :data="filtered" :pagination="{pageSize:20}" :row-selection="{type:'checkbox',showCheckedAll:true}" v-model:selectedKeys="selectedKeys" row-key="id" stripe :scroll="{x:1200}">
        <template #actions="{record}">
          <a-space>
            <a-link @click="goDetail(record)">查看</a-link>
            <a-link @click="goEdit(record)">编辑</a-link>
            <a-link status="danger" @click="handleDelete(record)">删除</a-link>
            <a-link @click="handleExport(record)">导出</a-link>
          </a-space>
        </template>
      </a-table>
    </a-card>
  </PageCard>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import PageCard from '../../components/PageCard.vue'
import SearchToolbar from '../../components/SearchToolbar.vue'
import BatchBar from '../../components/BatchBar.vue'
import ProductTabs from '../../components/ProductTabs.vue'

const router = useRouter()
const activeProduct = ref('P001')
const searchText = ref('')
const selectedKeys = ref([])
const groups = ref([
  {id:'G001',name:'VIP用户群',productId:'P001',userCount:2,creator:'张三',createTime:'2026-03-15',updateTime:'2026-04-10'},
  {id:'G002',name:'活跃大客户',productId:'P001',userCount:1,creator:'李四',createTime:'2026-03-20',updateTime:'2026-04-18'},
  {id:'G003',name:'新注册用户',productId:'P001',userCount:1,creator:'张三',createTime:'2026-04-01',updateTime:'2026-04-20'},
  {id:'G004',name:'漫影VIP',productId:'P002',userCount:3,creator:'王五',createTime:'2026-03-10',updateTime:'2026-04-15'},
  {id:'G005',name:'漫影新用户',productId:'P002',userCount:2,creator:'赵六',createTime:'2026-03-25',updateTime:'2026-04-19'},
])
const cols = [
  {title:'分群名称',dataIndex:'name',width:160},{title:'用户数量',dataIndex:'userCount',width:100},
  {title:'创建者',dataIndex:'creator',width:100},{title:'创建时间',dataIndex:'createTime',width:170,sortable:{sortDirections:['ascend','descend']}},
  {title:'更新时间',dataIndex:'updateTime',width:170,sortable:{sortDirections:['ascend','descend']}},
  {title:'操作',slotName:'actions',width:200,fixed:'right'},
]
const filtered = computed(() => {
  let l = groups.value.filter(g => g.productId === activeProduct.value)
  if (searchText.value) { const kw = searchText.value.toLowerCase(); l = l.filter(g => g.name.toLowerCase().includes(kw)) }
  return l
})
function goCreate() { router.push({path:'/user/group/create',query:{productId:activeProduct.value}}) }
function goEdit(r) { router.push(`/user/group/edit/${r.id}`) }
function goDetail(r) { router.push(`/user/group/detail/${r.id}`) }
function handleDelete(r) { Modal.confirm({title:'删除确认',content:`确定删除「${r.name}」？此操作不可恢复。`,onOk:()=>{groups.value=groups.value.filter(g=>g.id!==r.id);Message.success('删除成功')}}) }
function batchDelete() { Modal.confirm({title:'批量删除',content:`确定删除选中的 ${selectedKeys.value.length} 个分群？`,onOk:()=>{groups.value=groups.value.filter(g=>!selectedKeys.value.includes(g.id));selectedKeys.value=[];Message.success('删除成功')}}) }
function handleExport(r) { const csv=`\uFEFF分群名称,${r.name}\n用户数量,${r.userCount}\n创建者,${r.creator}`; const b=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`${r.name}_导出.csv`; a.click(); Message.success('导出成功') }
</script>
