<template>
  <div class="page-container">
    <!-- 产品Tab - 内联实现 -->
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

    <!-- 搜索栏 -->
    <SearchToolbar placeholder="搜索模板名称" @search="handleSearch">
      <template #actions>
        <a-button type="primary" @click="goCreate">
          <template #icon><icon-plus /></template>
          新增模板
        </a-button>
      </template>
    </SearchToolbar>

    <!-- Tab和列表合并 -->
    <a-card :bordered="false" class="table-card">
      <a-tabs v-model="activeType" type="line">
        <a-tab-pane key="sms" title="短信模板">
            <!-- 批量操作栏 -->
            <BatchBar :selectedCount="selectedKeys.length" @cancel="selectedKeys = []">
              <template #actions>
                <a-button size="small" type="outline" status="danger" @click="batchDelete">批量删除</a-button>
              </template>
            </BatchBar>
            <a-table
              :columns="smsColumns"
              :data="filteredSmsList"
              :pagination="pagination"
              :row-selection="{ type: 'checkbox', showCheckedAll: true }"
              :selected-keys="selectedKeys"
              @selection-change="(keys) => selectedKeys = keys"
              row-key="id"
              stripe
            >
              <template #type="{ record }">
                <a-tag size="small">{{ record.type }}</a-tag>
              </template>
              <template #auditStatus="{ record }">
                <a-tag :color="record.auditStatus === '已通过' ? 'green' : record.auditStatus === '审核中' ? 'orange' : 'red'" size="small">{{ record.auditStatus }}</a-tag>
              </template>
              <template #status="{ record }">
                <a-switch v-model="record.status" checked-text="启用" unchecked-text="禁用" @change="(val) => Message.success(`模板已${val ? '启用' : '禁用'}`)" />
              </template>
              <template #actions="{ record }">
                <div class="table-actions">
                  <a-link @click="openPreview(record)">预览</a-link>
                  <a-link @click="goEdit(record)">编辑</a-link>
                  <a-link status="danger" @click="handleDelete(record)">删除</a-link>
                </div>
              </template>
            </a-table>
          </a-tab-pane>
          <a-tab-pane key="email" title="邮件模板">
            <!-- 批量操作栏 -->
            <BatchBar :selectedCount="selectedKeys.length" @cancel="selectedKeys = []">
              <template #actions>
                <a-button size="small" type="outline" status="danger" @click="batchDelete">批量删除</a-button>
              </template>
            </BatchBar>
            <a-table
              :columns="emailColumns"
              :data="filteredEmailList"
              :pagination="pagination"
              :row-selection="{ type: 'checkbox', showCheckedAll: true }"
              :selected-keys="selectedKeys"
              @selection-change="(keys) => selectedKeys = keys"
              row-key="id"
              stripe
            >
              <template #auditStatus="{ record }">
                <a-tag :color="record.auditStatus === '已通过' ? 'green' : 'orange'" size="small">{{ record.auditStatus }}</a-tag>
              </template>
              <template #actions="{ record }">
                <div class="table-actions">
                  <a-link @click="goEdit(record)">编辑</a-link>
                  <a-link status="danger" @click="handleDelete(record)">删除</a-link>
                </div>
              </template>
            </a-table>
          </a-tab-pane>
        </a-tabs>
    </a-card>

    <!-- 新增/编辑弹窗 -->
    <a-modal v-model:visible="modalVisible" :title="isEdit ? '编辑模板' : '新增模板'" @ok="handleModalOk" @cancel="handleModalCancel" :mask-closable="false" width="600px">
      <a-form :model="formData" layout="vertical">
        <a-form-item v-if="!isEdit" label="通知类型" required>
          <a-radio-group v-model="modalType" type="button">
            <a-radio value="sms">短信模板</a-radio>
            <a-radio value="email">邮件模板</a-radio>
          </a-radio-group>
        </a-form-item>
        <!-- 短信模板字段 -->
        <template v-if="modalType === 'sms'">
          <a-form-item label="模板类型" required>
            <a-radio-group v-model="formData.templateType" direction="horizontal">
              <a-radio value="验证码">验证码</a-radio>
              <a-radio value="通知短信">通知短信</a-radio>
              <a-radio value="推广短信">推广短信</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="关联签名" required>
            <a-select v-model="formData.sign" placeholder="请选择">
              <a-option v-for="sign in signList" :key="sign.value" :value="sign.value">{{ sign.label }}</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="模板名称" required>
            <a-input v-model="formData.name" placeholder="请输入名称 不超过30个字符" :max-length="30" show-word-limit />
          </a-form-item>
          <a-form-item label="模板内容" required>
            <a-textarea 
              v-model="formData.content" 
              placeholder="变量限制：仅支持1个变量；4~6位仅数字、数字+字母组合或仅字母2种类型。变量格式：${code}；例如：您的验证码为 ${code}，该验证码5分钟内有效，请勿泄露于他人。模板内容中如超过3个变量，若未来运营商监管政策变化可能存在模板报备失败的风险，建议将变量数量限制在3个及以下。" 
              :max-length="500"
              show-word-limit
              :auto-size="{ minRows: 6, maxRows: 10 }" 
            />
          </a-form-item>
          <a-form-item label="场景说明" required>
            <a-textarea 
              v-model="formData.sceneDesc" 
              placeholder="请描述短信模板的发送场景，如短信发送对象、发送目的等；若短信模板中带有变量，建议您在此提供短信完整示例供审核参考。" 
              :max-length="500"
              show-word-limit
              :auto-size="{ minRows: 4, maxRows: 8 }" 
            />
          </a-form-item>
        </template>
        <!-- 邮件模板字段 -->
        <template v-if="modalType === 'email'">
          <a-form-item label="邮件标题" required>
            <a-input v-model="formData.subject" placeholder="请输入邮件标题" />
          </a-form-item>
          <a-form-item label="发送人名称">
            <a-input v-model="formData.senderName" placeholder="请输入发送人名称" />
          </a-form-item>
          <a-form-item>
            <template #label>
              <span>变量说明</span>
            </template>
            <div style="color: #86909c; font-size: 13px; line-height: 1.6;">
              请用&#123;&#123;变量名称&#125;&#125;为邮件正文中需要替换的变量内容占位。例如，&#123;&#123;Name&#125;&#125;替换收件人真实姓名、&#123;&#123;Birthday&#125;&#125;替换收件人生日。变量名可使用英文大小写字母。
            </div>
          </a-form-item>
          <a-form-item label="邮件正文" required>
            <a-textarea v-model="formData.content" placeholder="请输入邮件正文" :auto-size="{ minRows: 8, maxRows: 12 }" />
          </a-form-item>
        </template>
      </a-form>
    </a-modal>

    <!-- 预览弹窗 -->
    <a-modal v-model:visible="previewVisible" title="模板预览" :footer="false" width="480px">
      <div style="padding: 16px; background: #f5f6f7; border-radius: 8px;">
        <div style="font-size: 14px; color: #1d2129; line-height: 1.6; white-space: pre-wrap;">{{ previewContent }}</div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import { products } from '../../mock/data.js'
