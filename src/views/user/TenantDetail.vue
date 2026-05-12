<template>
  <PageCard>
    <template #title>
      <a-breadcrumb>
        <a-breadcrumb-item><a-link @click="$router.push('/user/tenant')">租户列表</a-link></a-breadcrumb-item>
        <a-breadcrumb-item>租户详情</a-breadcrumb-item>
      </a-breadcrumb>
    </template>
    <!-- 基本信息 -->
    <a-card :bordered="false" style="margin-bottom:16px">
      <template #title>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>租户基本信息</span>
          <a-space v-if="!editing"><a-button type="primary" size="small" @click="startEdit"><icon-edit /> 编辑</a-button></a-space>
          <a-space v-else><a-button size="small" @click="cancelEdit">取消</a-button><a-button type="primary" size="small" @click="saveEdit">保存</a-button></a-space>
        </div>
      </template>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">租户ID</span><span class="info-value">{{ tenant.id }}</span></div>
        <div class="info-item"><span class="info-label">企业名称</span><a-input v-if="editing" v-model="editForm.name" style="width:180px"/><span v-else class="info-value">{{ tenant.name }}</span></div>
        <div class="info-item"><span class="info-label">租户类型</span>
          <a-select v-if="editing" v-model="editForm.type" style="width:180px"><a-option value="团队用户">团队用户</a-option><a-option value="运营方">运营方</a-option><a-option value="大客户">大客户</a-option></a-select>
          <span v-else class="info-value"><a-tag :color="typeColor" size="small">{{ tenant.type }}</a-tag></span>
        </div>
        <div class="info-item"><span class="info-label">累计购买金额</span><span class="info-value" style="color:#165DFF;font-weight:500">¥{{ (tenant.totalSpend||0).toLocaleString() }}</span></div>
        <div class="info-item"><span class="info-label">子用户数量</span><span class="info-value">{{ tenant.userCount||0 }}</span></div>
        <div class="info-item"><span class="info-label">剩余权益值</span><span class="info-value" style="color:#00B42A;font-weight:500">{{ (tenant.balance||0).toLocaleString() }}</span></div>
        <div class="info-item" v-if="tenant.type==='运营方'"><span class="info-label">发展租户</span><span class="info-value"><a-link @click="activeTab='subTenants'">{{ subCount }}</a-link></span></div>
        <div class="info-item" v-if="tenant.type==='运营方'"><span class="info-label">本月收入</span><span class="info-value" style="color:#165DFF;font-weight:500">¥{{ monthly.toLocaleString() }}</span></div>
        <div class="info-item" v-if="tenant.type==='运营方'"><span class="info-label">累计收入</span><span class="info-value" style="color:#165DFF;font-weight:500">¥{{ totalI.toLocaleString() }}</span></div>
        <div class="info-item"><span class="info-label">结算方式</span><a-select v-if="editing" v-model="editForm.settlement" style="width:180px"><a-option value="预充权益">预充权益</a-option><a-option value="按量计费">按量计费</a-option><a-option value="自行购买">自行购买</a-option></a-select><span v-else class="info-value">{{ tenant.settlement||'-' }}</span></div>
        <div class="info-item" v-if="tenant.type==='运营方'"><span class="info-label">分成比例</span><a-input-number v-if="editing" v-model="editForm.shareRatio" :min="0" :max="100" style="width:180px"/><span v-else class="info-value">{{ tenant.shareRatio||0 }}%</span></div>
        <div class="info-item"><span class="info-label">过期时间</span>
          <template v-if="editing"><div style="display:flex;gap:8px;width:180px"><a-select v-model="editForm.expireType" style="width:90px"><a-option value="permanent">永久</a-option><a-option value="date">指定日期</a-option></a-select><a-date-picker v-if="editForm.expireType==='date'" v-model="editForm.expireDate" style="flex:1"/></div></template>
          <span v-else class="info-value">{{ tenant.expireTime==='永久'?'永久':tenant.expireTime }}</span>
        </div>
        <div class="info-item"><span class="info-label">发票抬头</span><a-input v-if="editing" v-model="editForm.invoiceTitle" style="width:180px"/><span v-else class="info-value">{{ tenant.invoiceTitle||'-' }}</span></div>
        <div class="info-item"><span class="info-label">发票税号</span><a-input v-if="editing" v-model="editForm.invoiceTaxNo" style="width:180px"/><span v-else class="info-value">{{ tenant.invoiceTaxNo||'-' }}</span></div>
        <div class="info-item" v-if="tenant.type==='运营方'"><span class="info-label">渠道标识</span><a-input v-if="editing" v-model="editForm.channelTag" style="width:180px"/><span v-else class="info-value">{{ tenant.channelTag||'-' }}</span></div>
        <div class="info-item"><span class="info-label">预扣额度上限</span><a-input-number v-if="editing" v-model="editForm.preDeductLimit" :min="0" :step="1000" style="width:180px"/><span v-else class="info-value">{{ (tenant.preDeductLimit||0).toLocaleString() }}</span></div>
        <div class="info-item"><span class="info-label">创建时间</span><span class="info-value">{{ tenant.createTime }}</span></div>
        <div class="info-item"><span class="info-label">状态</span><a-switch v-if="editing" v-model="editForm.status" checked-text="启用" unchecked-text="禁用"/><span v-else class="info-value"><a-tag :color="tenant.status?'green':'red'" size="small">{{ tenant.status?'启用':'禁用' }}</a-tag></span></div>
      </div>
    </a-card>

    <!-- Tabs -->
    <a-tabs v-model:active-key="activeTab">
      <a-tab-pane key="members" title="租户空间">
        <div style="display:flex;justify-content:space-between;margin-bottom:16px">
          <a-space><a-select v-model="memRole" placeholder="全部身份" allow-clear style="width:140px"><a-option value="">全部身份</a-option><a-option value="超级管理员">超级管理员</a-option><a-option value="管理员">管理员</a-option><a-option value="翻译人员">翻译人员</a-option><a-option value="校对人员">校对人员</a-option></a-select><a-range-picker v-model="memDate" style="width:240px" :placeholder="['开始','结束']"/></a-space>
          <a-button type="primary" @click="openAddMember">添加成员</a-button>
        </div>
        <a-table :columns="memCols" :data="filteredMembers" :pagination="{pageSize:10}" row-key="id" stripe>
          <template #role="{record}"><a-tag :color="roleColor(record.role)" size="small">{{ record.role }}</a-tag></template>
          <template #actions="{record}">
            <a-space>
              <a-link @click="openEditMember(record)">编辑</a-link>
              <a-link @click="openAssignPoints(record)">分配点数</a-link>
              <a-link @click="openAssignRecord(record)">分配记录</a-link>
              <a-link v-if="!record.isCreator" status="danger" @click="removeMember(record)">移除</a-link>
            </a-space>
          </template>
        </a-table>
      </a-tab-pane>

      <a-tab-pane key="recharge" title="充值列表">
        <div style="margin-bottom:16px">
          <a-space><a-select v-model="recStatus" placeholder="全部状态" allow-clear style="width:140px"><a-option value="已完成">已完成</a-option><a-option value="待确认">待确认</a-option><a-option value="已关闭">已关闭</a-option></a-select><a-select v-model="recInvoice" placeholder="全部发票" allow-clear style="width:140px"><a-option value="已开票">已开票</a-option><a-option value="未开票">未开票</a-option></a-select></a-space>
        </div>
        <a-table :columns="recCols" :data="filteredRecharge" :pagination="{pageSize:10}" row-key="id" stripe>
          <template #status="{record}"><a-tag :color="record.status==='已完成'?'green':record.status==='待确认'?'orange':'gray'" size="small">{{ record.status }}</a-tag></template>
          <template #actions><a-space><a-link>导出</a-link><a-link>开发票</a-link></a-space></template>
        </a-table>
      </a-tab-pane>

      <a-tab-pane key="consumption" title="消费明细">
        <a-row :gutter="16" style="margin-bottom:16px">
          <a-col :span="4"><a-card :bordered="false" style="text-align:center"><div style="font-size:13px;color:#86909c">今日消费笔数</div><div style="font-size:22px;font-weight:600;color:#1d2129">{{ consKpi.todayOrders }}</div></a-card></a-col>
          <a-col :span="4"><a-card :bordered="false" style="text-align:center"><div style="font-size:13px;color:#86909c">今日用量(点)</div><div style="font-size:22px;font-weight:600;color:#165DFF">{{ consKpi.todayUsage.toLocaleString() }}</div></a-card></a-col>
          <a-col :span="4"><a-card :bordered="false" style="text-align:center"><div style="font-size:13px;color:#86909c">累计消费笔数</div><div style="font-size:22px;font-weight:600;color:#1d2129">{{ consKpi.totalOrders }}</div></a-card></a-col>
          <a-col :span="4"><a-card :bordered="false" style="text-align:center"><div style="font-size:13px;color:#86909c">累计用量(点)</div><div style="font-size:22px;font-weight:600;color:#165DFF">{{ consKpi.totalUsage.toLocaleString() }}</div></a-card></a-col>
          <a-col :span="4"><a-card :bordered="false" style="text-align:center"><div style="font-size:13px;color:#86909c">平均单笔用量</div><div style="font-size:22px;font-weight:600;color:#1d2129">{{ consKpi.avgUsage }}</div></a-card></a-col>
          <a-col :span="4"><a-card :bordered="false" style="text-align:center"><div style="font-size:13px;color:#86909c">导出率</div><div style="font-size:22px;font-weight:600;color:#00B42A">{{ consKpi.exportRate }}%</div></a-card></a-col>
        </a-row>
        <div style="display:flex;justify-content:space-between;margin-bottom:16px">
          <a-range-picker v-model="consDate" style="width:240px" :placeholder="['开始','结束']"/>
          <a-button @click="Message.success('导出成功')">导出</a-button>
        </div>
        <a-table :columns="consCols" :data="consData" :pagination="false" :scroll="{x:1800}" row-key="id" stripe>
          <template #actions><a-link>查看</a-link></template>
        </a-table>
      </a-tab-pane>

      <a-tab-pane key="subTenants" title="发展租户" v-if="tenant.type==='运营方'">
        <div style="display:flex;justify-content:space-between;margin-bottom:16px">
          <a-space><a-input-search v-model="subSearch" placeholder="搜索租户名称" style="width:240px" allow-clear/><a-select v-model="subType" placeholder="租户类型" allow-clear style="width:140px"><a-option value="">全部</a-option><a-option value="团队用户">团队用户</a-option><a-option value="大客户">大客户</a-option></a-select><a-range-picker v-model="subDate" style="width:240px" :placeholder="['开始','结束']"/></a-space>
          <a-button @click="Message.success('导出成功')">导出</a-button>
        </div>
        <a-table :columns="subCols" :data="filteredSub" :pagination="{pageSize:10}" :scroll="{x:1200}" row-key="id" stripe>
          <template #type="{record}"><a-tag :color="record.type==='团队用户'?'blue':record.type==='大客户'?'purple':'gray'" size="small">{{ record.type }}</a-tag></template>
          <template #status="{record}"><a-tag :color="record.status?'green':'red'" size="small">{{ record.status?'启用':'禁用' }}</a-tag></template>
          <template #actions="{record}">
            <a-space><a-link @click="$router.push(`/user/tenant/detail/${record.id}`)">详情</a-link><a-link>分配点数</a-link><a-link>分配记录</a-link></a-space>
          </template>
        </a-table>
      </a-tab-pane>

      <a-tab-pane key="income" title="收入明细" v-if="tenant.type==='运营方'">
        <div style="margin-bottom:16px;display:flex;gap:16px">
          <div class="stat-card"><div class="stat-label">本月收入</div><div class="stat-value">¥{{ incomeKpi.monthly.toLocaleString() }}</div></div>
          <div class="stat-card"><div class="stat-label">累计收入</div><div class="stat-value">¥{{ incomeKpi.total.toLocaleString() }}</div></div>
        </div>
        <a-table :columns="incomeCols" :data="incomeData" :pagination="{pageSize:10}" row-key="id" stripe>
          <template #actions><a-link>查看</a-link></template>
        </a-table>
      </a-tab-pane>
    </a-tabs>
  </PageCard>

  <!-- 添加/编辑成员弹窗 -->
  <a-modal v-model:visible="memModal" :title="editingMember?'编辑成员':'添加成员'" width="500px" @ok="saveMember">
    <div style="display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;align-items:center"><span style="width:80px">用户名</span><a-input v-model="memForm.name" style="flex:1"/></div>
      <div style="display:flex;align-items:center"><span style="width:80px">角色</span><a-select v-model="memForm.role" style="flex:1"><a-option value="超级管理员">超级管理员</a-option><a-option value="管理员">管理员</a-option><a-option value="翻译人员">翻译人员</a-option><a-option value="校对人员">校对人员</a-option></a-select></div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { IconEdit } from '@arco-design/web-vue/es/icon'
