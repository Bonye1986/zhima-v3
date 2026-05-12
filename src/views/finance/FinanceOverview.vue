<template>
  <PageCard>
    <ProductTabs v-model="activeProduct" />
    <a-tabs v-model="activeTab" type="card" class="finance-tabs">
      <!-- 平台财务数据 -->
      <a-tab-pane key="platform" title="平台财务数据">
        <SearchToolbar @search="handleSearch">
          <template #extra>
            <a-range-picker v-model="dateRange" style="width:240px" :placeholder="['开始日期','结束日期']" />
          </template>
          <template #actions>
            <a-button @click="onExport"><icon-download /> 导出</a-button>
          </template>
        </SearchToolbar>
        <a-row :gutter="16" class="kpi-row">
          <a-col :span="4" v-for="kpi in kpiList" :key="kpi.label">
            <a-card :bordered="false" class="stat-card">
              <div class="stat-label">{{ kpi.label }}</div>
              <div class="stat-value" :style="{color:kpi.color}">{{ kpi.prefix }}{{ kpi.value }}{{ kpi.suffix }}</div>
            </a-card>
          </a-col>
        </a-row>
        <a-row :gutter="16" style="margin-bottom:16px">
          <a-col :span="12">
            <a-card :bordered="false" title="收入趋势"><div ref="trendRef" style="height:300px"></div></a-card>
          </a-col>
          <a-col :span="12">
            <a-card :bordered="false" title="收款方式分布"><div ref="pieRef" style="height:300px"></div></a-card>
          </a-col>
        </a-row>
        <a-row :gutter="16" style="margin-bottom:16px">
          <a-col :span="24">
            <a-card :bordered="false" title="开票趋势"><div ref="invoiceRef" style="height:300px"></div></a-card>
          </a-col>
        </a-row>
        <a-card :bordered="false" title="最近收款记录">
          <a-table :columns="paymentCols" :data="recentPayments" :pagination="{pageSize:10}" row-key="orderId" stripe>
            <template #amount="{record}">¥{{ record.amount.toFixed(2) }}</template>
            <template #status="{record}">
              <a-tag :color="record.status==='已到账'?'green':'orange'" size="small">{{ record.status }}</a-tag>
            </template>
            <template #actions><a-link>详情</a-link></template>
          </a-table>
        </a-card>
      </a-tab-pane>

      <!-- 用户消费数据 -->
      <a-tab-pane key="userConsumption" title="用户消费数据">
        <SearchToolbar @search="handleSearch">
          <template #extra>
            <a-space>
              <a-input-search v-model="ucSearch" placeholder="搜索账号/租户/模型" allow-clear style="width:260px" />
              <a-range-picker v-model="ucDateRange" style="width:240px" :placeholder="['开始日期','结束日期']" />
              <a-select v-model="ucInvoiceStatus" placeholder="开票状态" allow-clear style="width:120px">
                <a-option value="已开票">已开票</a-option>
                <a-option value="开票中">开票中</a-option>
                <a-option value="未开票">未开票</a-option>
              </a-select>
            </a-space>
          </template>
          <template #actions>
            <a-button @click="onExport"><icon-download /> 导出</a-button>
          </template>
        </SearchToolbar>
        <a-row :gutter="16" class="kpi-row">
          <a-col :span="8">
            <a-card :bordered="false" class="stat-card">
              <div class="stat-label">总消费点数</div>
              <div class="stat-value" style="color:#165DFF">{{ ucSummary.totalPoints.toLocaleString() }}</div>
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card :bordered="false" class="stat-card">
              <div class="stat-label">总销售金额</div>
              <div class="stat-value" style="color:#00B42A">¥{{ ucSummary.totalSale.toLocaleString() }}</div>
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card :bordered="false" class="stat-card">
              <div class="stat-label">总成本金额</div>
              <div class="stat-value" style="color:#FF7D00">¥{{ ucSummary.totalCost.toLocaleString() }}</div>
            </a-card>
          </a-col>
        </a-row>
        <a-card :bordered="false" title="用户消费明细">
          <a-table :columns="ucCols" :data="filteredUcData" :pagination="{pageSize:20}" :scroll="{x:1600}" stripe row-key="id">
            <template #customerSource="{record}">
              <a-tag v-if="record.customerSource==='运营方'" color="blue">{{ record.customerSource }}</a-tag>
              <span v-else>{{ record.customerSource }}</span>
            </template>
            <template #invoiceStatus="{record}">
              <a-tag :color="record.invoiceStatus==='已开票'?'blue':record.invoiceStatus==='开票中'?'cyan':'gray'">{{ record.invoiceStatus }}</a-tag>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>

      <!-- 运营方数据 -->
      <a-tab-pane key="channel" title="运营方数据">
        <SearchToolbar @search="handleSearch">
          <template #extra>
            <a-space>
              <a-select v-model="selectedChannel" placeholder="全部运营方" allow-clear style="width:160px">
                <a-option value="">全部运营方</a-option>
                <a-option v-for="ch in channelOptions" :key="ch.id" :value="ch.id">{{ ch.name }}</a-option>
              </a-select>
              <a-range-picker v-model="dateRange" style="width:240px" :placeholder="['开始日期','结束日期']" />
            </a-space>
          </template>
          <template #actions>
            <a-button @click="onExport"><icon-download /> 导出</a-button>
          </template>
        </SearchToolbar>
        <a-row :gutter="16" class="kpi-row">
          <a-col :span="4" v-for="kpi in channelKpis" :key="kpi.label">
            <a-card :bordered="false" class="stat-card">
              <div class="stat-label">{{ kpi.label }}</div>
              <div class="stat-value" :style="{color:kpi.color}">{{ kpi.prefix }}{{ kpi.value.toLocaleString() }}{{ kpi.suffix }}</div>
            </a-card>
          </a-col>
        </a-row>
        <a-card :bordered="false" title="运营方明细列表">
          <a-table :columns="channelCols" :data="filteredChannelData" :pagination="{pageSize:10}" :scroll="{x:1200}" stripe row-key="channelId">
            <template #totalAmount="{record}">¥{{ record.totalAmount.toLocaleString() }}</template>
            <template #platformAmount="{record}">¥{{ record.platformAmount.toLocaleString() }}</template>
            <template #channelAmount="{record}"><span style="color:#00b42a;font-weight:500">¥{{ record.channelAmount.toLocaleString() }}</span></template>
            <template #settledAmount="{record}">¥{{ record.settledAmount.toLocaleString() }}</template>
            <template #pendingAmount="{record}"><span style="color:#ff7d00;font-weight:500">¥{{ record.pendingAmount.toLocaleString() }}</span></template>
            <template #actions="{record}"><a-link @click="openDetail(record)">查看</a-link></template>
          </a-table>
        </a-card>
      </a-tab-pane>
    </a-tabs>
  </PageCard>

  <!-- 运营方明细弹窗 -->
  <a-modal v-model:visible="detailVisible" :title="detailTitle" :width="1400" :footer="false">
    <div style="display:flex;justify-content:space-between;margin-bottom:16px;padding:12px;background:#f5f6f7;border-radius:8px">
      <a-space>
        <a-range-picker v-model="detailDateRange" style="width:240px" :placeholder="['开始日期','结束日期']" />
        <a-select v-model="detailSettleStatus" placeholder="全部状态" allow-clear style="width:120px">
          <a-option value="settled">已结算</a-option>
          <a-option value="pending">待结算</a-option>
        </a-select>
        <a-select v-model="detailInvStatus" placeholder="开票状态" allow-clear style="width:120px">
          <a-option value="已开票">已开票</a-option>
          <a-option value="开票中">开票中</a-option>
          <a-option value="未开票">未开票</a-option>
        </a-select>
      </a-space>
      <a-button @click="onExport"><icon-download /> 导出</a-button>
    </div>
    <BatchBar v-if="detailSelected.length>0" :selectedCount="detailSelected.length" @cancel="detailSelected=[]">
      <template #actions>
        <a-button type="primary" status="success" @click="batchSettle"><icon-check-circle /> 批量结算</a-button>
      </template>
    </BatchBar>
    <a-table :columns="detailCols" :data="filteredDetailData" :pagination="{pageSize:20}" :scroll="{x:1500}" stripe row-key="id"
      :row-selection="{type:'checkbox',showCheckedAll:true}" v-model:selected-keys="detailSelected">
      <template #customerSource="{record}">
        <a-tag v-if="record.customerSource==='运营方'" color="blue">{{ record.customerSource }}</a-tag>
        <span v-else>{{ record.customerSource }}</span>
      </template>
      <template #settlementStatus="{record}">
        <a-tag :color="record.settlementStatus==='已结算'?'green':'orange'">{{ record.settlementStatus }}</a-tag>
      </template>
      <template #invoiceStatus="{record}">
        <a-tag v-if="record.invoiceStatus==='已开票'" color="blue">已开票</a-tag>
        <a-tag v-else-if="record.invoiceStatus==='开票中'" color="cyan">开票中</a-tag>
        <span v-else style="color:#86909c">未开票</span>
      </template>
      <template #actions="{record}">
        <a-space>
          <a-link v-if="record.settlementStatus==='待结算'" @click="settleOne(record)">结算</a-link>
          <a-link @click="openRecords(record)">结算记录</a-link>
        </a-space>
      </template>
    </a-table>
  </a-modal>

  <!-- 结算记录弹窗 -->
  <a-modal v-model:visible="recordsVisible" :title="recordsTitle" :width="700" :footer="false">
    <a-table :columns="recordCols" :data="settlementRecords" :pagination="{pageSize:10}" stripe row-key="id" />
  </a-modal>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconDownload, IconCheckCircle } from '@arco-design/web-vue/es/icon'