import SearchToolbar from '../../components/SearchToolbar.vue'
import BatchBar from '../../components/BatchBar.vue'

const router = useRouter()

const activeProduct = ref('P001')
const activeType = ref('sms')
const searchText = ref('')
const selectedKeys = ref([])
const modalVisible = ref(false)
const previewVisible = ref(false)
const previewContent = ref('')
const isEdit = ref(false)
const modalType = ref('sms')

const smsList = ref([
  { id: 'ST001', name: '验证码模板', sign: '智马翻译', code: 'SMS_001', type: '验证码', templateType: '验证码', createTime: '2026-01-15 10:00:00', auditStatus: '已通过', status: true, content: '您的验证码是${code}，5分钟内有效。', sceneDesc: '用户登录、注册、找回密码时发送验证码', productId: 'P001' },
  { id: 'ST002', name: '春季促销模板', sign: '智马翻译', code: 'SMS_002', type: '推广', templateType: '推广短信', createTime: '2026-03-01 09:00:00', auditStatus: '已通过', status: true, content: '尊敬的${name}，春季大促开始啦！全场${discount}折优惠，快来选购吧！', sceneDesc: '春季促销活动推广短信', productId: 'P001' },
  { id: 'ST003', name: '续费提醒模板', sign: '智马翻译', code: 'SMS_003', type: '通知', templateType: '通知短信', createTime: '2026-03-20 14:00:00', auditStatus: '已通过', status: true, content: '尊敬的${name}，您的会员将于${date}到期，请及时续费。', sceneDesc: '会员到期前7天发送续费提醒', productId: 'P001' },
  { id: 'ST004', name: '系统通知模板', sign: '智马漫影', code: 'SMS_004', type: '通知', templateType: '通知短信', createTime: '2026-04-01 11:00:00', auditStatus: '审核中', status: false, content: '尊敬的${name}，系统将于${time}进行升级维护，届时服务将暂停约30分钟。', sceneDesc: '系统维护通知', productId: 'P002' },
])

