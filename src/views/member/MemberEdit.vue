<template>
  <PageCard>
    <PageHeader title="编辑成员" show-back back-path="/member/list" />
    <a-card :bordered="false" style="margin-top:16px">
      <a-form :model="f" layout="vertical" :rules="rules" ref="formRef">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="姓名" field="name" required><a-input v-model="f.name" placeholder="请输入姓名"/></a-form-item>
            <a-form-item label="密码" field="password"><a-input-password v-model="f.password" placeholder="留空则不修改"/></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="账号" field="account" required><a-input v-model="f.account" placeholder="请输入账号" disabled/></a-form-item>
            <a-form-item label="有效期" field="expireTime">
              <div style="display:flex;gap:12px;width:100%">
                <a-select v-model="f.expireType" style="width:50%"><a-option value="permanent">永久</a-option><a-option value="custom">自定义到期日</a-option></a-select>
                <a-date-picker v-if="f.expireType==='custom'" v-model="f.expireDate" style="width:50%" placeholder="选择到期日期"/>
              </div>
            </a-form-item>
            <a-form-item label="预扣额度上限" field="preDeductLimit"><a-input-number v-model="f.preDeductLimit" :min="0" :step="100" style="width:100%" placeholder="请输入预扣额度上限"/></a-form-item>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import PageCard from '../../components/PageCard.vue'
import PageHeader from '../../components/PageHeader.vue'
import FormActionsBar from '../../components/FormActionsBar.vue'
import { products, members } from '../../mock/data'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const initAuth = () => { const a={}; products.forEach(p=>a[p.id]=''); return a }
const f = reactive({name:'',account:'',password:'',expireType:'permanent',expireDate:'',preDeductLimit:0,productAuths:initAuth()})
const rules = {
  name:[{required:true,message:'请输入姓名'},{minLength:2,maxLength:20,message:'姓名长度2-20个字符'}],
  account:[{required:true,message:'请输入账号'},{minLength:4,maxLength:20,message:'账号长度4-20个字符'},{match:/^[a-zA-Z0-9_]+$/,message:'账号只能包含字母、数字和下划线'}],
  password:[{minLength:8,message:'密码至少8位'},{match:/^(?=.*[a-zA-Z])(?=.*\d).+$/,message:'密码必须包含字母和数字'}],
}

onMounted(()=>{
  const m = members.find(u=>u.id===route.params.id)
  if (m) { f.name=m.name; f.account=m.account; f.expireType=m.expireType||'permanent'; f.expireDate=m.expireDate||''; f.preDeductLimit=m.preDeductLimit||0; if(m.productAuths) Object.assign(f.productAuths,m.productAuths) }
})

async function submit() {
  const e = await formRef.value?.validate()
  if (e) return
  const m = members.find(u=>u.id===route.params.id)
  if (m) { m.name=f.name; if(f.password) m.password=f.password; m.expireType=f.expireType; m.expireDate=f.expireDate; m.expireTime=f.expireType==='permanent'?'永久':f.expireDate+' 23:59:59'; m.preDeductLimit=f.preDeductLimit; m.productAuths={...f.productAuths} }
  Message.success('保存成功'); router.push('/member/list')
}
</script>
