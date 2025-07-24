<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    preserveAspectRatio="xMidYMid meet"
    class="warehouse-map"
  >
    <defs>
      <linearGradient id="cellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.7" /> <!-- 파란색 계열 (물건 차 있음) -->
        <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.7" /> <!-- 버튼 스타일 -->
      </linearGradient>
      <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10b981" stop-opacity="0.7" /> <!-- 초록색 계열 (물건 없음) -->
        <stop offset="100%" stop-color="#34d399" stop-opacity="0.7" />
      </linearGradient>
      <linearGradient id="hitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#059669" stop-opacity="0.7" /> <!-- 하이라이트 (선명한 초록) -->
        <stop offset="100%" stop-color="#10b981" stop-opacity="0.7" />
      </linearGradient>
      <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <!-- 전체 셀을 묶는 그룹 -->
    <g :transform="`scale(${props.cellSize / 100})`">
      <g v-for="level in levels" class="map-row"
        :key="level"
        :transform="`translate(0, ${(props.levelsCount - level) * 100})`"
      >
        <g v-for="shelf in shelves" class="map-cell"
          :key="shelf"
          :transform="`translate(${(shelf - 1) * 100}, 0)`"
        >
          <rect
            :width="100 - 2"
            :height="100 - 2"
            x="1"
            y="1"
            :fill="!hasItem(shelf, level)
                     ? 'url(#emptyGrad)'
                     : isHighlighted(shelf, level)
                       ? 'url(#hitGrad)'
                       : 'url(#cellGrad)'"
            rx="12"
            ry="12"
            fill-opacity="0.7"
            stroke-opacity="0.5"
            filter="url(#blur)"
            @click="selectCell(shelf, level)"
            :class="{ 'is-highlighted': isHighlighted(shelf, level) }"
          />
          <text
            :x="100 / 2"
            :y="100 - 6"
            text-anchor="middle"
            class="cell-text"
          >
            {{ shelf }}-{{ level }}
          </text>
        </g>
      </g>
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  shelvesCount: { type: Number, default: 4 },
  levelsCount: { type: Number, default: 5 },
  highlighted: { type: Array, default: () => [] },
  items: { type: Array, default: () => [] },
  cellSize: { type: Number, default: 100 } // 동적 셀 크기 prop
})
const emit = defineEmits(['select'])

const width = computed(() => props.shelvesCount * props.cellSize)
const height = computed(() => props.levelsCount * props.cellSize)

const shelves = computed(() => Array.from({ length: props.shelvesCount }, (_, i) => i + 1))
const levels = computed(() => Array.from({ length: props.levelsCount }, (_, i) => i + 1))

function selectCell(shelf, level) {
  emit('select', { shelf, level })
}
function isHighlighted(shelf, level) {
  return props.highlighted.some(h => h.shelf === shelf && h.level === level)
}
function hasItem(shelf, level) {
  return props.items.some(i => i.shelfId === shelf && i.levelId === level && i.quantity > 0)
}
</script>

<style scoped>
.warehouse-map {
  margin-top: calc(20px * var(--cell-scale));
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%); /* 버튼 스타일 배경 */
  border-radius: 12px;
  padding: calc(10px * var(--cell-scale));
  border: 1px solid rgba(59, 130, 246, 0.15); /* 부드러운 테두리 */
  backdrop-filter: blur(10px); /* 유리 효과 */
}

.dark-mode .warehouse-map {
  background: radial-gradient(circle at center, rgba(30, 41, 59, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: 1px solid rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(10px);
}

.map-cell rect {
  stroke: var(--primary-blue); /* #3b82f6 */
  stroke-width: 1.5;
  stroke-opacity: 0.5;
  transition: transform 0.3s ease, fill-opacity 0.3s ease, filter 0.3s ease;
  animation: cellPulse 5s ease-in-out infinite; /* 느린 펄스 */
}

.map-cell rect:hover {
  transform: scale(1.05);
  fill-opacity: 0.85;
  filter: brightness(1.1); /* 버튼 호버 효과 반영 */
}

.map-cell rect.is-highlighted {
  animation: hitPulse 4s ease-in-out infinite; /* 하이라이트 펄스 */
}

.dark-mode .map-cell rect {
  stroke: #93c5fd; /* 다크 모드 조화 */
  stroke-opacity: 0.5;
}

.dark-mode .map-cell rect:hover {
  fill-opacity: 0.85;
  filter: brightness(1.1);
}

.cell-text {
  font-family: 'Poppins', 'Inter', sans-serif;
  font-weight: 500;
  font-size: calc(14px * var(--cell-scale));
  fill: #1e293b;
  transition: fill 0.3s ease;
}

.dark-mode .cell-text {
  fill: #e2e8f0;
}

@keyframes cellPulse {
  0%, 100% { fill-opacity: 0.7; }
  50% { fill-opacity: 0.8; }
}

@keyframes hitPulse {
  0%, 100% { fill-opacity: 0.7; }
  50% { fill-opacity: 0.9; }
}
</style>
