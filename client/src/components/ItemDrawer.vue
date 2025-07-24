<template>
  <transition name="drawer">
    <aside v-if="visible" class="item-drawer">
      <header class="drawer-header">
        <h3>
          <template v-if="isFiltered">선반 {{ shelf }}번 · {{ level }}층</template>
          <template v-else>전체 아이템 목록</template>
        </h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </header>
      <div class="drawer-body">
        <table class="item-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>수량</th>
              <th v-if="!isFiltered">선반</th>
              <th v-if="!isFiltered">층</th>
              <th>조작</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in locationItems" :key="item.id">
              <td>{{ item.name }}</td>
              <td>{{ item.quantity }}</td>
              <td v-if="!isFiltered">{{ item.shelfId }}</td>
              <td v-if="!isFiltered">{{ item.levelId }}</td>
              <td class="controls">
                <button @click="$emit('update', item.id, -1)" :disabled="item.quantity <= 0">-</button>
                <button @click="$emit('update', item.id, 1)">+</button>
                <button class="delete" @click="$emit('delete', item.id)">삭제</button>
              </td>
            </tr>
            <tr v-if="!locationItems.length">
              <td :colspan="isFiltered ? 3 : 5" class="no-items">이 선반/층에는 등록된 아이템이 없습니다.</td>
            </tr>
          </tbody>
        </table>
        <button class="add-btn" @click="$emit('add', { shelf, level })">새 아이템 추가</button>
      </div>
    </aside>
  </transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  shelf:   { type: Number, required: false, default: null },
  level:   { type: Number, required: false, default: null },
  items:   { type: Array,   default: () => [] }
})
const emit = defineEmits(['close', 'update', 'add', 'delete'])

const isFiltered = computed(() => props.shelf != null && props.level != null)
const locationItems = computed(() => {
  return isFiltered.value
    ? props.items.filter(i => i.shelfId === props.shelf && i.levelId === props.level)
    : props.items
})
</script>

<style scoped>
.item-drawer {
  position: fixed;
  top: var(--header-h);
  right: 0;
  bottom: 0;
  width: 360px;
  background-color: #fff;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
  border-left: 1px solid #e5e7eb;
  z-index: 200;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-header {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #374151;
}

.drawer-body {
  flex: 1 1 auto;
  max-height: calc(100vh - var(--header-h) - 65px);
  overflow-y: auto;
  padding: 16px;
  background-color: #ffffff;
}

.item-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.item-table thead {
  background-color: #f3f4f6;
}

.item-table th,
.item-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  color: #1f2937;
}

.item-table tbody tr:hover {
  background-color: #f9fafb;
}

.controls button,
.delete {
  background-color: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  margin: 0 4px;
  cursor: pointer;
  font-size: 14px;
}

.controls button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.delete {
  background-color: #ef4444;
}

.add-btn {
  flex: 0 0 auto;
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 4px;
  background-color: #3b82f6;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
  font-size: 16px;
}

.add-btn:hover {
  background-color: #08a2e9;
}

.no-items {
  text-align: center;
  padding: 16px;
  color: #6b7280;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
