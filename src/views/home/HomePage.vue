<template>
  <div class="page-container">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-left">
        <h1 class="welcome-title">欢迎回来，管理员</h1>
        <p class="welcome-desc">今天是 {{ today }}，智马云平台运营数据概览</p>
      </div>
    </div>

    <!-- 子系统入口卡片 -->
    <div class="section-title">系统导航</div>
    <a-row :gutter="[16, 16]" class="card-grid">
      <a-col :xs="24" :sm="12" :md="12" :lg="8" :xl="6" v-for="system in systems" :key="system.key">
        <div class="system-card" :class="{ disabled: !system.hasAuth }" @click="goToSystem(system)">
          <div class="card-icon" :style="{ background: system.bgColor }">
            <component :is="system.icon" :size="28" />
          </div>
          <div class="card-content">
            <div class="card-title-row">
              <span class="card-name">{{ system.name }}</span>
              <a-tag v-if="!system.hasAuth" size="small" color="gray">无权限</a-tag>
            </div>
            <p class="card-desc">{{ system.desc }}</p>
            <div class="card-footer">
              <span class="card-enter">点击进入 →</span>
            </div>
          </div>
        </div>
      </a-col>
    </a-row>

    <!-- 快捷操作 -->
    <div class="section-title">快捷操作</div>
    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :sm="12" :md="8">
        <a-card class="quick-card" hoverable @click="$router.push('/user/list')">
          <div class="quick-item">
            <div class="quick-icon" style="background: #e8f3ff; color: #165DFF;">
              <icon-user-add :size="20" />
            </div>
            <div class="quick-text">
              <div class="quick-title">创建用户</div>
              <div class="quick-desc">快速添加新用户账号</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="8">
        <a-card class="quick-card" hoverable @click="$router.push('/order/list')">
          <div class="quick-item">
            <div class="quick-icon" style="background: #e8ffea; color: #00B42A;">
              <icon-file :size="20" />
            </div>
            <div class="quick-text">
              <div class="quick-title">查看订单</div>
              <div class="quick-desc">处理退款和开票</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="8">
        <a-card class="quick-card" hoverable @click="$router.push('/goods/sku')">
          <div class="quick-item">
            <div class="quick-icon" style="background: #fff7e8; color: #FF7D00;">
              <icon-gift :size="20" />
            </div>
            <div class="quick-text">
              <div class="quick-title">商品管理</div>
              <div class="quick-desc">管理SKU和兑换码</div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 最近动态 - 仅实验室账号可见 -->
    <template v-if="isLabAccount">
      <div class="section-title">最近动态</div>
      <a-card class="activity-card">
        <a-timeline>
          <a-timeline-item v-for="(item, idx) in activities" :key="idx" :label="item.time">
            <div class="activity-item">
              <span class="activity-user">{{ item.user }}</span>
              <span class="activity-action">{{ item.action }}</span>
              <a-link v-if="item.link" @click="$router.push(item.link)">{{ item.target }}</a-link>
              <span v-else class="activity-target">{{ item.target }}</span>
            </div>
          </a-timeline-item>
        </a-timeline>
      </a-card>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import {
  IconUser, IconFile, IconGift, IconUserAdd,
  IconNotification, IconEmail,
  IconApps, IconHistory
} from '@arco-design/web-vue/es/icon'

const router = useRouter()

const isLabAccount = computed(() => {
  const userInfo = localStorage.getItem('currentUser')
  if (userInfo) {
    try {
      const user = JSON.parse(userInfo)
      return user.role === '超级管理员' || user.belong === '实验室'
    } catch (e) {
      return false
    }
  }
  return true
})

const today = computed(() => {
  const date = new Date()
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
})

