import { createRouter, createWebHashHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/home',
    children: [
      { path: 'home', name: 'Home', component: () => import('../views/home/HomePage.vue'), meta: { title: '主页' } },
      { path: 'member/list', name: 'MemberList', component: () => import('../views/member/MemberList.vue'), meta: { title: '成员管理' } },
      { path: 'member/role', name: 'RoleList', component: () => import('../views/member/RoleList.vue'), meta: { title: '角色管理' } },
      { path: 'user/list', name: 'UserList', component: () => import('../views/user/UserList.vue'), meta: { title: '用户列表' } },
      { path: 'user/detail/:id', name: 'UserDetail', component: () => import('../views/user/UserDetail.vue'), meta: { title: '用户详情' } },
      { path: 'user/batch-create', name: 'UserBatchCreate', component: () => import('../views/user/UserBatchCreate.vue'), meta: { title: '批量创建用户' } },
      { path: 'user/tenant', name: 'TenantList', component: () => import('../views/user/TenantList.vue'), meta: { title: '租户列表' } },
      { path: 'user/tenant/detail/:id', name: 'TenantDetail', component: () => import('../views/user/TenantDetail.vue'), meta: { title: '租户详情' } },
      { path: 'user/channel', name: 'ChannelList', component: () => import('../views/user/ChannelList.vue'), meta: { title: '渠道商列表' } },
      { path: 'user/dashboard', name: 'UserDashboard', component: () => import('../views/user/UserDashboard.vue'), meta: { title: '数据看板' } },
      { path: 'user/group', name: 'UserGroup', component: () => import('../views/user/UserGroup.vue'), meta: { title: '用户分群' } },
      { path: 'order/list', name: 'OrderList', component: () => import('../views/order/OrderList.vue'), meta: { title: '订单列表' } },
      { path: 'order/recharge', name: 'RechargeOrder', component: () => import('../views/order/RechargeOrder.vue'), meta: { title: '充值订单' } },
      { path: 'order/consumption-record', name: 'ConsumptionRecord', component: () => import('../views/order/ConsumptionRecord.vue'), meta: { title: '消费记录' } },
      { path: 'order/payment', name: 'PaymentSetting', component: () => import('../views/order/PaymentSetting.vue'), meta: { title: '支付设置' } },
      { path: 'product/list', name: 'ProductList', component: () => import('../views/product/ProductList.vue'), meta: { title: '产品列表' } },
      { path: 'product/feature', name: 'FeatureConfig', component: () => import('../views/product/FeatureConfig.vue'), meta: { title: '功能配置' } },
      { path: 'goods/spu', name: 'SpuList', component: () => import('../views/goods/SpuList.vue'), meta: { title: '商品管理' } },
      { path: 'goods/sku', name: 'SkuList', component: () => import('../views/goods/SkuList.vue'), meta: { title: 'SKU管理' } },
      { path: 'goods/code', name: 'RedeemCode', component: () => import('../views/goods/RedeemCode.vue'), meta: { title: '兑换码管理' } },
      { path: 'finance/overview', name: 'FinanceOverview', component: () => import('../views/finance/FinanceOverview.vue'), meta: { title: '财务概览' } },
      { path: 'finance/receipt', name: 'ReceiptManage', component: () => import('../views/finance/ReceiptManage.vue'), meta: { title: '收款管理' } },
      { path: 'finance/invoice', name: 'InvoiceCenter', component: () => import('../views/finance/InvoiceCenter.vue'), meta: { title: '发票中心' } },
      { path: 'finance/income', name: 'IncomeManage', component: () => import('../views/finance/IncomeManage.vue'), meta: { title: '收入管理' } },
      { path: 'finance/settlement', name: 'SettlementManage', component: () => import('../views/finance/SettlementManage.vue'), meta: { title: '结算管理' } },
      { path: 'finance/settlement/transfer', name: 'SettlementTransfer', component: () => import('../views/finance/SettlementTransfer.vue'), meta: { title: '对公转账结算' } },
      { path: 'finance/cost', name: 'CostManage', component: () => import('../views/finance/CostManage.vue'), meta: { title: '成本管理' } },
      { path: 'finance/report', name: 'ReportManage', component: () => import('../views/finance/ReportManage.vue'), meta: { title: '财务报表' } },
      { path: 'notify/dashboard', name: 'NotifyDashboard', component: () => import('../views/notify/NotifyDashboard.vue'), meta: { title: '数据看板' } },
      { path: 'notify/config', name: 'ServiceConfig', component: () => import('../views/notify/ServiceConfig.vue'), meta: { title: '服务商配置' } },
      { path: 'notify/template', name: 'TemplateManage', component: () => import('../views/notify/TemplateManage.vue'), meta: { title: '模板管理' } },
      { path: 'notify/task', name: 'SendTask', component: () => import('../views/notify/SendTask.vue'), meta: { title: '发送任务' } },
      { path: 'log', name: 'OperationLog', component: () => import('../views/log/OperationLog.vue'), meta: { title: '操作日志' } },
      { path: 'inquiry', name: 'InquiryList', component: () => import('../views/inquiry/InquiryList.vue'), meta: { title: '询盘管理' } },
    ]
  }
]

const router = createRouter({ history: createWebHashHistory(), routes })
export default router
