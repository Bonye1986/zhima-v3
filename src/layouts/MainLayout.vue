<template>
  <a-layout class="main-layout">
    <!-- 左侧导航栏 -->
    <a-layout-sider :width="220" :collapsed="collapsed" collapsible @collapse="collapsed = !collapsed" breakpoint="lg" class="sider" hide-trigger>
      <div class="logo" @click="$router.push('/home')">
        <template v-if="collapsed">
          <div class="logo-icon">智</div>
        </template>
        <template v-else>
          <span class="logo-text">智马云中台管理系统</span>
        </template>
      </div>
      <a-menu :selected-keys="selectedKeys" :open-keys="openKeys" @menu-item-click="handleMenuClick" @sub-menu-click="handleSubMenuClick" :style="{ width: '100%' }">
        <a-menu-item key="home">
          <template #icon><icon-home /></template>
          工作台
        </a-menu-item>
        <a-sub-menu key="member">
          <template #icon><icon-user-group /></template>
          <template #title>成员与权限</template>
          <a-menu-item key="member-list">成员管理</a-menu-item>
          <a-menu-item key="member-role">角色管理</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="user">
          <template #icon><icon-user /></template>
          <template #title>用户管理</template>
          <a-menu-item key="user-dashboard">数据看板</a-menu-item>
          <a-menu-item key="user-group">用户分群</a-menu-item>
          <a-menu-item key="user-list">用户列表</a-menu-item>
          <a-menu-item key="user-tenant">租户列表</a-menu-item>
          <!-- <a-menu-item key="user-channel">渠道商列表</a-menu-item> -->
        </a-sub-menu>
        <a-sub-menu key="order">
          <template #icon><icon-file /></template>
          <template #title>订单管理</template>
          <a-menu-item key="order-list">订单列表</a-menu-item>
          <a-menu-item key="order-recharge">充值订单</a-menu-item>
          <a-menu-item key="order-consumption-record">消费记录</a-menu-item>
          <a-menu-item key="order-payment">支付设置</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="product">
          <template #icon><icon-apps /></template>
          <template #title>产品管理</template>
          <a-menu-item key="product-list">产品列表</a-menu-item>
          <a-menu-item key="product-feature">功能配置</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="goods">
          <template #icon><icon-gift /></template>
          <template #title>商品管理</template>
          <a-menu-item key="goods-spu">商品(SPU)</a-menu-item>
          <a-menu-item key="goods-sku">SKU管理</a-menu-item>
          <a-menu-item key="goods-code">兑换码</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="finance">
          <template #icon><icon-file /></template>
          <template #title>财务管理</template>
          <a-menu-item key="finance-overview">财务概览</a-menu-item>
          <a-menu-item key="finance-receipt">收款管理</a-menu-item>
          <a-menu-item key="finance-invoice">发票中心</a-menu-item>
        </a-sub-menu>
        <!-- 财务管理(新) - 暂时隐藏
        <a-sub-menu key="finance-new">
          <template #icon><icon-file /></template>
          <template #title>财务管理(新)</template>
          <a-menu-item key="finance-income">收入管理</a-menu-item>
          <a-menu-item key="finance-settlement">结算管理</a-menu-item>
          <a-menu-item key="finance-cost">成本管理</a-menu-item>
          <a-menu-item key="finance-invoice-new">发票管理</a-menu-item>
          <a-menu-item key="finance-report">财务报表</a-menu-item>
        </a-sub-menu>
        -->
        <a-sub-menu key="notify">
          <template #icon><icon-notification /></template>
          <template #title>通知管理</template>
          <a-menu-item key="notify-dashboard">数据看板</a-menu-item>
          <a-menu-item key="notify-config">服务商配置</a-menu-item>
          <a-menu-item key="notify-template">模板管理</a-menu-item>
          <a-menu-item key="notify-task">发送任务</a-menu-item>
        </a-sub-menu>
        <a-menu-item key="log">
          <template #icon><icon-history /></template>
          操作日志
        </a-menu-item>
        <a-menu-item key="inquiry">
          <template #icon><icon-email /></template>
          询盘管理
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <!-- 顶部导航栏 -->
      <a-layout-header class="header">
        <div class="header-left">
          <a-button type="text" class="collapse-btn" @click="collapsed = !collapsed">
            <template #icon><icon-menu-fold v-if="!collapsed" /><icon-menu-unfold v-else /></template>
          </a-button>
          <a-breadcrumb>
            <a-breadcrumb-item @click="$router.push('/home')" style="cursor: pointer;">智马云中台管理系统</a-breadcrumb-item>
            <a-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index" @click="item.path && $router.push(item.path)" :style="item.path ? 'cursor: pointer;' : ''">
              {{ item.title }}
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="header-right">
          <a-space size="medium">
            <a-tooltip content="帮助文档">
              <a-button type="text" class="header-btn">
                <template #icon><icon-question-circle /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip content="通知">
              <a-badge :count="5" dot>
                <a-button type="text" class="header-btn">
                  <template #icon><icon-notification /></template>
                </a-button>
              </a-badge>
            </a-tooltip>
            <a-dropdown trigger="click">
              <div class="user-dropdown">
                <span class="user-name">管理员</span>
                <icon-down class="dropdown-icon" />
              </div>
              <template #content>
                <a-doption @click="showPasswordModal = true">
                  <template #icon><icon-lock /></template>
                  修改密码
                </a-doption>
                <a-doption @click="handleLogout">
                  <template #icon><icon-export /></template>
                  退出登录
                </a-doption>
              </template>
            </a-dropdown>
          </a-space>
        </div>
      </a-layout-header>

      <!-- 内容区域 -->
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>

    <!-- 修改密码弹窗 -->
    <a-modal v-model:visible="showPasswordModal" title="修改密码" :on-before-ok="handleChangePassword" @cancel="passwordError = ''" :mask-closable="false" :width="400">
      <a-form :model="passwordForm" layout="vertical">
        <a-form-item label="原密码" required>
          <a-input-password v-model="passwordForm.oldPassword" placeholder="请输入原密码" allow-clear />
        </a-form-item>
        <a-form-item label="新密码" required>
          <a-input-password v-model="passwordForm.newPassword" placeholder="至少8位，字母+数字" allow-clear />
        </a-form-item>
        <a-form-item label="确认新密码" required>
          <a-input-password v-model="passwordForm.confirmPassword" placeholder="请再次输入新密码" allow-clear />
        </a-form-item>
      </a-form>
      <div v-if="passwordError" class="password-error">
        <icon-exclamation-circle-fill />
        <span>{{ passwordError }}</span>
      </div>
    </a-modal>

    <!-- 退出确认弹窗 -->
    <a-modal v-model:visible="showLogoutModal" title="确认退出" @ok="doLogout" type="warning" :width="360">
      <p>确定要退出登录吗？</p>
    </a-modal>
  </a-layout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import {
  IconHome, IconUserGroup, IconUser, IconFile, IconApps,
  IconGift, IconNotification, IconHistory, IconEmail,
  IconMenuFold, IconMenuUnfold, IconQuestionCircle,
  IconDown, IconLock, IconExport, IconExclamationCircleFill
} from '@arco-design/web-vue/es/icon'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)
const showPasswordModal = ref(false)
const showLogoutModal = ref(false)

const passwordForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const passwordError = ref('')

const menuMap = {
  'home': '/home',
  'member-list': '/member/list',
  'member-role': '/member/role',
  'user-list': '/user/list',
  'user-tenant': '/user/tenant',
  'user-channel': '/user/channel',
  'user-dashboard': '/user/dashboard',
  'user-group': '/user/group',
  'order-list': '/order/list',
  'order-recharge': '/order/recharge',
  'order-consumption-record': '/order/consumption-record',
  'order-consumption': '/order/consumption',
  'order-payment': '/order/payment',
  'product-list': '/product/list',
  'product-feature': '/product/feature',
  'goods-spu': '/goods/spu',
  'goods-sku': '/goods/sku',
  'goods-code': '/goods/code',
  'finance-overview': '/finance/overview',
  'finance-receipt': '/finance/receipt',
  'finance-invoice': '/finance/invoice',
  // 财务管理（新）- 二级菜单
  'finance-income': '/finance/income',
  'finance-settlement': '/finance/settlement',
  'finance-cost': '/finance/cost',
  'finance-invoice-new': '/finance/invoice-new',
  'finance-report': '/finance/report',
  'notify-dashboard': '/notify/dashboard',
  'notify-config': '/notify/config',
  'notify-template': '/notify/template',
  'notify-task': '/notify/task',
  'log': '/log',
  'inquiry': '/inquiry',
}

const reverseMap = Object.fromEntries(Object.entries(menuMap).map(([k, v]) => [v, k]))

