<template>
  <PageCard>
    <ProductTabs v-model="activeProduct" />
    <a-row :gutter="16" style="margin-bottom:16px">
      <a-col :span="6" v-for="kpi in kpiList" :key="kpi.label">
        <a-card :bordered="false" style="text-align:center">
          <div style="font-size:14px;color:#86909c">{{ kpi.label }}</div>
          <div style="font-size:24px;font-weight:600;color:#1d2129;margin-top:8px">{{ kpi.value }}</div>
        </a-card>
      </a-col>
    </a-row>
    <a-card :bordered="false" title="用户增长曲线">
      <template #extra>
        <a-range-picker v-model="dateRange" style="width:260px" :placeholder="['开始','结束']" />
      </template>
      <div ref="chartRef" style="height:300px"></div>
    </a-card>
  </PageCard>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import PageCard from '../../components/PageCard.vue'
import ProductTabs from '../../components/ProductTabs.vue'

const activeProduct = ref('P001')
const dateRange = ref([])
const chartRef = ref(null)
let chart

const data = {P001:{totalUsers:15283,todayNew:47,totalPoints:2856000,todayRecharge:12580},P002:{totalUsers:8934,todayNew:28,totalPoints:1682000,todayRecharge:8320}}
const kpiList = computed(() => {
  const d = data[activeProduct.value]
  return [
    {label:'累计用户总数',value:d.totalUsers.toLocaleString()},
    {label:'今日新增用户',value:d.todayNew},
    {label:'全平台点数存量',value:d.totalPoints.toLocaleString()},
    {label:'今日充值总额',value:`¥${d.todayRecharge.toLocaleString()}`},
  ]
})

onMounted(() => {
  chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip:{trigger:'axis'},grid:{left:60,right:20,top:20,bottom:40},
    xAxis:{type:'category',data:['1月','2月','3月','4月','5月']},
    yAxis:{type:'value'},
    series:[{name:'新增用户',type:'line',data:[890,1200,1500,2100,2834],smooth:true,itemStyle:{color:'#165DFF'},areaStyle:{color:'rgba(22,93,255,.1)'}},
      {name:'活跃用户',type:'line',data:[3200,5800,7200,9800,15283],smooth:true,itemStyle:{color:'#00B42A'}}]
  })
})
onBeforeUnmount(() => chart?.dispose())
</script>