const systems = [
  {
    key: 'user',
    name: '用户管理系统',
    desc: '管理C端用户、B端租户、用户分群',
    icon: IconUser,
    bgColor: 'linear-gradient(135deg, #165DFF 0%, #4080ff 100%)',
    path: '/user/list',
    hasAuth: true,
  },
  {
    key: 'order',
    name: '订单管理系统',
    desc: '订单查询、退款处理、开票管理',
    icon: IconFile,
    bgColor: 'linear-gradient(135deg, #00B42A 0%, #4ade80 100%)',
    path: '/order/list',
    hasAuth: true,
  },
  {
    key: 'goods',
    name: '商品管理系统',
    desc: 'SPU/SKU管理、兑换码生成',
    icon: IconGift,
    bgColor: 'linear-gradient(135deg, #FF7D00 0%, #ffb366 100%)',
    path: '/goods/spu',
    hasAuth: true,
  },
  {
    key: 'finance',
    name: '财务管理系统',
    desc: '收款确认、发票管理、财务概览',
    icon: IconFile,
    bgColor: 'linear-gradient(135deg, #722ED1 0%, #b37feb 100%)',
    path: '/finance/overview',
    hasAuth: true,
  },
  {
    key: 'product',
    name: '产品管理系统',
    desc: '产品线配置、功能配置',
    icon: IconApps,
    bgColor: 'linear-gradient(135deg, #14C9C9 0%, #5cdbd3 100%)',
    path: '/product/list',
    hasAuth: true,
  },
  {
    key: 'notify',
    name: '通知管理系统',
    desc: '短信/邮件模板、发送任务',
    icon: IconNotification,
    bgColor: 'linear-gradient(135deg, #F53F3F 0%, #ff7875 100%)',
    path: '/notify/dashboard',
    hasAuth: true,
  },
  {
    key: 'member',
    name: '成员与权限',
    desc: '后台成员管理、角色权限配置',
    icon: IconUser,
    bgColor: 'linear-gradient(135deg, #86909c 0%, #c9cdd4 100%)',
    path: '/member/list',
    hasAuth: true,
  },
  {
    key: 'inquiry',
    name: '询盘管理系统',
    desc: '客户线索管理、询盘跟进记录',
    icon: IconEmail,
    bgColor: 'linear-gradient(135deg, #36CFC9 0%, #5cdbd3 100%)',
    path: '/inquiry',
    hasAuth: true,
  },
  {
    key: 'log',
    name: '操作日志',
    desc: '系统操作记录查询',
    icon: IconHistory,
    bgColor: 'linear-gradient(135deg, #1d2129 0%, #4e5969 100%)',
    path: '/log',
    hasAuth: false,
  },
]

const activities = [
  { time: '10:30', user: '张三', action: '创建了用户', target: '钱七', link: '/user/detail/U10006' },
  { time: '09:15', user: '李四', action: '处理了退款', target: 'ORD20260418005', link: '/order/detail/ORD20260418005' },
  { time: '昨天', user: '张三', action: '新建了SKU', target: '新客体验包', link: '/goods/sku' },
  { time: '昨天', user: '赵六', action: '创建了发送任务', target: 'VIP续费提醒', link: '/notify/task' },
  { time: '04-18', user: '张三', action: '禁用了用户', target: '郑五' },
]

function goToSystem(system) {
  if (!system.hasAuth) {
    Message.warning('您没有该系统的访问权限')
    return
  }
  router.push(system.path)
}
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #f5f6f7;
  min-height: 100%;
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #165DFF 0%, #4080ff 100%);
  border-radius: 8px;
  color: #fff;
}

.welcome-right {
  display: flex;
  gap: 32px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.welcome-desc {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.stat-group {
  display: flex;
  align-items: center;
  gap: 24px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

.stat-trend {
  font-size: 12px;
  margin-left: 4px;
}

.stat-trend.up {
  color: #4ade80;
}

.stat-trend.down {
  color: #ff7875;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
}

:deep(.arco-statistic-title) {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

:deep(.arco-statistic-value) {
  color: #fff;
  font-size: 24px;
  font-weight: 600;
}

:deep(.arco-divider-vertical) {
  background: rgba(255, 255, 255, 0.3);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  margin: 24px 0 16px 0;
  padding-left: 12px;
  border-left: 4px solid #165DFF;
}

.card-grid {
  margin-bottom: 8px;
}

.system-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
}

.system-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.system-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.system-card.disabled:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.card-name {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

.card-desc {
  font-size: 13px;
  color: #86909c;
  margin: 0 0 12px 0;
  line-height: 1.5;
  min-height: 40px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-enter {
  font-size: 12px;
  color: #c9cdd4;
  transition: color 0.3s;
}

.system-card:hover .card-enter {
  color: #165DFF;
}

.quick-card {
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.quick-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #e5e6eb;
}

.quick-card :deep(.arco-card-body) {
  padding: 16px;
}

.quick-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quick-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.quick-card:hover .quick-icon {
  transform: scale(1.1);
  border-radius: 12px;
}

.quick-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 4px;
}

.quick-desc {
  font-size: 12px;
  color: #86909c;
}

.activity-card {
  border-radius: 8px;
}

.activity-card :deep(.arco-card-body) {
  padding: 20px;
}

.activity-item {
  font-size: 14px;
  color: #4e5969;
}

.activity-user {
  font-weight: 500;
  color: #1d2129;
}

.activity-action {
  margin: 0 4px;
}

.activity-target {
  color: #165DFF;
  font-weight: 500;
}

.todo-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.todo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.todo-card :deep(.arco-card-body) {
  padding: 16px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.todo-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.todo-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}

.todo-desc {
  font-size: 12px;
  color: #86909c;
}

@media (max-width: 768px) {
  .welcome-section {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .welcome-title {
    font-size: 20px;
  }
}
</style>
