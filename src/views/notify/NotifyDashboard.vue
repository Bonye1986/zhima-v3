<template>
  <div class="page-container">
    <!-- 产品Tab - 内联实现，V3暂无 ProductTabs 共享组件 -->
    <div class="product-tabs-wrapper">
      <div class="custom-tabs">
        <div
          v-for="p in products"
          :key="p.id"
          :class="['tab-item', { active: activeProduct === p.id }]"
          @click="handleProductChange(p.id)"
        >
          {{ p.name }}
        </div>
      </div>
    </div>

    <!-- KPI卡片 -->
    <a-row :gutter="16" style="margin: 20px -8px;">
      <a-col :span="6" v-for="kpi in kpiList" :key="kpi.label">
        <a-card :bordered="false" class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-label">{{ kpi.label }}</div>
          <div class="stat-value" :style="{ color: kpi.color }">
            {{ kpi.value }}{{ kpi.suffix || '' }}
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 日期选择器 -->
    <div style="margin-bottom: 16px; display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
      <span style="color: #86909c; font-size: 14px;">时间范围：</span>
      <a-range-picker v-model="dateRange" :placeholder="['开始', '结束']" style="width: 240px" />
    </div>

    <!-- 图表 -->
    <a-row :gutter="16" style="margin-bottom: 20px;">
      <a-col :span="12">
        <a-card :bordered="false">
          <template #title>
            <span class="card-title">短信发送趋势</span>
          </template>
          <div ref="smsChartRef" style="height: 280px;"></div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card :bordered="false">
          <template #title>
            <span class="card-title">邮件发送趋势</span>
          </template>
          <div ref="emailChartRef" style="height: 280px;"></div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 模板发送排行 -->
    <a-row :gutter="16">
      <a-col :span="12">
        <a-card :bordered="false">
          <template #title>
            <span class="card-title">短信模板发送排行</span>
          </template>
          <a-table :columns="rankColumns" :data="smsRankData" :pagination="false" row-key="rank" size="small" stripe>
            <template #rate="{ record }">
              <a-progress :percent="record.rate" size="small" style="width: 120px;" />
            </template>
          </a-table>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card :bordered="false">
          <template #title>
            <span class="card-title">邮件模板发送排行</span>
          </template>
          <a-table :columns="rankColumns" :data="emailRankData" :pagination="false" row-key="rank" size="small" stripe>
            <template #rate="{ record }">
              <a-progress :percent="record.rate" size="small" style="width: 120px;" />
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { products } from '../../mock/data.js'

const activeProduct = ref('P001')
const dateRange = ref([])
const smsChartRef = ref(null)
const emailChartRef = ref(null)
let smsChart, emailChart

// 产品线数据映射
const productDataMap = {
  P001: {
    kpi: [
      { label: '短信发送总数', value: 15280, color: '#165DFF' },
      { label: '短信成功率', value: 96.5, suffix: '%', color: '#00B42A' },
      { label: '邮件发送总数', value: 8450, color: '#722ED1' },
      { label: '邮件成功率', value: 98.2, suffix: '%', color: '#0FC6C2' },
    ],
    smsRank: [
      { rank: 1, name: '验证码模板', total: 5680, rate: 99 },
      { rank: 2, name: '春季促销模板', total: 3200, rate: 97 },
      { rank: 3, name: '续费提醒模板', total: 2800, rate: 95 },
      { rank: 4, name: '系统通知模板', total: 2100, rate: 99 },
      { rank: 5, name: '新品发布模板', total: 1500, rate: 92 },
    ],
    emailRank: [
      { rank: 1, name: '系统通知邮件', total: 3200, rate: 98 },
      { rank: 2, name: '营销邮件模板', total: 2100, rate: 96 },
      { rank: 3, name: '欢迎邮件模板', total: 1500, rate: 99 },
      { rank: 4, name: '密码重置邮件', total: 1200, rate: 99 },
      { rank: 5, name: '账单邮件模板', total: 450, rate: 97 },
    ],
  },
  P002: {
    kpi: [
      { label: '短信发送总数', value: 8934, color: '#165DFF' },
      { label: '短信成功率', value: 95.8, suffix: '%', color: '#00B42A' },
      { label: '邮件发送总数', value: 5620, color: '#722ED1' },
      { label: '邮件成功率', value: 97.5, suffix: '%', color: '#0FC6C2' },
    ],
    smsRank: [
      { rank: 1, name: '验证码模板', total: 3680, rate: 98 },
      { rank: 2, name: '漫影推广模板', total: 2100, rate: 96 },
      { rank: 3, name: '会员到期提醒', total: 1500, rate: 94 },
      { rank: 4, name: '活动通知模板', total: 1200, rate: 98 },
      { rank: 5, name: '系统维护通知', total: 454, rate: 99 },
    ],
    emailRank: [
      { rank: 1, name: '漫影更新通知', total: 2100, rate: 97 },
      { rank: 2, name: '会员权益邮件', total: 1500, rate: 95 },
      { rank: 3, name: '欢迎邮件模板', total: 1200, rate: 98 },
      { rank: 4, name: '密码重置邮件', total: 520, rate: 99 },
      { rank: 5, name: '月度账单邮件', total: 300, rate: 96 },
    ],
  },
}