const selectedKeys = computed(() => {
  const path = route.path
  // 处理详情页路径，映射到对应的列表页菜单
  if (path.startsWith('/user/detail/')) return ['user-list']
  if (path.startsWith('/user/create')) return ['user-list']
  if (path.startsWith('/user/edit/')) return ['user-list']
  if (path.startsWith('/user/group/create')) return ['user-group']
  if (path.startsWith('/user/group/edit/')) return ['user-group']
  if (path.startsWith('/user/group/detail/')) return ['user-group']
  if (path.startsWith('/order/detail/')) return ['order-list']
  if (path.startsWith('/member/detail/')) return ['member-list']
  if (path.startsWith('/member/create')) return ['member-list']
  if (path.startsWith('/member/edit/')) return ['member-list']
  if (path.startsWith('/goods/spu/create')) return ['goods-spu']
  if (path.startsWith('/goods/spu/detail/')) return ['goods-spu']
  if (path.startsWith('/goods/spu/')) return ['goods-spu']
  if (path.startsWith('/goods/sku/create')) return ['goods-sku']
  if (path.startsWith('/goods/sku/edit/')) return ['goods-sku']
  if (path.startsWith('/product/detail/')) return ['product-list']
  
  for (const [menuPath, key] of Object.entries(reverseMap)) {
    if (path.startsWith(menuPath)) return [key]
  }
  return ['home']
})

const openKeys = ref([])

// 面包屑配置
const breadcrumbMap = {
  '/member/list': [{ title: '成员与权限', path: '/member/list' }, { title: '成员管理' }],
  '/member/create': [{ title: '成员与权限', path: '/member/list' }, { title: '成员管理', path: '/member/list' }, { title: '创建成员' }],
  '/member/edit': [{ title: '成员与权限', path: '/member/list' }, { title: '成员管理', path: '/member/list' }, { title: '编辑成员' }],
  '/member/role': [{ title: '成员与权限', path: '/member/list' }, { title: '角色管理' }],
  '/member/role/edit': [{ title: '成员与权限', path: '/member/list' }, { title: '角色管理', path: '/member/role' }, { title: '角色配置' }],
  '/user/list': [{ title: '用户管理', path: '/user/list' }, { title: '用户列表' }],
  '/user/create': [{ title: '用户管理', path: '/user/list' }, { title: '用户列表', path: '/user/list' }, { title: '创建用户' }],
  '/user/edit': [{ title: '用户管理', path: '/user/list' }, { title: '用户列表', path: '/user/list' }, { title: '编辑用户' }],
  '/user/detail': [{ title: '用户管理', path: '/user/list' }, { title: '用户列表', path: '/user/list' }, { title: '用户详情' }],
  '/user/tenant': [{ title: '用户管理', path: '/user/list' }, { title: '租户管理' }],
  '/user/tenant/create': [{ title: '用户管理', path: '/user/list' }, { title: '租户管理', path: '/user/tenant' }, { title: '创建租户' }],
  '/user/tenant/detail': [{ title: '用户管理', path: '/user/list' }, { title: '租户管理', path: '/user/tenant' }, { title: '租户详情' }],
  '/user/dashboard': [{ title: '用户管理', path: '/user/list' }, { title: '数据看板' }],
  '/user/group': [{ title: '用户管理', path: '/user/list' }, { title: '用户分群' }],
  '/user/group/create': [{ title: '用户管理', path: '/user/list' }, { title: '用户分群', path: '/user/group' }, { title: '创建分群' }],
  '/user/group/edit': [{ title: '用户管理', path: '/user/list' }, { title: '用户分群', path: '/user/group' }, { title: '编辑分群' }],
  '/user/group/detail': [{ title: '用户管理', path: '/user/list' }, { title: '用户分群', path: '/user/group' }, { title: '分群详情' }],
  '/order/list': [{ title: '订单管理', path: '/order/list' }, { title: '订单列表' }],
  '/order/recharge': [{ title: '订单管理', path: '/order/list' }, { title: '充值订单' }],
  '/order/consumption-record': [{ title: '订单管理', path: '/order/list' }, { title: '消费记录' }],
  '/order/consumption': [{ title: '订单管理', path: '/order/list' }, { title: '消费订单' }],
  '/order/consumption/:id': [{ title: '订单管理', path: '/order/list' }, { title: '消费订单', path: '/order/consumption' }, { title: '消费记录详情' }],
  '/order/detail': [{ title: '订单管理', path: '/order/list' }, { title: '订单列表', path: '/order/list' }, { title: '订单详情' }],
  '/order/payment': [{ title: '订单管理', path: '/order/list' }, { title: '支付设置' }],
  '/product/list': [{ title: '产品管理', path: '/product/list' }, { title: '产品列表' }],
  '/product/detail': [{ title: '产品管理', path: '/product/list' }, { title: '产品列表', path: '/product/list' }, { title: '产品详情' }],
  '/product/feature': [{ title: '产品管理', path: '/product/list' }, { title: '功能配置' }],
  '/goods/spu': [{ title: '商品管理', path: '/goods/spu' }, { title: '商品列表' }],
  '/goods/spu/create': [{ title: '商品管理', path: '/goods/spu' }, { title: '商品列表', path: '/goods/spu' }, { title: '创建商品' }],
  '/goods/spu/detail': [{ title: '商品管理', path: '/goods/spu' }, { title: '商品详情' }],
  '/goods/sku': [{ title: '商品管理', path: '/goods/spu' }, { title: 'SKU管理' }],
  '/goods/sku/create': [{ title: '商品管理', path: '/goods/spu' }, { title: 'SKU管理', path: '/goods/sku' }, { title: '创建SKU' }],
  '/goods/sku/edit': [{ title: '商品管理', path: '/goods/spu' }, { title: 'SKU管理', path: '/goods/sku' }, { title: 'SKU编辑' }],
  '/goods/code': [{ title: '商品管理', path: '/goods/spu' }, { title: '兑换码管理' }],
  '/finance/overview': [{ title: '财务管理', path: '/finance/overview' }, { title: '财务概览' }],
  '/finance/receipt': [{ title: '财务管理', path: '/finance/overview' }, { title: '收款管理' }],
  '/finance/invoice': [{ title: '财务管理', path: '/finance/overview' }, { title: '发票中心' }],
  '/notify/dashboard': [{ title: '通知管理', path: '/notify/dashboard' }, { title: '数据看板' }],
  '/notify/config': [{ title: '通知管理', path: '/notify/dashboard' }, { title: '服务商配置' }],
  '/notify/template': [{ title: '通知管理', path: '/notify/dashboard' }, { title: '模板管理' }],
  '/notify/task': [{ title: '通知管理', path: '/notify/dashboard' }, { title: '发送任务' }],
  '/notify/task/detail': [{ title: '通知管理', path: '/notify/dashboard' }, { title: '发送任务', path: '/notify/task' }, { title: '任务详情' }],
  '/log': [{ title: '操作日志' }],
  '/inquiry': [{ title: '询盘管理' }],
  '/home': [{ title: '工作台' }]
}