import * as echarts from 'echarts'
import PageCard from '../../components/PageCard.vue'
import SearchToolbar from '../../components/SearchToolbar.vue'
import BatchBar from '../../components/BatchBar.vue'
import ProductTabs from '../../components/ProductTabs.vue'
import { tenants, consumptionRecords, featurePricing, tenantTaskShareRatios, orders, users } from '../../mock/data'

const activeProduct = ref('P001')
const activeTab = ref('platform')
const dateRange = ref([])
const selectedChannel = ref('')
const onExport = () => Message.success('导出成功')
const handleSearch = () => {}

// 平台KPI
const kpiList = [{label:'收入总额',value:7314,prefix:'¥',color:'#165DFF'},{label:'订单总额',value:12500,prefix:'¥',color:'#0FC6C2'},{label:'待确认收款',value:0,prefix:'¥',color:'#FF7D00'},{label:'已开票金额',value:4500,prefix:'¥',color:'#722ED1'},{label:'待开票金额',value:2814,prefix:'¥',color:'#F53F3F'},{label:'回款率',value:58,suffix:'%',color:'#00B42A'}]

const paymentCols = [
  {title:'时间',dataIndex:'time',width:140},{title:'订单号',dataIndex:'orderId',width:160},
  {title:'用户',dataIndex:'userName',width:70},{title:'金额',slotName:'amount',width:100},
  {title:'支付方式',dataIndex:'payMethod',width:90},{title:'状态',slotName:'status',width:80},{title:'操作',slotName:'actions',width:70}
]
const recentPayments = [
  {time:'2026-04-20 10:30',orderId:'ORD20260401001',userName:'刘一',amount:99,payMethod:'微信支付',status:'已到账'},
  {time:'2026-04-19 14:20',orderId:'ORD20260405002',userName:'陈二',amount:1999,payMethod:'支付宝',status:'已到账'},
  {time:'2026-04-18 09:15',orderId:'ORD20260410003',userName:'吴四',amount:349,payMethod:'微信支付',status:'待确认'},
  {time:'2026-04-17 16:00',orderId:'ORD20260415004',userName:'周三',amount:199,payMethod:'银行转账',status:'待确认'},
]