import PageCard from '../../components/PageCard.vue'
import { tenants } from '../../mock/data'

const route = useRoute()
const tenantId = route.params.id
const tenant = computed(() => tenants.find(t => t.id === tenantId) || {id:tenantId,name:'未知租户',type:'团队用户',totalSpend:0,userCount:0,balance:0,settlement:'-',shareRatio:0,expireTime:'永久',createTime:'-',status:true})

const editing = ref(false), editForm = reactive({}), activeTab = ref('members')
const typeColor = computed(() => ({'运营方':'blue','团队用户':'green','大客户':'purple'}[tenant.value.type]||'gray'))
const subCount = computed(() => tenants.filter(t => t.channelId === tenantId && t.type !== '运营方').length)
const monthly = computed(() => tenants.filter(t => t.channelId === tenantId && t.type !== '运营方').reduce((s,t)=>s+(t.totalSpend||0),0)*0.15)
const totalI = computed(() => tenants.filter(t => t.channelId === tenantId && t.type !== '运营方').reduce((s,t)=>s+(t.totalSpend||0),0)*0.2)
const startEdit = () => { Object.assign(editForm,{...tenant.value,expireType:tenant.value.expireTime==='永久'?'permanent':'date',expireDate:tenant.value.expireTime!=='永久'?tenant.value.expireTime:''}); editing.value=true }
const cancelEdit = () => editing.value=false
const saveEdit = () => { Object.assign(tenant.value, editForm); editing.value=false; Message.success('保存成功') }

