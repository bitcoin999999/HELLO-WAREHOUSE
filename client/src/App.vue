<template>
  <div id="app" :class="{ 'dark-mode': darkMode }">
    <!-- 헤더 -->
    <header class="header">
     <h1 class="gradient-text">🚀 Automation Warehouse 2.0</h1>
    </header>

    <!-- 사이드바 -->
    <aside class="sidebar">
      <div class="control-group">
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
      </div>
      <div class="control-group button-group">
        <!-- 엑셀 내보내기 -->
        <ExportButton />
        <!-- 엑셀 가져오기 -->
        <ImportButton @imported="fetchItems" />
        <button @click="showAllItems">목록 전체보기</button>
      </div>
      <div class="control-group">
        <button class="dark-toggle" @click="toggleDark">
          {{ darkMode ? '☀️ 라이트 모드' : '🌙 다크 모드' }}
        </button>
      </div>
    </aside>

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <WarehouseMap
        :shelves-count="5"
        :levels-count="5"
        :items="items"
        :highlighted="matchedCoords"
        @select="onSelectShelf"
        class="warehouse-map-container"
      />

      <ItemDrawer
        :visible="showDrawer"
        :shelf="currentShelf"
        :level="currentLevel"
        :items="items"
        @close="onCloseDrawer"
        @update="onUpdateFromDrawer"
        @delete="onDeleteFromDrawer"
        @add="onAddFromDrawer"
      />
    </main>

    <!-- 아이템 모달 -->
    <ItemModal
      :visible="showModal"
      :shelf="currentShelf"
      :level="currentLevel"
      :item="editingItem"
      @close="onCloseModal"
      @saved="onSaveItem"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'

import WarehouseMap from './components/WarehouseMap.vue'
import ItemDrawer   from './components/ItemDrawer.vue'
import ItemModal    from './components/ItemModal.vue'
import ExportButton from './components/ExportButton.vue'
import ImportButton from './components/ImportButton.vue'

// 다크 모드 토글
const darkMode = ref(false)
function toggleDark() {
  darkMode.value = !darkMode.value
}
watch(darkMode, v => document.documentElement.classList.toggle('dark', v))

// 검색/자동완성
const searchQuery     = ref('')
const suggestions     = ref([])
const showSuggestions = ref(false)
let debounceTimeout

// 모달, 드로어, 아이템
const showDrawer    = ref(false)
const showModal     = ref(false)
const currentShelf  = ref(null)
const currentLevel  = ref(null)
const editingItem   = ref(null)
const items         = ref([])
const matchedCoords = ref([])

// 전체 아이템 불러오기
async function fetchItems() {
  try {
    const res = await axios.get('http://localhost:3000/api/items')
    items.value = res.data
  } catch (e) {
    console.error('아이템 조회 오류:', e)
    items.value = []
  }
}

// 검색
async function doSearch(q) {
  if (!q) return fetchItems()
  try {
    const res = await axios.get(
      `http://localhost:3000/api/items/search?q=${encodeURIComponent(q)}`
    )
    items.value = res.data
  } catch (e) {
    console.error('검색 오류:', e)
    items.value = []
  }
}

// 검색 입력 디바운스 + 자동완성
function onInput() {
  const q = searchQuery.value.trim()
  clearTimeout(debounceTimeout)
  if (!q) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }
  debounceTimeout = setTimeout(async () => {
    try {
      const res = await axios.get(
        `http://localhost:3000/api/items/search?q=${encodeURIComponent(q)}`
      )
      suggestions.value = [...new Set(res.data.map(i => i.name))].slice(0, 5)
      showSuggestions.value = true
    } catch {
      suggestions.value = []
    }
  }, 300)
}

// 제안어 선택
function selectSuggestion(name) {
  searchQuery.value = name
  showSuggestions.value = false
  executeSearch()
}

// 검색 실행
async function executeSearch() {
  // 검색 제안어를 닫습니다.
  showSuggestions.value = false;
  // 검색어를 트리밍하여 실제 검색을 수행합니다.
  await doSearch(searchQuery.value.trim());
  // 검색 결과를 기반으로 하이라이트할 선반/층 좌표를 계산합니다.
  matchedCoords.value = items.value.map(i => {
    // 검색 API가 shelfId/levelId와 함께 shelf/level 객체를 모두 포함하도록 바뀌었습니다.
    // 우선적으로 숫자 ID를 사용하고 없으면 관계 객체의 number를 사용합니다.
    const shelfNo = i.shelfId ?? (i.shelf ? i.shelf.number : undefined);
    const levelNo = i.levelId ?? (i.level ? i.level.number : undefined);
    return { shelf: shelfNo, level: levelNo };
  });
}


