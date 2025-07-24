<template>
  <svg
    :width="svgWidth"
    :height="svgHeight"
    :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
    preserveAspectRatio="xMidYMid meet"
    class="warehouse-layout"
  >
    <defs>
      <linearGradient id="filledGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.7" /> <!-- 파란색 계열 (물건 차 있음) -->
        <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.7" />
      </linearGradient>
      <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10b981" stop-opacity="0.7" /> <!-- 초록색 계열 (물건 없음) -->
        <stop offset="100%" stop-color="#34d399" stop-opacity="0.7" />
      </linearGradient>
      <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0, 0, 0, 0.2)" />
      </filter>
    </defs>

    <g v-for="shelf in shelves" :key="shelf.number">
      <!-- 선반 배경 -->
      <rect
        :x="calculateX(shelf.number)"
        y="10"
        :width="cellWidth"
        :height="svgHeight - 100"
        :fill="hasItem(shelf.number) ? 'url(#filledGrad)' : 'url(#emptyGrad)'"
        rx="12"
        ry="12"
        stroke="var(--primary-blue)"
        stroke-opacity="0.5"
        fill-opacity="0.7"
        filter="url(#blur) url(#shadow)"
        class="shelf-rect"
      />
      <!-- 선반 번호 -->
      <text
        :x="calculateX(shelf.number) + cellWidth / 2"
        :y="svgHeight - 70"
        text-anchor="middle"
        :font-size="calc(14 * (props.cellSize / 100))"
        fill="#1e293b"
        class="shelf-text"
      >
        {{ shelf.number }}번
      </text>

      <!-- 구분선 (4개) -->
      <g v-for="sep in [1,2,3,4]" :key="'sep-'+sep">
        <line
          :x1="calculateX(shelf.number)"
          :y1="10 + sep * ((svgHeight - 100) / 5)"
          :x2="calculateX(shelf.number) + cellWidth"
          :y2="10 + sep * ((svgHeight - 100) / 5)"
          stroke="var(--primary-blue)"
          stroke-opacity="0.5"
        />
      </g>

      <!-- 클릭 레벨 박스 (5개) - 아래가 1층 -->
      <g v-for="level in [1,2,3,4,5]" :key="'btn-'+level">
        <rect
          :x="calculateX(shelf.number)"
          :y="10 + (5 - level) * ((svgHeight - 100) / 5)"
          :width="cellWidth"
          :height="(svgHeight - 100) / 5"
          fill="transparent"
          @click="onShelfClick(shelf.number, level)"
        />
      </g>
    </g>
  </svg>
</template>

<script setup>
import { ref, computed } from 'vue'
import { defineEmits, defineProps } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  cellSize: { type: Number, default: 100 }
})
const emit = defineEmits(['select-shelf'])

const shelves = ref([
  { number: 1 },
  { number: 2 },
  { number: 3 },
  { number: 4 },
])

// 여백 및 선반 간격 설정
const margin = 10
const gap = 30

// SVG 크기 계산
const svgWidth = computed(() => {
  const baseWidth = window.innerWidth <= 768 ? 300 : 400
  return baseWidth + (margin * 2) + (gap * 2) // 좌우 마진 + 1-2, 3-4 간격
})
const svgHeight = computed(() => (window.innerWidth <= 768 ? 300 : 400) * (props.cellSize / 100))
const cellWidth = computed(() => (svgWidth.value - (margin * 2) - (gap * 2)) / 4)

// 선반별 x 좌표 계산: 1-2, 3-4 간격 30px, 2-3 붙어 있음
function calculateX(shelfNumber) {
  if (shelfNumber === 1) return margin
  if (shelfNumber === 2) return margin + cellWidth.value + gap
  if (shelfNumber === 3) return margin + cellWidth.value * 2 + gap
  if (shelfNumber === 4) return margin + cellWidth.value * 3 + gap * 2
  return margin
}

// 물건 여부 체크
function hasItem(shelfNumber) {
  return props.items.some(i => i.shelfId === shelfNumber && i.quantity > 0)
}

function onShelfClick(shelfNumber, levelNumber) {
  emit('select-shelf', shelfNumber, levelNumber)
}
</script>

<style scoped>
.warehouse-layout {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
  border-radius: 12px;
  padding: calc(10px * var(--cell-scale));
  border: 1px solid rgba(59, 130, 246, 0.15);
  backdrop-filter: blur(10px);
}

.dark-mode .warehouse-layout {
  background: radial-gradient(circle at center, rgba(30, 41, 59, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: 1px solid rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(10px);
}

.shelf-rect {
  transition: transform 0.3s ease, fill-opacity 0.3s ease, filter 0.3s ease;
}
.shelf-rect:hover {
  transform: scale(1.05);
  fill-opacity: 0.85;
  filter: brightness(1.1) url(#blur) url(#shadow);
}

.shelf-text {
  font-family: 'Poppins', 'Inter', sans-serif;
  font-weight: 500;
  font-size: calc(14px * var(--cell-scale));
  transition: fill 0.3s ease;
}
.dark-mode .shelf-text {
  fill: #e2e8f0;
}
</style>