const kpiList = computed(() => productDataMap[activeProduct.value]?.kpi || productDataMap.P001.kpi)
const smsRankData = computed(() => productDataMap[activeProduct.value]?.smsRank || productDataMap.P001.smsRank)
const emailRankData = computed(() => productDataMap[activeProduct.value]?.emailRank || productDataMap.P001.emailRank)

const rankColumns = [
  { title: '排名', dataIndex: 'rank', width: 70 },
  { title: '模板名称', dataIndex: 'name', width: 200 },
  { title: '发送总量', dataIndex: 'total', width: 120 },
  { title: '成功率', slotName: 'rate', width: 180 },
]

function handleProductChange(productId) {
  activeProduct.value = productId
  updateCharts()
}

function updateCharts() {
  if (smsChart) {
    const data = activeProduct.value === 'P001' 
      ? [320, 450, 380, 520, 410, 390, 480]
      : [220, 350, 280, 420, 310, 290, 380]
    smsChart.setOption({
      series: [{ data }]
    })
  }
  if (emailChart) {
    const data = activeProduct.value === 'P001'
      ? [180, 280, 220, 350, 290, 260, 310]
      : [120, 180, 150, 220, 190, 170, 200]
    emailChart.setOption({
      series: [{ data }]
    })
  }
}

function makeTrendOption(_title, color) {
  const days = Array.from({ length: 7 }, (_, i) => `4/${14 + i}`)
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['发送量', '成功', '失败'], bottom: 0 },
    grid: { left: 50, right: 20, top: 40, bottom: 50 },
    xAxis: { type: 'category', data: days },
    yAxis: { type: 'value' },
    series: [
      { name: '发送量', type: 'line', data: [320, 450, 380, 520, 410, 390, 480], smooth: true, itemStyle: { color } },
      { name: '成功', type: 'line', data: [310, 440, 370, 500, 400, 385, 470], smooth: true, itemStyle: { color: '#00B42A' } },
      { name: '失败', type: 'line', data: [10, 10, 10, 20, 10, 5, 10], smooth: true, itemStyle: { color: '#F53F3F' } },
    ]
  }
}

onMounted(() => {
  smsChart = echarts.init(smsChartRef.value)
  smsChart.setOption(makeTrendOption('短信', '#165DFF'))
  emailChart = echarts.init(emailChartRef.value)
  emailChart.setOption(makeTrendOption('邮件', '#722ED1'))
})

onBeforeUnmount(() => {
  smsChart?.dispose()
  emailChart?.dispose()
})
</script>

<style scoped>
.page-container {
  background: #f5f6f7;
  min-height: calc(100vh - 56px);
  padding: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  text-align: center;
}

.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1d2129;
  margin: 8px 0;
}

.stat-label {
  font-size: 14px;
  color: #86909c;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

/* 内联 ProductTabs 样式 */
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

.tab-item:hover {
  color: #165dff;
}

.tab-item.active {
  background: #f2f3f5;
  color: #165dff;
  font-weight: 500;
}
</style>
