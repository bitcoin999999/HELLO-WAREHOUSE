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

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const searchQuery     = ref('')
const suggestions     = ref([])
const showSuggestions = ref(false)
let debounceTimeout   = null

async function fetchItems() {
  const res = await axios.get('http://localhost:3000/api/items')
  items.value = res.data
}

async function doSearch(q) {
  if (!q) {
    await fetchItems()
  } else {
    const res = await axios.get(
      `http://localhost:3000/api/items/search?q=${encodeURIComponent(q)}`
    )
    items.value = res.data
  }
}

function onInput() {
  const q = searchQuery.value.trim()
  clearTimeout(debounceTimeout)
  if (!q) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }
  debounceTimeout = setTimeout(async () => {
    const res = await axios.get(
      `http://localhost:3000/api/items/search?q=${encodeURIComponent(q)}`
    )
    suggestions.value = [...new Set(res.data.map(i => i.name))].slice(0, 5)
    showSuggestions.value = true
  }, 300)
}

function selectSuggestion(name) {
  searchQuery.value = name
  showSuggestions.value = false
  executeSearch()
}

async function executeSearch() {
  showSuggestions.value = false
  await doSearch(searchQuery.value.trim())
  matchedCoords.value = items.value.map(i => ({ shelf: i.shelf, level: i.level }))
}
</script>