// 用户消费
const ucSearch = ref('')
const ucDateRange = ref([])
const ucInvoiceStatus = ref('')
const productNames = {P001:'智马翻译',P002:'智马漫影'}
const serviceTypeMap = {'文档翻译':{apiModel:'Nano-Banana-Pro',model:'2K'},'批量翻译':{apiModel:'Gemini-2.5-Pro',model:'4K'},'实时翻译':{apiModel:'GPT-4o-Realtime',model:'含音频'},'漫画生成':{apiModel:'Sora-Image',model:'2K'},'视频生成':{apiModel:'Veo-3.1-Fast-Preview',model:'4K'}}

const ucData = computed(() => {
  const pn = productNames[activeProduct.value] || '智马翻译'
  let id = 1
  return consumptionRecords.filter(cr => cr.productName === pn).map(cr => {
    const t = tenants.find(e => e.name === cr.tenantName)
    const ch = t ? tenants.find(e => e.id === t.channelId && e.type === '运营方') : null
    const m = serviceTypeMap[cr.serviceType] || {apiModel:'-',model:'-'}
    const p = featurePricing.find(fp => fp.apiModel === m.apiModel && fp.model === m.model) || {listPrice:0.1,costPrice:0.06}
    const uo = orders.filter(o => o.userId === cr.userId && o.tenant === cr.tenantName).sort((a,b) => new Date(b.orderTime) - new Date(a.orderTime))[0]
    return {id:id++,accountName:users.find(u=>u.id===cr.userId)?.account||'',userName:users.find(u=>u.id===cr.userId)?.name||'',enterpriseName:cr.tenantName,taskName:cr.businessName||cr.serviceType,customerSource:ch?'运营方':'直接客户',apiModel:m.apiModel,model:m.model,consumePoints:cr.consumePoints||0,salePrice:p.listPrice,saleAmount:Math.round((cr.consumePoints||0)*p.listPrice*100)/100,costPrice:p.costPrice,totalCost:Math.round((cr.consumePoints||0)*p.costPrice*100)/100,invoiceStatus:uo?uo.invoiceStatus:'未开票'}
  })
})
const filteredUcData = computed(() => {
  let l = ucData.value
  if (ucSearch.value) { const kw = ucSearch.value.toLowerCase(); l = l.filter(i => Object.values(i).some(v => String(v).toLowerCase().includes(kw))) }
  if (ucInvoiceStatus.value) l = l.filter(i => i.invoiceStatus === ucInvoiceStatus.value)
  return l
})
const ucSummary = computed(() => ({
  totalPoints: filteredUcData.value.reduce((s,i) => s + i.consumePoints, 0),
  totalSale: filteredUcData.value.reduce((s,i) => s + i.saleAmount, 0),
  totalCost: filteredUcData.value.reduce((s,i) => s + i.totalCost, 0),
}))
const ucCols = [
  {title:'账号',dataIndex:'accountName',width:120,fixed:'left'},{title:'用户名称',dataIndex:'userName',width:100},
  {title:'租户',dataIndex:'enterpriseName',width:160},{title:'客户来源',slotName:'customerSource',width:100},
  {title:'任务名称',dataIndex:'taskName',width:180,ellipsis:true},{title:'API模型',dataIndex:'apiModel',width:150},
  {title:'型号',dataIndex:'model',width:100},{title:'消费点数',dataIndex:'consumePoints',width:120,align:'right'},
  {title:'销售单价',dataIndex:'salePrice',width:120,align:'right'},{title:'销售金额合计',dataIndex:'saleAmount',width:140,align:'right'},
  {title:'成本单价',dataIndex:'costPrice',width:120,align:'right'},{title:'采购成本合计',dataIndex:'totalCost',width:140,align:'right'},
  {title:'开票状态',slotName:'invoiceStatus',width:100,align:'center'},
]

