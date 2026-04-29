<template>
  <div class="publish-page">
    <el-card>
      <template #header>
        <h2>发布商品</h2>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        style="max-width: 700px"
      >
        <el-form-item label="商品标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入商品标题（最多100字）"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="5"
            placeholder="请详细描述您的商品（最多2000字）"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="原价" prop="originalPrice">
              <el-input-number
                v-model="form.originalPrice"
                :min="0"
                :precision="2"
                placeholder="请输入原价"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出售价" prop="price">
              <el-input-number
                v-model="form.price"
                :min="0"
                :precision="2"
                placeholder="请输入出售价"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select
                v-model="form.category"
                placeholder="请选择分类"
                style="width: 100%"
              >
                <el-option
                  v-for="cat in ProductCategories"
                  :key="cat"
                  :label="cat"
                  :value="cat"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成色" prop="condition">
              <el-select
                v-model="form.condition"
                placeholder="请选择成色"
                style="width: 100%"
              >
                <el-option
                  v-for="cond in ProductConditions"
                  :key="cond"
                  :label="cond"
                  :value="cond"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="交易方式" prop="transactionMethod">
          <el-radio-group v-model="form.transactionMethod">
            <el-radio
              v-for="method in TransactionMethods"
              :key="method"
              :value="method"
            >
              {{ method }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="商品图片" prop="images">
          <div class="upload-section">
            <div class="image-list">
              <div
                v-for="(image, index) in form.images"
                :key="index"
                class="image-item"
              >
                <img :src="image" class="preview-image" />
                <div class="image-overlay">
                  <el-button
                    type="danger"
                    size="small"
                    circle
                    @click="removeImage(index)"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
              </div>
              <div
                v-if="form.images.length < 6"
                class="upload-btn"
                @click="triggerUpload"
              >
                <el-icon :size="24"><Plus /></el-icon>
                <span>上传图片</span>
                <span class="upload-hint">最多6张</span>
              </div>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              multiple
              style="display: none"
              @change="handleFileChange"
            />
          </div>
          <div class="upload-tip">
            <el-icon><InfoFilled /></el-icon>
            支持 JPG、PNG、GIF、WebP 格式，单张图片不超过 5MB
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleSubmit"
          >
            发布商品
          </el-button>
          <el-button size="large" @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, type FormInstance, type FormRules } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { productApi } from "@/api";
import {
  ProductCategories,
  ProductConditions,
  TransactionMethods,
} from "@/types";
import type {
  CreateProductForm,
  ProductCategory,
  ProductCondition,
  TransactionMethod,
} from "@/types";

const router = useRouter();
const formRef = ref<FormInstance>();
const fileInput = ref<HTMLInputElement | null>(null);
const loading = ref(false);
const createdProductId = ref<string | null>(null);

const defaultForm: CreateProductForm = {
  title: "",
  description: "",
  originalPrice: 0,
  price: 0,
  category: undefined as unknown as ProductCategory,
  condition: undefined as unknown as ProductCondition,
  transactionMethod: undefined as unknown as TransactionMethod,
  images: [],
};

const form = reactive<CreateProductForm>({ ...defaultForm });

const rules: FormRules = {
  title: [
    { required: true, message: "请输入商品标题", trigger: "blur" },
    {
      min: 1,
      max: 100,
      message: "标题长度应在1-100个字符之间",
      trigger: "blur",
    },
  ],
  description: [
    { required: true, message: "请输入商品描述", trigger: "blur" },
    { max: 2000, message: "描述不能超过2000个字符", trigger: "blur" },
  ],
  originalPrice: [
    { required: true, message: "请输入原价", trigger: "blur" },
    { type: "number", min: 0, message: "原价不能为负数", trigger: "blur" },
  ],
  price: [
    { required: true, message: "请输入出售价", trigger: "blur" },
    { type: "number", min: 0, message: "出售价不能为负数", trigger: "blur" },
  ],
  category: [{ required: true, message: "请选择商品分类", trigger: "change" }],
  condition: [{ required: true, message: "请选择商品成色", trigger: "change" }],
  transactionMethod: [
    { required: true, message: "请选择交易方式", trigger: "change" },
  ],
};

function triggerUpload() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files || []);

  if (files.length === 0) return;

  const remainingSlots = 6 - form.images.length;
  const filesToUpload = files.slice(0, remainingSlots);

  if (!createdProductId.value) {
    try {
      const response = await productApi.create({
        title: form.title || "临时商品",
        description: form.description || "临时描述",
        originalPrice: form.originalPrice || 0,
        price: form.price || 0,
        category: form.category || "其他",
        condition: form.condition || "全新",
        transactionMethod: form.transactionMethod || "都可以",
      });
      createdProductId.value = response.data._id;
    } catch (error: any) {
      ElMessage.error(error.response?.data?.error || "创建商品失败");
      return;
    }
  }

  try {
    const response = await productApi.uploadImages(
      createdProductId.value,
      filesToUpload,
    );
    form.images = response.data.images;
    ElMessage.success("图片上传成功");
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || "图片上传失败");
  }

  if (fileInput.value) {
    fileInput.value.value = "";
  }
}

function removeImage(index: number) {
  if (!createdProductId.value) return;
  productApi
    .deleteImage(createdProductId.value, index)
    .then((response) => {
      form.images = response.data.images;
      ElMessage.success("图片已删除");
    })
    .catch(() => {
      form.images.splice(index, 1);
    });
}

async function handleSubmit() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        if (createdProductId.value) {
          await productApi.update(createdProductId.value, {
            title: form.title,
            description: form.description,
            originalPrice: form.originalPrice,
            price: form.price,
            category: form.category,
            condition: form.condition,
            transactionMethod: form.transactionMethod,
          });
        } else {
          const response = await productApi.create({
            title: form.title,
            description: form.description,
            originalPrice: form.originalPrice,
            price: form.price,
            category: form.category,
            condition: form.condition,
            transactionMethod: form.transactionMethod,
          });
          createdProductId.value = response.data._id;
        }

        ElMessage.success("商品发布成功");
        router.push("/profile?tab=published");
      } catch (error: any) {
        ElMessage.error(error.response?.data?.error || "发布失败");
      } finally {
        loading.value = false;
      }
    }
  });
}

function resetForm() {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  Object.assign(form, defaultForm);
  createdProductId.value = null;
}
</script>

<style scoped>
.publish-page {
  max-width: 800px;
}

.publish-page h2 {
  margin: 0;
  font-size: 20px;
}

.upload-section {
  width: 100%;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.upload-btn {
  width: 120px;
  height: 120px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.upload-btn span {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.upload-btn:hover span {
  color: #409eff;
}

.upload-hint {
  font-size: 12px !important;
  color: #c0c4cc !important;
}

.upload-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
