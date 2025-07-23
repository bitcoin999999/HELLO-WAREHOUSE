<template>
  <div class="import-btn">
    <input type="file" @change="onFileChange" accept=".xlsx" />
    <button @click="importExcel" :disabled="!file">Import Excel</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const emit = defineEmits(['imported']);
const file = ref(null);

function onFileChange(e) {
  file.value = e.target.files[0];
}

async function importExcel() {
  if (!file.value) return;
  const form = new FormData();
  form.append('file', file.value);

  try {
    const res = await axios.post('http://localhost:3000/api/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (res.data.success) {
      alert(`Import 성공: ${res.data.imported}개 항목 추가됨`);
      emit('imported');
    } else {
      alert('Import 실패');
    }
  } catch (e) {
    console.error(e);
    alert('Import 중 오류: ' + e);
  }
}
</script>

<style scoped>
.import-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.import-btn input {
  flex: 1;
}
.import-btn button {
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  cursor: pointer;
}
</style>