// 运营方
const channelOptions = computed(() => tenants.filter(t => t.type === '运营方').map(t => ({id:t.id,name:t.name})))
const channelData = computed(() => {
  const pn = productNames[activeProduct.value] || '智马翻译'
  return tenants.filter(t => t.type === '运营方' && t.productId === activeProduct.value).map(ch => {
    const dev = tenants.filter(t => t.channelId === ch.id && t.type !== '运营方' && t.productId === activeProduct.value)
    const total = dev.reduce((s,t) => s + (t.totalSpend||0), 0)
    const share = ch.shareRatio || 0
    const ca = Math.round(total * share / 100)
    const settled = Math.round(ca * 0.7)
    return {channelId:ch.id,channelName:ch.name,shareRatio:share,developedTenants:dev.length,totalAmount:total,platformAmount:total-ca,channelAmount:ca,settledAmount:settled,pendingAmount:ca-settled}
  })
})
const filteredChannelData = computed(() => selectedChannel.value ? channelData.value.filter(c => c.channelId === selectedChannel.value) : channelData.value)
const channelKpis = computed(() => {
  const d = filteredChannelData.value
  return [
    {label:'消费总额',value:d.reduce((s,c)=>s+c.totalAmount,0),prefix:'¥',color:'#165DFF'},
    {label:'平台应得',value:d.reduce((s,c)=>s+c.platformAmount,0),prefix:'¥',color:'#165DFF'},
    {label:'渠道应得',value:d.reduce((s,c)=>s+c.channelAmount,0),prefix:'¥',color:'#00B42A'},
    {label:'已结算',value:d.reduce((s,c)=>s+c.settledAmount,0),prefix:'¥',color:'#165DFF'},
    {label:'待结算',value:d.reduce((s,c)=>s+c.pendingAmount,0),prefix:'¥',color:'#FF7D00'},
    {label:'发展租户',value:d.reduce((s,c)=>s+c.developedTenants,0),suffix:'个',color:'#FF7D00'},
  ]
})
const channelCols = [
  {title:'运营方',dataIndex:'channelName',width:120,fixed:'left'},{title:'发展租户',dataIndex:'developedTenants',width:100},
  {title:'消费总额',slotName:'totalAmount',width:120,align:'right'},{title:'平台应得',slotName:'platformAmount',width:120,align:'right'},
  {title:'渠道应得',slotName:'channelAmount',width:120,align:'right'},{title:'已结算',slotName:'settledAmount',width:120,align:'right'},
  {title:'待结算',slotName:'pendingAmount',width:120,align:'right'},{title:'操作',slotName:'actions',width:80,fixed:'right'},
]