// 선반/층 선택
function onSelectShelf({ shelf, level }) {
  currentShelf.value = shelf
  currentLevel.value = level
  editingItem.value = null
  showDrawer.value = true
}

// 전체보기
function showAllItems() {
  currentShelf.value = null
  currentLevel.value = null
  showDrawer.value = true
}

// 드로어 닫기
function onCloseDrawer() {
  showDrawer.value = false
}

// 모달 닫기
function onCloseModal() {
  showModal.value = false
}

// client/src/App.vue

// 모달 저장
async function onSaveItem(data) {
  // 1) 선반/층 선택 여부 확인
  if (data.shelfId == null || data.levelId == null) {
    alert('선반과 층을 먼저 선택해 주세요!');
    return;
  }

  // 2) 수량과 날짜 형식 보정
  const quantity = Number(data.quantity);
  if (Number.isNaN(quantity) || quantity < 0) {
    alert('수량을 0 이상의 숫자로 입력해 주세요!');
    return;
  }
  const arrival = new Date(data.arrivalDate);
  if (isNaN(arrival.getTime())) {
    alert('입고일을 올바르게 입력해 주세요!');
    return;
  }

  // 3) 실제 전송 payload
  const payload = {
    name:        data.name.trim(),
    quantity:    quantity,
    arrivalDate: data.arrivalDate,
    remark:      data.remark,
    shelfId:     data.shelfId,
    levelId:     data.levelId
  };

  try {
    // ... 기존 PUT/POST 로직은 동일합니다
  } catch (e) {
    console.error('아이템 저장 오류:', e);
    alert('아이템 저장 중 오류가 발생했습니다.');
  }
}


// 드로어 업데이트 / 삭제 / 추가
async function onUpdateFromDrawer(id, delta) {
  const item = items.value.find(i => i.id === id)
  if (!item) return
  const newQty = item.quantity + delta
  if (newQty < 0) return
  const payload = {
    name:        item.name,
    quantity:    newQty,
    arrivalDate: item.arrivalDate,
    remark:      item.remark,
    shelfId:     item.shelfId ?? item.shelf?.id,
    levelId:     item.levelId ?? item.level?.id
  }
  try {
    await axios.put(`http://localhost:3000/api/items/${id}`, payload)
    await fetchItems()
  } catch (e) {
    console.error('수량 업데이트 오류:', e)
    alert('수량 업데이트 중 오류가 발생했습니다.')
  }
}

async function onDeleteFromDrawer(id) {
  if (!confirm('삭제하시겠습니까?')) return
  try {
    await axios.delete(`http://localhost:3000/api/items/${id}`)
    await fetchItems()
  } catch (e) {
    console.error('삭제 오류:', e)
    alert('삭제 중 오류가 발생했습니다.')
  }
}

function onAddFromDrawer({ shelf, level }) {
  currentShelf.value = shelf
  currentLevel.value = level
  editingItem.value = null
  showDrawer.value = true
  showModal.value = true
}
//안녕 클레오파트라
// 초기 로드
onMounted(fetchItems)
</script>

<style>
:root {
  --header-h: 6rem;
  --sidebar-w: 21rem;
  --warehouse-h: 450px;
  --primary-blue: #3b82f6;
  --secondary-purple: #8b5cf6;
  --accent-green: #10b981;
  --dark-bg: #0f172a;
  --light-bg: #f8fafc;
  --glass-bg: rgba(255, 255, 255, 0.15);
  --glass-border: rgba(255, 255, 255, 0.2);
}

body {
  margin: 0;
  font-family: 'Poppins', 'Inter', sans-serif;
  background-color: var(--light-bg);
  transition: background-color 0.3s ease;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: hidden;
}

