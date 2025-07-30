<template>
  <svg
    :width="svgWidth"
    :height="svgHeight"
    :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
    preserveAspectRatio="xMidYMid meet"
    class="warehouse-layout"
  >
    <defs>
      <!-- 물건 있는 선반용: 파스텔 블루-핑크 그라데이션 -->
      <linearGradient id="filledGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6366F1" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#EC4899" stop-opacity="0.8" />
      </linearGradient>
      <!-- 비어있는 선반용: 연보라-연분홍 파스텔 그라데이션 -->
      <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#A5B4FC" stop-opacity="0.7" />
        <stop offset="100%" stop-color="#FBCFE8" stop-opacity="0.7" />
      </linearGradient>
      <!-- 그림자/블러 필터는 기존과 동일 -->
      <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.2)" />
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
        stroke-opacity="0.4"
        fill-opacity="0.8"
        filter="url(#blur) url(#shadow)"
        class="shelf-rect"
      />
      <!-- 선반 번호 표시 -->
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

      <!-- 층 구분선 (5층 → 구분선 4개) -->
      <g v-for="sep in [1, 2, 3, 4]" :key="'sep-' + sep">
        <line
          :x1="calculateX(shelf.number)"
          :y1="10 + sep * ((svgHeight - 100) / 5)"
          :x2="calculateX(shelf.number) + cellWidth"
          :y2="10 + sep * ((svgHeight - 100) / 5)"
          stroke="var(--primary-blue)"
          stroke-opacity="0.4"
        />
      </g>

      <!-- 클릭 가능한 층 영역 (5개) -->
      <g v-for="level in [1, 2, 3, 4, 5]" :key="'btn-' + level">
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
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  cellSize: { type: Number, default: 100 }
})
const emit = defineEmits(['select-shelf'])

/*
 * 선반 번호를 1~5로 확장
 */
const shelves = ref([
  { number: 1 },
  { number: 2 },
  { number: 3 },
  { number: 4 },
  { number: 5 },
])

// 여백과 통로 간격
const margin = 10
const gap    = 30

// SVG 가로 길이: 모바일/데스크톱에 따라 기본값을 살짝 늘렸어요(5개 선반 대응)
const svgWidth = computed(() => {
  const baseWidth = window.innerWidth <= 768 ? 360 : 480
  return baseWidth + margin * 2 + gap * 2
})
const svgHeight = computed(() => (window.innerWidth <= 768 ? 300 : 400) * (props.cellSize / 100))

// 선반 개수를 사용하여 가로폭을 동적으로 계산
const cellWidth = computed(() => {
  return (svgWidth.value - margin * 2 - gap * 2) / shelves.value.length
})

// 선반 번호에 따라 x 좌표 계산: 2개 묶음마다 통로를 넣음
function calculateX(shelfNumber) {
  const walkwayCount = Math.floor((shelfNumber - 1) / 2)
  return margin + cellWidth.value * (shelfNumber - 1) + gap * walkwayCount
}

// 해당 선반에 물건이 있는지 체크
function hasItem(shelfNumber) {
  return props.items.some(i => (i.shelfId ?? i.shelf?.number) === shelfNumber && i.quantity > 0)
}

// 선반/층을 클릭했을 때 부모 컴포넌트로 전달
function onShelfClick(shelfNumber, levelNumber) {
  emit('select-shelf', shelfNumber, levelNumber)
}
</script>

<style scoped>
/* 메인 레이아웃: 글래스모피즘 느낌의 파스텔 배경 */
.warehouse-layout {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background:
    linear-gradient(135deg, rgba(240,245,255,0.9) 0%, rgba(255,245,250,0.9) 100%),
    radial-gradient(circle at center, rgba(255,255,255,0.9) 0%, rgba(243,246,255,0.6) 100%);
  border-radius: 16px;
  padding: calc(10px * var(--cell-scale));
  border: 1px solid rgba(200,210,255,0.4);
  backdrop-filter: blur(20px);
}

/* 다크모드: 파스텔을 누른 어두운 그라데이션 */
.dark-mode .warehouse-layout {
  background:
    linear-gradient(135deg, rgba(30,34,50,0.9) 0%, rgba(45,32,66,0.8) 100%),
    radial-gradient(circle at center, rgba(30,34,50,0.9) 0%, rgba(45,32,66,0.6) 100%);
  border: 1px solid rgba(70,40,120,0.4);
  backdrop-filter: blur(20px);
}

/* 선반 배경 애니메이션 */
.shelf-rect {
  transition: transform 0.3s ease, fill-opacity 0.3s ease, filter 0.3s ease;
}
.shelf-rect:hover {
  transform: scale(1.05);
  fill-opacity: 0.85;
  filter: brightness(1.1) url(#blur) url(#shadow);
}

/* 선반 번호 텍스트 */
.shelf-text {
  font-family: 'Poppins', 'Inter', sans-serif;
  font-weight: 600;
  font-size: calc(14px * var(--cell-scale));
  transition: fill 0.3s ease;
}
.dark-mode .shelf-text {
  fill: #e2e8f0;
}
</style>