// 明细弹窗
const detailVisible = ref(false)
const detailTitle = ref('')
const detailDateRange = ref([])
const detailSettleStatus = ref('')
const detailInvStatus = ref('')
const detailSelected = ref([])
const detailChannelId = ref('')
const detailData = ref([])
const getUnit = () => activeProduct.value === 'P002' ? '次' : '点'

const detailCols = [
  {title:'账号名称',dataIndex:'accountName',width:120,fixed:'left'},{title:'租户',dataIndex:'enterpriseName',width:180},
  {title:'客户来源',dataIndex:'customerSource',width:100},{title:'任务名称',dataIndex:'businessName',width:180,ellipsis:true},
  {title:'任务类型',dataIndex:'serviceType',width:120},{title:'API模型',dataIndex:'apiModel',width:150},
  {title:'型号',dataIndex:'model',width:100},{title:'分成比例',dataIndex:'shareRatio',width:100,align:'right'},
  {title:'用量',dataIndex:'consumePoints',width:120,align:'right'},{title:'销售单价',dataIndex:'salePrice',width:120,align:'right'},
  {title:'结算单价',dataIndex:'settlePrice',width:120,align:'right'},{title:'结算金额合计',dataIndex:'settlementAmount',width:140,align:'right'},
  {title:'成本单价',dataIndex:'costPrice',width:120,align:'right'},{title:'采购成本合计',dataIndex:'totalCost',width:140,align:'right'},
  {title:'结算状态',slotName:'settlementStatus',width:100,align:'center'},{title:'开票状态',slotName:'invoiceStatus',width:100,align:'center'},
  {title:'操作',slotName:'actions',width:180,fixed:'right'},
]
const filteredDetailData = computed(() => {
  let l = detailData.value
  if (detailSettleStatus.value === 'settled') l = l.filter(i => i.settlementStatus === '已结算')
  if (detailSettleStatus.value === 'pending') l = l.filter(i => i.settlementStatus === '待结算')
  if (detailInvStatus.value) l = l.filter(i => i.invoiceStatus === detailInvStatus.value)
  return l
})

