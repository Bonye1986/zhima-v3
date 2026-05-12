<template>
  <PageCard>
    <PageHeader title="创建成员" show-back back-path="/member/list" />
    <a-card :bordered="false" style="margin-top:16px">
      <a-form :model="f" layout="vertical" :rules="rules" ref="formRef">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="姓名" field="name" required><a-input v-model="f.name" placeholder="请输入姓名"/></a-form-item>
            <a-form-item label="密码" field="password" required><a-input-password v-model="f.password" placeholder="8位以上，字母+数字"/></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="账号" field="account" required><a-input v-model="f.account" placeholder="请输入账号"/></a-form-item>
            <a-form-item label="有效期" field="expireTime">
              <div style="display:flex;gap:12px;width:100%">
                <a-select v-model="f.expireType" style="width:50%"><a-option value="permanent">永久</a-option><a-option value="custom">自定义到期日</a-option></a-select>
                <a-date-picker v-if="f.expireType==='custom'" v-model="f.expireDate" style="width:50%" placeholder="选择到期日期"/>
              </div>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="产品授权">
          <a-row :gutter="24">
            <a-col :span="6" v-for="p in products" :key="p.id">
              <div style="display:flex;align-items:center;justify-content:space-between;background:#f2f3f5;border-radius:4px;padding:0 12px;gap:8px">
                <span style="font-weight:500;color:#1d2129;white-space:nowrap">{{ p.name }}</span>
                <a-select v-model="f.productAuths[p.id]" placeholder="请选择权限" style="width:120px"><a-option value="">无权限</a-option><a-option value="admin">管理员</a-option><a-option value="operator">运营</a-option><a-option value="user">普通用户</a-option></a-select>
              </div>
            </a-col>
          </a-row>
        </a-form-item>
      </a-form>
    </a-card>
    <FormActionsBar confirm-text="确定" @cancel="$router.push('/member/list')" @confirm="submit"/>
  </PageCard>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import PageCard from '../../components/PageCard.vue'
import PageHeader from '../../components/PageHeader.vue'
import FormActionsBar from '../../components/FormActionsBar.vue'
import { products, members } from '../../mock/data'

const router = useRouter()
const formRef = ref(null)
const initAuth = () => { const a={}; products.forEach(p=>a[p.id]=''); return a }
const f = reactive({name:'',account:'',password:'',expireType:'permanent',expireDate:'',productAuths:initAuth()})
const rules = {
  name:[{required:true,message:'请输入姓名'},{minLength:2,maxLength:20,message:'姓名长度2-20个字符'}],
  account:[{required:true,message:'请输入账号'},{minLength:4,maxLength:20,message:'账号长度4-20个字符'},{match:/^[a-zA-Z0-9_]+$/,message:'账号只能包含字母、数字和下划线'}],
  password:[{required:true,message:'请输入密码'},{minLength:8,message:'密码至少8位'},{match:/^(?=.*[a-zA-Z])(?=.*\d).+$/,message:'密码必须包含字母和数字'}],
}
async function submit() {
  const e = await formRef.value?.validate()
  if (e) return
  if (members.find(m=>m.account===f.account)) { Message.error('账号已存在'); return }
  members.push({id:'M'+String(members.length+1).padStart(3,'0'),name:f.name,account:f.account,createTime:new Date().toLocaleString('zh-CN'),authProducts:Object.values(f.productAuths).filter(v=>v).length,expireType:f.expireType,expireDate:f.expireDate,expireTime:f.expireType==='permanent'?'永久':f.expireDate+' 23:59:59',status:true,productAuths:{...f.productAuths}})
  Message.success('创建成功'); router.push('/member/list')
}
</script>
