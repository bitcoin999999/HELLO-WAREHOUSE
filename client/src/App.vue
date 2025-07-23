<script setup>
import { ref } from 'vue'
import WarehouseLayout from './components/WarehouseLayout.vue'
import SearchBar from './components/SearchBar.vue'
import ExportButton from './components/ExportButton.vue'
import ItemModal from './components/ItemModal.vue'
import axios from 'axios';

async function onSaveItem(data) {
  try {
    if (data.id) {
      await axios.put(`http://localhost:3000/api/items/${data.id}`, data);
    } else {
      await axios.post('http://localhost:3000/api/items', data);
    }
    // 🔄 저장 성공 후 전체 아이템 다시 불러와 화면 갱신
    await fetchItems();
  } catch (e) {
    alert('저장 실패: ' + e);
  } finally {
    showModal.value = false;
  }
}

/* 최초·저장 후 아이템 재조회 함수 */
const items = ref([]);
async function fetchItems() {
  const res = await axios.get('http://localhost:3000/api/items');
  items.value = res.data;
}
onMounted(fetchItems);


// 상태 변수
const showModal = ref(false)
const currentShelf = ref(null)
const currentLevel = ref(1)
const editingItem = ref(null)

// 1) 선반 클릭
function onSelectShelf(shelfNumber) {
  currentShelf.value = shelfNumber
  currentLevel.value = 1
  editingItem.value = null
  showModal.value = true
}

// 2) 검색 결과 클릭
function onSearchSelect(item) {
  const match = item.location.match(/(\d+)번 선반 (\d+)층/)
  if (match) {
    const [, shelf, level] = match
    currentShelf.value = Number(shelf)
    currentLevel.value = Number(level)
    editingItem.value = {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      arrivalDate: item.arrivalDate,
      remark: item.remark,
      shelfId: Number(shelf),
      levelId: Number(level)
    }
    showModal.value = true
  }
}

// 3) 모달 닫기
function onCloseModal() {
  showModal.value = false
}


</script>

<template>
  <div id="app">
    <h1>테스트 중…</h1>

    <!-- 상단 검색바 + 엑셀 내보내기 -->
    <div class="top-controls">
      <SearchBar @selected="onSearchSelect" />
      <ExportButton />
    </div>

    <!-- 창고 레이아웃 -->
    <WarehouseLayout @select-shelf="onSelectShelf" />

    <!-- 아이템 추가/수정 모달 -->
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

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
}
.top-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}
</style>