function openDetail(rec) {
  detailChannelId.value = rec.channelId
  detailTitle.value = `${rec.channelName} - 消费明细`
  const dev = tenants.filter(t => t.channelId === rec.channelId && t.type !== '运营方')
  const ids = dev.map(t => t.id)
  const pn = productNames[activeProduct.value] || '智马翻译'
  let id = 1
  detailData.value = consumptionRecords.filter(cr => {
    const t = tenants.find(e => e.name === cr.tenantName)
    return t && ids.includes(t.id) && cr.productName === pn
  }).map(cr => {
    const t = tenants.find(e => e.name === cr.tenantName)
    const m = serviceTypeMap[cr.serviceType] || {apiModel:'-',model:'-'}
    const p = featurePricing.find(fp => fp.apiModel === m.apiModel && fp.model === m.model) || {listPrice:0.1,costPrice:0.06}
    const sc = tenantTaskShareRatios.find(ts => ts.tenantId === rec.channelId && ts.taskTypeName === cr.serviceType) || {settlePrice:p.listPrice*0.2,shareRatio:20}
    const uo = orders.filter(o => o.userId === cr.userId && o.tenant === cr.tenantName).sort((a,b) => new Date(b.orderTime) - new Date(a.orderTime))[0]
    return {id:id++,accountName:users.find(u=>u.id===cr.userId)?.account||'',businessName:cr.businessName||'-',serviceType:cr.serviceType,enterpriseName:cr.tenantName,customerSource:'运营方',apiModel:m.apiModel,model:m.model,shareRatio:sc.shareRatio||20,consumePoints:cr.consumePoints||0,salePrice:p.listPrice,settlePrice:Math.round(sc.settlePrice*100)/100,settlementAmount:Math.round((cr.consumePoints||0)*(sc.settlePrice||p.listPrice*0.2)*100)/100,costPrice:p.costPrice,totalCost:Math.round((cr.consumePoints||0)*p.costPrice*100)/100,settlementStatus:id%2===0?'已结算':'待结算',invoiceStatus:uo?uo.invoiceStatus:'未开票'}
  })
  detailVisible.value = true
}
function settleOne(rec) {
  const item = detailData.value.find(i => i.id === rec.id)
  if (item) { item.settlementStatus = '已结算'; addRecord(item); Message.success(`结算成功：${rec.accountName} - ¥${rec.settlementAmount.toFixed(2)}`) }
}
function batchSettle() {
  let count = 0
  detailSelected.value.forEach(k => { const item = detailData.value.find(i => i.id === k); if (item && item.settlementStatus === '待结算') { item.settlementStatus = '已结算'; addRecord(item); count++ } })
  Message.success(`批量结算成功：${count} 条记录`)
  detailSelected.value = []
}