// 成员
const memRole = ref(''), memDate = ref([])
const members = ref([
  {id:1,name:'张三',role:'超级管理员',isCreator:true,joinTime:'2025-01-01'},
  {id:2,name:'李四',role:'管理员',isCreator:false,joinTime:'2025-03-15'},
  {id:3,name:'王五',role:'翻译人员',isCreator:false,joinTime:'2025-06-20'},
])
const filteredMembers = computed(() => {
  let l = members.value
  if (memRole.value) l = l.filter(m => m.role === memRole.value)
  return l
})
const memCols = [{title:'成员名称',dataIndex:'name',width:120},{title:'角色',slotName:'role',width:120},{title:'加入时间',dataIndex:'joinTime',width:150},{title:'操作',slotName:'actions',width:280,fixed:'right'}]
const roleColor = r => ({'超级管理员':'red','管理员':'blue','翻译人员':'green','校对人员':'orange'}[r]||'gray')

const memModal = ref(false), editingMember = ref(false), memForm = reactive({name:'',role:'翻译人员',editId:''})
const openAddMember = () => { memForm.name=''; memForm.role='翻译人员'; editingMember.value=false; memModal.value=true }
const openEditMember = r => { memForm.name=r.name; memForm.role=r.role; memForm.editId=r.id; editingMember.value=true; memModal.value=true }
const saveMember = () => {
  if (!memForm.name) return Message.warning('请输入用户名')
  if (editingMember.value) { const m = members.value.find(i => i.id === memForm.editId); if (m) { m.name=memForm.name; m.role=memForm.role } }
  else { members.value.push({id:Date.now(),name:memForm.name,role:memForm.role,isCreator:false,joinTime:new Date().toISOString().slice(0,10)}) }
  memModal.value=false; Message.success(editingMember.value?'编辑成功':'添加成功')
}
const removeMember = r => { Modal.confirm({title:'移除确认',content:`确定移除成员「${r.name}」？`,onOk:()=>{members.value=members.value.filter(m=>m.id!==r.id);Message.success('移除成功')}}) }
const openAssignPoints = () => Message.info('分配点数')
const openAssignRecord = () => Message.info('分配记录')

