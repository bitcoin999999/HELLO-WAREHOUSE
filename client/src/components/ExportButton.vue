<template>
  <button @click="exportExcel">엑셀 내보내기</button>
</template>

<script setup>
import axios from 'axios';

async function exportExcel() {
  const res = await axios.get('http://localhost:3000/api/export', {
    responseType: 'blob'
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'items.xlsx';
  document.body.appendChild(a);          /* 💡 Safari 대응 */
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
</script>
