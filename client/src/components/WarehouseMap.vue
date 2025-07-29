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
        <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.7" />
        <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.7" />
      </linearGradient>
      <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10b981" stop-opacity="0.7" />
        <stop offset="100%" stop-color="#34d399" stop-opacity="0.7" />
      </linearGradient>
      <linearGradient id="hitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#059669" stop-opacity="0.7" />
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

    <!-- 전체 셀을 그리는 그룹 -->
    <g :transform="`scale(${props.cellSize / 100})`">
      <g
        v-for="level in levels"
        class="map-row"
        :key="level"
        :transform="`translate(0, ${(props.levelsCount - level) * 100})`"
      >
        <g
          v-for="shelf in shelves"
          class="map-cell"
          :key="shelf"
          :transform="`translate(${posOffset(shelf) * 100}, 0)`"
        >
          <rect
            :width="100 - 2"
            :height="100 - 2"
            x="1"
            y="1"
            :fill="
              !hasItem(shelf, level)
                ? 'url(#emptyGrad)'
                : isHighlighted(shelf, level)
                  ? 'url(#hitGrad)'
                  : 'url(#cellGrad)'
            "
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
  cellSize: { type: Number, default: 100 }
})
const emit = defineEmits(['select'])

/**
 * 선반별 가로 위치를 계산합니다.
 * 1번은 위치 0, 2번은 위치 2, 3번은 위치 3, 4번은 위치 5로 지정하면
 * 가운데 빈칸이 생겨 1, 23, 4 형태가 됩니다.
 * 그 외의 경우에는 기본 연속 배치입니다.
 */
function posOffset (shelf) {
  if (props.shelvesCount === 4) {
    if (shelf === 1) return 0
    if (shelf === 2) return 2
    if (shelf === 3) return 3
    if (shelf === 4) return 5
  }
  return shelf - 1
}

const width = computed(() => {
  if (props.shelvesCount === 4) {
    // 마지막 칸(offset 5)까지 포함해 총 6칸을 그립니다.
    return 6 * props.cellSize
  }
  return props.shelvesCount * props.cellSize
})
const height = computed(() => props.levelsCount * props.cellSize)

const shelves = computed(() => Array.from({ length: props.shelvesCount }, (_, i) => i + 1))
const levels  = computed(() => Array.from({ length: props.levelsCount },  (_, i) => i + 1))

function selectCell (shelf, level) {
  emit('select', { shelf, level })
}
function isHighlighted (shelf, level) {
  return props.highlighted.some(h => h.shelf === shelf && h.level === level)
}
function hasItem (shelf, level) {
  return props.items.some(i => i.shelfId === shelf && i.levelId === level && i.quantity > 0)
}
</script>

<style scoped>
/* 기존 스타일 그대로 유지 */
.warehouse-map {
  margin-top: calc(20px * var(--cell-scale));
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
  border-radius: 12px;
  padding: calc(10px * var(--cell-scale));
  border: 1px solid rgba(59, 130, 246, 0.15);
  backdrop-filter: blur(10px);
}
.dark-mode .warehouse-map {
  background: radial-gradient(circle at center, rgba(30, 41, 59, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: 1px solid rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(10px);
}
.map-cell rect {
  stroke: var(--primary-blue);
  stroke-width: 1.5;
  stroke-opacity: 0.5;
  transition: transform 0.3s ease, fill-opacity 0.3s ease, filter 0.3s ease;
  animation: cellPulse 5s ease-in-out infinite;
}
.map-cell rect:hover {
  transform: scale(1.05);
  fill-opacity: 0.85;
  filter: brightness(1.1);
}
.map-cell rect.is-highlighted {
  animation: hitPulse 4s ease-in-out infinite;
}
.dark-mode .map-cell rect {
  stroke: #93c5fd;
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
  50%     { fill-opacity: 0.8; }
}
@keyframes hitPulse {
  0%, 100% { fill-opacity: 0.7; }
  50%     { fill-opacity: 0.9; }
}
</style>