// 充值
const recStatus = ref(''), recInvoice = ref('')
const rechargeList = ref([
  {id:'R001',orderId:'ORD20260401001',amount:1999,status:'已完成',invoiceStatus:'已开票',time:'2026-04-01 10:30'},
  {id:'R002',orderId:'ORD20260405002',amount:99,status:'已完成',invoiceStatus:'未开票',time:'2026-04-05 14:20'},
  {id:'R003',orderId:'ORD20260410003',amount:349,status:'待确认',invoiceStatus:'未开票',time:'2026-04-10 09:15'},
])
const filteredRecharge = computed(() => {
  let l = rechargeList.value
  if (recStatus.value) l = l.filter(r => r.status === recStatus.value)
  if (recInvoice.value) l = l.filter(r => r.invoiceStatus === recInvoice.value)
  return l
})
const recCols = [{title:'订单号',dataIndex:'orderId',width:170},{title:'金额',dataIndex:'amount',width:120,align:'right'},{title:'状态',slotName:'status',width:100},{title:'发票状态',dataIndex:'invoiceStatus',width:100},{title:'时间',dataIndex:'time',width:170},{title:'操作',slotName:'actions',width:150}]

// 消费
const consDate = ref([])
const consKpi = {todayOrders:23,todayUsage:15600,totalOrders:1847,totalUsage:2856000,avgUsage:1547,exportRate:62}
const consCols = [{title:'任务名称',dataIndex:'taskName',width:180},{title:'任务类型',dataIndex:'serviceType',width:120},{title:'API模型',dataIndex:'apiModel',width:150},{title:'型号',dataIndex:'model',width:100},{title:'用量',dataIndex:'usage',width:120,align:'right'},{title:'单价',dataIndex:'price',width:100,align:'right'},{title:'金额',dataIndex:'amount',width:120,align:'right'},{title:'创建时间',dataIndex:'createTime',width:170},{title:'操作',slotName:'actions',width:80}]
const consData = [{id:1,taskName:'年会致辞-中译英',serviceType:'文档翻译',apiModel:'Nano-Banana-Pro',model:'2K',usage:3200,price:0.10,amount:320,createTime:'2026-04-20 10:30'},{id:2,taskName:'产品手册-批量',serviceType:'批量翻译',apiModel:'Gemini-2.5-Pro',model:'4K',usage:12400,price:0.08,amount:992,createTime:'2026-04-19 14:20'}]