const breadcrumbs = computed(() => {
  const path = route.path
  // 查找匹配的面包屑配置，优先匹配更长的路径
  const sortedEntries = Object.entries(breadcrumbMap).sort((a, b) => b[0].length - a[0].length)
  for (const [key, value] of sortedEntries) {
    if (path.startsWith(key)) {
      return value
    }
  }
  // 默认返回当前页面标题
  return [{ title: route.meta.title || '工作台' }]
})

watch(() => route.path, (path) => {
  if (path.startsWith('/member')) openKeys.value = ['member']
  else if (path.startsWith('/user')) openKeys.value = ['user']
  else if (path.startsWith('/order')) openKeys.value = ['order']
  else if (path.startsWith('/product')) openKeys.value = ['product']
  else if (path.startsWith('/goods')) openKeys.value = ['goods']
  else if (path.startsWith('/finance')) openKeys.value = ['finance']
  else if (path.startsWith('/notify')) openKeys.value = ['notify']
})

function handleMenuClick(key) {
  if (menuMap[key]) router.push(menuMap[key])
}

function handleSubMenuClick(key, openKeysArr) {
  // 只有当值真正变化时才更新，避免无限循环
  const currentKeys = openKeys.value
  const newKeys = openKeysArr || []
  if (JSON.stringify(currentKeys) !== JSON.stringify(newKeys)) {
    openKeys.value = newKeys
  }
}

function handleLogout() {
  showLogoutModal.value = true
}

function doLogout() {
  showLogoutModal.value = false
  router.push('/login')
}