// 结算记录
const recordsVisible = ref(false)
const recordsTitle = ref('')
const settlementRecords = ref([])
const recordCols = [
  {title:'操作人',dataIndex:'operator',width:100},{title:'操作时间',dataIndex:'operateTime',width:170},
  {title:'结算金额',dataIndex:'settlementAmount',width:140,align:'right'},{title:'结算状态',dataIndex:'status',width:100},{title:'备注',dataIndex:'remark',width:200,ellipsis:true},
]
function openRecords(rec) { recordsTitle.value = `${rec.accountName || ''} - 结算记录`; recordsVisible.value = true }
function addRecord(rec) {
  settlementRecords.value.unshift({id:Date.now(),operator:'管理员',operateTime:new Date().toISOString().slice(0,19).replace('T',' '),settlementAmount:rec.settlementAmount,status:'已结算',remark:`结算 ${rec.accountName} - ${rec.businessName||rec.serviceType}`})
}

// ECharts
const trendRef = ref(null), pieRef = ref(null), invoiceRef = ref(null)
let ct, cp, ci
onMounted(() => {
  ct = echarts.init(trendRef.value)
  ct.setOption({tooltip:{trigger:'axis'},legend:{data:['订单金额','实际到账'],bottom:0},grid:{left:60,right:20,top:40,bottom:50},xAxis:{type:'category',data:['1月','2月','3月','4月']},yAxis:{type:'value',axisLabel:{formatter:'¥{value}'}},series:[{name:'订单金额',type:'line',data:[52000,48000,55000,89200],smooth:true,itemStyle:{color:'#165DFF'}},{name:'实际到账',type:'line',data:[42000,38000,45000,73140],smooth:true,itemStyle:{color:'#00B42A'}}]})
  cp = echarts.init(pieRef.value)
  cp.setOption({tooltip:{trigger:'item'},series:[{type:'pie',radius:['40%','70%'],data:[{value:65,name:'微信支付',itemStyle:{color:'#00B42A'}},{value:25,name:'支付宝',itemStyle:{color:'#165DFF'}},{value:10,name:'银行转账',itemStyle:{color:'#FF7D00'}}],label:{formatter:'{b}: {d}%'}}]})
  ci = echarts.init(invoiceRef.value)
  ci.setOption({tooltip:{trigger:'axis'},grid:{left:60,right:20,top:40,bottom:50},xAxis:{type:'category',data:['1月','2月','3月','4月']},yAxis:{type:'value',axisLabel:{formatter:'¥{value}'}},series:[{name:'开票金额',type:'bar',data:[32000,38000,35000,89200],itemStyle:{color:'#722ED1'},barWidth:'40%'}]})
  window.addEventListener('resize', () => { ct?.resize(); cp?.resize(); ci?.resize() })
})
onBeforeUnmount(() => { ct?.dispose(); cp?.dispose(); ci?.dispose() })
</script>

<style scoped>
.finance-tabs :deep(.arco-tabs-nav-wrap) { background:#fff; border-radius:8px; padding:8px 16px; box-shadow:0 1px 4px rgba(0,0,0,.05) }
.finance-tabs :deep(.arco-tabs-tab) { border:none; background:transparent; font-size:14px; font-weight:500; padding:8px 20px; margin:0 4px; border-radius:6px; color:#4e5969; transition:all .2s }
.finance-tabs :deep(.arco-tabs-tab:hover) { color:#165DFF; background:#f2f3f5 }
.finance-tabs :deep(.arco-tabs-tab-active) { color:#fff; font-weight:600; background:#165DFF }
.finance-tabs :deep(.arco-tabs-ink) { display:none }
.kpi-row { margin-bottom:16px }
.stat-card { text-align:center }
.stat-card :deep(.arco-card-body) { padding:12px 8px }
.stat-label { font-size:14px; color:#86909c; white-space:nowrap }
.stat-value { font-size:20px; font-weight:600; margin:4px 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
</style>