// 发展租户
const subSearch = ref(''), subType = ref(''), subDate = ref([])
const subTenants = computed(() => tenants.filter(t => t.channelId === tenantId && t.type !== '运营方'))
const filteredSub = computed(() => {
  let l = subTenants.value
  if (subSearch.value) { const kw = subSearch.value.toLowerCase(); l = l.filter(t => t.name.toLowerCase().includes(kw)) }
  if (subType.value) l = l.filter(t => t.type === subType.value)
  return l
})
const subCols = [{title:'租户名称',dataIndex:'name',width:160},{title:'类型',slotName:'type',width:100},{title:'子用户数',dataIndex:'userCount',width:100},{title:'消耗',dataIndex:'totalSpend',width:120,align:'right'},{title:'余额',dataIndex:'balance',width:120,align:'right'},{title:'状态',slotName:'status',width:80},{title:'操作',slotName:'actions',width:220,fixed:'right'}]

// 收入
const incomeKpi = {monthly:17800,total:89200}
const incomeCols = [{title:'来源',dataIndex:'source',width:150},{title:'金额',dataIndex:'amount',width:120,align:'right'},{title:'时间',dataIndex:'time',width:170},{title:'备注',dataIndex:'remark',width:200},{title:'操作',slotName:'actions',width:80}]
const incomeData = [{id:1,source:'租户A消费',amount:7800,time:'2026-04-18 10:00',remark:'分成收入'},{id:2,source:'租户B消费',amount:5200,time:'2026-04-15 14:30',remark:'分成收入'},{id:3,source:'租户C消费',amount:4800,time:'2026-04-10 09:00',remark:'分成收入'}]
</script>

<style scoped>
.info-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px }
.info-item { display:flex; align-items:center; gap:8px }
.info-label { color:#86909c; font-size:14px; white-space:nowrap; min-width:80px }
.info-value { color:#1d2129; font-size:14px; font-weight:500 }
.stat-card { flex:1; text-align:center; background:#fff; border-radius:8px; padding:12px; box-shadow:0 1px 4px rgba(0,0,0,.05) }
.stat-label { font-size:13px; color:#86909c }
.stat-value { font-size:22px; font-weight:600; color:#1d2129; margin-top:4px }
</style>