.header {
  display: flex;
  justify-content: center;
  align-items: center;
  height: var(--header-h);
  background: radial-gradient(circle at center, rgba(248, 250, 252, 0.9) 0%, rgba(214, 228, 255, 0.85) 100%); /* Gemini 스타일 배경 */
  backdrop-filter: blur(12px); /* 유리 효과 */
  border-bottom: 1px solid rgba(66, 133, 244, 0.2); /* 미세 테두리 */
  position: sticky;
  top: 0;
  z-index: 10;
  animation: headerPulse 4s ease-in-out infinite; /* 은은한 펄스 */
  transition: background 0.3s ease;
}

.dark-mode .header {
  background: radial-gradient(circle at center, rgba(15, 23, 42, 0.9) 0%, rgba(59, 7, 100, 0.85) 100%);
  border-bottom: 1px solid rgba(123, 31, 162, 0.2);
  backdrop-filter: blur(12px);
}

.gradient-text {
  font-size: 4.75rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  font-family: 'Poppins', 'Inter', sans-serif;
  background: linear-gradient(90deg, #4285F4 20%, #2dbd09 80%); /* Gemini 그라디언트 */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-transform: uppercase;
  transition: transform 0.3s ease, filter 0.3s ease;
  animation: gradientFlow 4s ease-in-out infinite; /* 부드러운 흐름 */
}

.gradient-text:hover {
  transform: scale(1.02);
  filter: brightness(1.1);
}

@keyframes headerPulse {
  0%, 100% { background: radial-gradient(circle at center, rgba(248, 250, 252, 0.9) 0%, rgba(214, 228, 255, 0.85) 100%); }
  50% { background: radial-gradient(circle at center, rgba(248, 250, 252, 0.95) 0%, rgba(214, 228, 255, 0.9) 100%); }
}

.dark-mode .gradient-text {
  animation: gradientFlow 4s ease-in-out infinite;
}

@keyframes gradientFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.sidebar {
  width: var(--sidebar-w);
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  padding: 1.5rem 1rem;
  position: fixed;
  top: var(--header-h);
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  border-right: 1px solid var(--glass-border);
  transition: all 0.3s ease;
  overflow-x: hidden;
}

.dark-mode .sidebar {
  background: rgba(15, 23, 42, 0.8);
  border-right-color: rgba(255, 255, 255, 0.15);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.button-group {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: flex-start;
}

.button-group button {
  flex: 1;
  max-width: 8rem;
  padding: 0.5rem;
  font-size: 0.85rem;
}

.search-wrapper {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.search-wrapper input {
  width: 100%;
  padding: 0.75rem 0.5rem;
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 0.5rem;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  color: #1e293b;
  font-size: 0.875rem;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.search-wrapper input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.dark-mode .search-wrapper input {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border-color: rgba(147, 197, 253, 0.5);
}

.dark-mode .search-wrapper input:focus {
  border-color: #93c5fd;
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 0.5rem;
  max-height: 12rem;
  overflow-y: auto;
  list-style: none;
  padding: 0.5rem 0;
  margin: 0.25rem 0 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
  z-index: 20;
}

.dark-mode .suggestions-list {
  background: rgba(15, 23, 42, 0.8);
  border-color: rgba(255, 255, 255, 0.15);
}

.suggestions-list li {
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;
}

.suggestions-list li:hover {
  background: rgba(59, 130, 246, 0.2);
}

button {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: linear-gradient(90deg, var(--primary-blue), var(--secondary-purple));
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.3s ease;
}

button:hover {
  transform: scale(1.02);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
  background: linear-gradient(90deg, var(--secondary-purple), var(--accent-green));
}

.dark-toggle {
  background: transparent;
  color: var(--primary-blue);
  border: 1px solid var(--primary-blue);
  transition: all 0.2s ease;
}

.dark-toggle:hover {
  background: rgba(59, 130, 246, 0.2);
  transform: scale(1.02);
}

.dark-mode .dark-toggle {
  color: #93c5fd;
  border-color: #93c5fd;
}

.main-content {
  margin-left: var(--sidebar-w);
  padding: 2rem;
  flex-grow: 1;
  background: var(--light-bg);
  transition: background-color 0.3s ease;
}

.warehouse-map-container {
  width: 100%;
  height: var(--warehouse-h);
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.dark-mode {
  background: var(--dark-bg);
  color: #e2e8f0;
}

.dark-mode .main-content {
  background: var(--dark-bg);
}

.dark-mode .warehouse-map-container {
  background: rgba(255, 255, 255, 0.1);
}
</style>