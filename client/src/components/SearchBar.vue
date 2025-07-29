<template>
  <!-- ... -->
  <div class="top-controls">
    <div class="search-wrapper">
      <input
        v-model="searchQuery"
        @input="onInput"
        @keyup.enter="executeSearch"
        placeholder="검색어 입력… (예: dia, 호닝기)"
      />
      <ul v-if="showSuggestions" class="suggestions-list">
        <li
          v-for="s in suggestions"
          :key="s"
          @click="selectSuggestion(s)"
        >
          {{ s }}
        </li>
      </ul>
    </div>
    <button @click="executeSearch">검색</button>
    <!-- ... -->
  </div>
  <!-- ... -->
</template>
<!-- adfsasdf -->
<script setup>
import { ref } from 'vue';
import axios from 'axios';

const emit = defineEmits(['match']);
const searchQuery     = ref('');
const suggestions     = ref([]);
const showSuggestions = ref(false);

let debounceTimer = null;
function onInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => doSearch(searchQuery.value), 300);
}

async function doSearch(q) {
  if (!q.trim()) {
    showSuggestions.value = false;
    return;
  }
  const { data } = await axios.get(`/api/items/search?q=${encodeURIComponent(q)}`);
  suggestions.value = [...new Set(data.map(i => i.name))].slice(0,5);
  showSuggestions.value = true;
}

async function executeSearch() {
  const q = searchQuery.value.trim();
  if (!q) return;
  const { data } = await axios.get(`/api/items/search?q=${encodeURIComponent(q)}`);
  const matched = data.map(i => ({ shelf: Number(i.shelfId), level: Number(i.levelId) }));
  emit('match', matched);
  showSuggestions.value = false;
}

function selectSuggestion(name) {
  searchQuery.value = name;
  executeSearch();
}
</script>