const emailList = ref([
  { id: 'ET001', name: '欢迎邮件模板', subject: '欢迎加入智马翻译', senderName: '智马翻译团队', createTime: '2026-01-20 10:00:00', auditStatus: '已通过', productId: 'P001', content: '欢迎使用智马翻译！' },
  { id: 'ET002', name: '月度报告邮件', subject: '您的月度使用报告', senderName: '智马翻译', createTime: '2026-03-01 09:00:00', auditStatus: '已通过', productId: 'P001', content: '您的月度使用报告' },
  { id: 'ET003', name: '发票通知邮件', subject: '发票开具通知', senderName: '智马漫影', createTime: '2026-04-10 14:00:00', auditStatus: '审核中', productId: 'P002', content: '您的发票已开具' },
])

const smsColumns = [
  { title: '模板ID', dataIndex: 'id', width: 100, ellipsis: true, tooltip: true },
  { title: '模板名称', dataIndex: 'name', width: 150, ellipsis: true, tooltip: true },
  { title: '模板签名', dataIndex: 'sign', width: 100, ellipsis: true, tooltip: true },
  { title: '模板CODE', dataIndex: 'code', width: 110, ellipsis: true, tooltip: true },
  { title: '模板类型', slotName: 'type', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', width: 170, ellipsis: true, tooltip: true },
  { title: '审核状态', slotName: 'auditStatus', width: 100 },
  { title: '模板状态', slotName: 'status', width: 100 },
  { title: '操作', slotName: 'actions', width: 160 },
]

const emailColumns = [
  { title: '模板ID', dataIndex: 'id', width: 100, ellipsis: true, tooltip: true },
  { title: '模板名称', dataIndex: 'name', width: 200, ellipsis: true, tooltip: true },
  { title: '审批状态', slotName: 'auditStatus', width: 120 },
  { title: '创建时间', dataIndex: 'createTime', width: 180, ellipsis: true, tooltip: true },
  { title: '操作', slotName: 'actions', width: 140 },
]

const filteredSmsList = computed(() => {
  let list = smsList.value.filter(t => t.productId === activeProduct.value)
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(t => t.name.toLowerCase().includes(kw))
  }
  return list
})

const filteredEmailList = computed(() => {
  let list = emailList.value.filter(t => t.productId === activeProduct.value)
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(t => t.name.toLowerCase().includes(kw))
  }
  return list
})

const pagination = ref({ pageSize: 20, showTotal: true, showPageSize: true })

const formData = ref({ 
  id: '', 
  name: '', 
  templateType: '验证码', 
  sign: '', 
  content: '', 
  sceneDesc: '',
  senderName: '', 
  subject: '', 
})

const signList = ref([
  { value: '智马翻译', label: '智马翻译' },
  { value: '智马漫影', label: '智马漫影' },
  { value: '马投科技', label: '马投科技' },
])

function handleProductChange(productId) {
  activeProduct.value = productId
  selectedKeys.value = []
}

function goCreate() {
  router.push('/notify/template/create')
}

function goEdit(record) {
  router.push(`/notify/template/edit/${record.id}`)
}

function handleSearch(val) {
  searchText.value = val
}

function openPreview(record) {
  previewContent.value = record.content
  previewVisible.value = true
}

function handleDelete(record) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除模板「${record.name}」吗？`,
    onOk: () => {
      Message.success('删除成功')
    }
  })
}

function batchDelete() {
  Modal.confirm({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedKeys.value.length} 个模板吗？`,
    onOk: () => {
      Message.success('批量删除成功')
      selectedKeys.value = []
    }
  })
}
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #f5f6f7;
  min-height: calc(100vh - 56px);
}

/* 内联 ProductTabs */
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

.tab-item:hover { color: #165dff; }

.tab-item.active {
  background: #f2f3f5;
  color: #165dff;
  font-weight: 500;
}

.table-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 4px;
}

.table-actions :deep(.arco-btn) {
  padding: 0 6px;
  margin: 0;
}

:deep(.arco-tabs-nav) {
  margin-bottom: 0;
}
</style>