function handleChangePassword() {
  passwordError.value = ''
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
    passwordError.value = '请填写所有密码字段'
    return false // 阻止弹窗关闭
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = '两次输入的新密码不一致'
    return false // 阻止弹窗关闭
  }
  if (passwordForm.value.newPassword.length < 8) {
    passwordError.value = '新密码长度不能少于8位'
    return false // 阻止弹窗关闭
  }
  // 成功时显示提示，3秒后自动关闭
  Message.success('密码修改成功')
  setTimeout(() => {
    showPasswordModal.value = false
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    passwordError.value = ''
  }, 3000)
  return true
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  overflow: hidden;
}

.sider {
  background: #fff;
  border-right: 1px solid #e5e6eb;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.sider :deep(.arco-layout-sider-children) {
  display: flex;
  flex-direction: column;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0 16px;
}

.logo-img {
  width: 32px;
  height: 32px;
}

.logo-full {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-img-small {
  width: 28px;
  height: 28px;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.logo-icon {
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  background: linear-gradient(135deg, #165DFF 0%, #0FC6C2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
}

.sider :deep(.arco-menu) {
  padding: 8px 0;
}

.sider :deep(.arco-menu-item),
.sider :deep(.arco-sub-menu-title) {
  margin: 0;
  border-radius: 0;
  display: flex;
  align-items: center;
}

.sider :deep(.arco-menu-inline-header) {
  margin: 0;
  border-radius: 0;
}

.sider :deep(.arco-menu-item:hover),
.sider :deep(.arco-sub-menu-title:hover) {
  background: #f2f3f5;
}

.sider :deep(.arco-menu-selected) {
  background: #e8f3ff !important;
  color: #165DFF !important;
}

.sider :deep(.arco-menu-selected .arco-icon) {
  color: #165DFF;
}

.sider :deep(.arco-menu-icon) {
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
}

.sider :deep(.arco-menu-icon .arco-icon) {
  font-size: 18px;
}

.sider :deep(.arco-menu-title) {
  display: flex;
  align-items: center;
}

.sider :deep(.arco-sub-menu-title) {
  padding-left: 12px !important;
}

.sider :deep(.arco-menu-item) {
  padding-left: 12px !important;
}

.sider :deep(.arco-menu-inline-header) {
  display: flex;
  align-items: center;
}

.sider :deep(.arco-menu-item .arco-menu-icon),
.sider :deep(.arco-sub-menu-title .arco-menu-icon) {
  margin-right: 12px;
  margin-left: 0;
  width: 18px;
  min-width: 18px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.sider :deep(.arco-menu-item .arco-menu-title),
.sider :deep(.arco-sub-menu-title .arco-menu-title) {
  padding-left: 0;
}

/* 二级菜单项：文字与一级菜单文字左对齐，无背景填充 */
.sider :deep(.arco-menu-inline-content .arco-menu-item) {
  padding-left: 42px !important;
  background: transparent !important;
  margin: 0;
  border-radius: 0;
}

.sider :deep(.arco-menu-inline-content .arco-menu-item:hover) {
  background: #f2f3f5 !important;
}

.sider :deep(.arco-menu-inline-content .arco-menu-item.arco-menu-selected) {
  background: #e8f3ff !important;
  color: #165DFF !important;
}

/* 隐藏二级菜单的缩进占位块 */
.sider :deep(.arco-menu-inline-content .arco-menu-indent-list) {
  display: none !important;
}

.sider :deep(.arco-menu-inline-content .arco-menu-item .arco-menu-icon) {
  display: none;
}

.sider :deep(.arco-menu-inline-content .arco-menu-item .arco-menu-title) {
  padding-left: 0;
}

/* 确保所有图标左对齐 */
.sider :deep(.arco-menu-icon svg),
.sider :deep(.arco-menu-icon .arco-icon) {
  margin: 0;
  display: block;
}

.header {
  height: 64px;
  background: #fff;
  border-bottom: 1px solid #e5e6eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 18px;
  color: #4e5969;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-btn {
  font-size: 18px;
  color: #4e5969;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.user-dropdown:hover {
  background: #f2f3f5;
}

.user-name {
  font-size: 14px;
  color: #1d2129;
  font-weight: 500;
}

.dropdown-icon {
  font-size: 12px;
  color: #86909c;
}

.content {
  background: #f5f6f7;
  overflow: auto;
  height: calc(100vh - 64px);
}

:deep(.arco-breadcrumb-item) {
  color: #86909c;
}

:deep(.arco-breadcrumb-item:last-child) {
  color: #1d2129;
  font-weight: 500;
}

.password-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  color: #ff4d4f;
  font-size: 13px;
  margin-top: 16px;
}
</style>
