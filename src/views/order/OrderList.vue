<template>
  <PageCard>
    <ProductTabs v-model="activeProduct" />
    <SearchToolbar placeholder="搜索订单ID/用户账号/租户名称" v-model="searchText" @search="()=>{}">
      <template #extra>
        <a-space>
          <a-select v-model="fChannel" placeholder="渠道来源" allow-clear style="width:130px">
            <a-option value="马投科技">马投科技</a-option>
            <a-option value="环球译联">环球译联</a-option>
          </a-select>
          <a-select v-model="fPay" placeholder="支付方式" allow-clear style="width:130px">
            <a-option value="微信支付">微信支付</a-option>
            <a-option value="支付宝支付">支付宝支付</a-option>
            <a-option value="对公转账">对公转账</a-option>
          </a-select>
          <a-select v-model="fInvoice" placeholder="开票状态" allow-clear style="width:120px">
            <a-option value="未开票">未开票</a-option>
            <a-option value="开票中">开票中</a-option>
            <a-option value="已开票">已开票</a-option>
          </a-select>
          <a-select v-model="fStatus" placeholder="订单状态" allow-clear style="width:120px">
            <a-option value="待支付">待支付</a-option><a-option value="已支付">已支付</a-option>
            <a-option value="已完成">已完成</a-option><a-option value="已关闭">已关闭</a-option>
            <a-option value="退款成功">退款成功</a-option>
          </a-select>
          <a-range-picker v-model="fDate" style="width:260px" :placeholder="['开始','结束']" />
        </a-space>
      </template>
      <template #actions>
        <a-button type="primary" @click="()=>(Message.info('创建订单'))"><icon-plus /> 创建订单</a-button>
        <a-button @click="onExport"><icon-download /> 导出</a-button>
      </template>
    </SearchToolbar>
    <BatchBar v-if="selectedKeys.length>0" :selectedCount="selectedKeys.length" @cancel="selectedKeys=[]">
      <template #actions><a-button type="outline" status="danger" @click="batchDelete">批量删除</a-button></template>
    </BatchBar>
    <a-card :bordered="false">
      <a-table :columns="cols" :data="filtered" :pagination="false" :scroll="{x:2030}"
        :row-selection="{type:'checkbox',showCheckedAll:true}" v-model:selectedKeys="selectedKeys" row-key="id" stripe>
        <template #orderId="{record}"><a-link>{{ record.id }}</a-link></template>
        <template #channelSource="{record}">
          <a-tag v-if="record.channelSource&&record.channelSource!=='直接注册'" color="orange" size="small">{{ record.channelSource }}</a-tag>
          <span v-else style="color:#c9cdd4">—</span>
        </template>
        <template #status="{record}"><a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag></template>
        <template #invoiceStatus="{record}"><a-tag :color="record.invoiceStatus==='已开票'?'green':'gray'" size="small">{{ record.invoiceStatus }}</a-tag></template>
        <template #refundStatus="{record}">
          <a-tag v-if="record.refundStatus" :color="record.refundStatus==='退款成功'?'red':'orange'" size="small">{{ record.refundStatus }}</a-tag>
          <span v-else style="color:#c9cdd4">—</span>
        </template>
        <template #rightsStatus="{record}"><a-tag :color="record.rightsStatus==='正常'?'green':'orange'" size="small">{{ record.rightsStatus }}</a-tag></template>
        <template #actions>
          <a-space>
            <a-link>详情</a-link><a-link>开票</a-link><a-link status="danger">作废</a-link>
          </a-space>
        </template>
      </a-table>
    </a-card>
  </PageCard>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus, IconDownload } from '@arco-design/web-vue/es/icon'
import PageCard from '../../components/PageCard.vue'
import SearchToolbar from '../../components/SearchToolbar.vue'
import BatchBar from '../../components/BatchBar.vue'
import ProductTabs from '../../components/ProductTabs.vue'
import { orders } from '../../mock/data'

const activeProduct = ref('P001')
const searchText = ref('')
const fChannel = ref(''), fPay = ref(''), fInvoice = ref(''), fStatus = ref('')
const fDate = ref([])
const selectedKeys = ref([])
const onExport = () => Message.success('导出成功')

const filtered = computed(() => {
  let l = orders
  if (searchText.value) { const kw = searchText.value.toLowerCase(); l = l.filter(o => [o.id,o.userName,o.tenant].some(v => String(v||'').toLowerCase().includes(kw))) }
  if (fChannel.value) l = l.filter(o => o.channelSource === fChannel.value)
  if (fPay.value) l = l.filter(o => o.payMethod === fPay.value)
  if (fInvoice.value) l = l.filter(o => o.invoiceStatus === fInvoice.value)
  if (fStatus.value) l = l.filter(o => o.status === fStatus.value)
  return l
})

const statusColor = s => ({'待支付':'orange','已支付':'blue','已完成':'green','已关闭':'gray','退款成功':'red','退款中':'orange'}[s]||'gray')

const cols = [
  {title:'订单ID',slotName:'orderId',width:170,fixed:'left'},{title:'用户',dataIndex:'userName',width:100},
  {title:'租户',dataIndex:'tenant',width:140},{title:'渠道来源',slotName:'channelSource',width:110},
  {title:'产品',dataIndex:'productName',width:100},{title:'金额',dataIndex:'amount',width:100,align:'right'},
  {title:'实付',dataIndex:'actualAmount',width:100,align:'right'},{title:'支付方式',dataIndex:'payMethod',width:100},
  {title:'状态',slotName:'status',width:90},{title:'开票状态',slotName:'invoiceStatus',width:100},
  {title:'退款状态',slotName:'refundStatus',width:100},{title:'权益状态',slotName:'rightsStatus',width:100},
  {title:'创建时间',dataIndex:'orderTime',width:170},{title:'操作',slotName:'actions',width:180,fixed:'right'},
]

function batchDelete() {
  Modal.confirm({title:'批量删除',content:`确定删除选中的 ${selectedKeys.value.length} 个订单？`,onOk:()=>{selectedKeys.value=[];Message.success('删除成功')}})
}
</script>
