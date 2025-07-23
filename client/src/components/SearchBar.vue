<template>
  <div class="search-bar">
    <input
      v-model="query"
      placeholder="검색어 입력… (예: dia, 호닝기)"
      @input="onInput"
    />
    <ul v-if="results.length">
      <li
        v-for="r in results"
        :key="r.id"
        @click="select(r)"
      >
        {{ r.name }} — {{ r.location }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Fuse from 'fuse.js';

const emit = defineEmits(['selected']);
const query = ref('');
const results = ref([]);
const itemsList = ref([]);
let fuse = null;

onMounted(async () => {
  // 1) 전체 아이템 미리 불러오기
  const res = await axios.get('http://localhost:3000/api/items');
  itemsList.value = res.data.map(item => ({
    id: item.id,
    name: item.name,
    location: `${item.shelf.number}번 선반 ${item.level.number}층`,
  }));

  // 2) Fuse 인스턴스 생성 (name 필드 기준, threshold 낮추면 더 엄격)
  fuse = new Fuse(itemsList.value, {
    keys: ['name'],
    threshold: 0.3,
    ignoreLocation: true,
  });
});

function onInput() {
  if (!query.value.trim()) {
    results.value = [];
    return;
  }
  // 3) Fuse.js로 유사 검색 후 상위 10개만
  const fuseResults = fuse.search(query.value);
  results.value = fuseResults.slice(0, 10).map(r => r.item);
}

function select(item) {
  emit('selected', item);
  results.value = [];
  query.value = '';
}
</script>

<style scoped>
.search-bar {
  position: relative;
  width: 300px;
}
.search-bar input {
  width: 100%;
  padding: 0.5rem;
  box-sizing: border-box;
}
.search-bar ul {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
}
.search-bar li {
  padding: 0.5rem;
  cursor: pointer;
}
.search-bar li:hover {
  background: #f0f0f0;
}
</style>
