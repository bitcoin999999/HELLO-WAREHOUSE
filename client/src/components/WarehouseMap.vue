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
  <stop offset="0%"  stop-color="#6366F1" stop-opacity="0.8" />  <!-- 연보라 -->
  <stop offset="100%" stop-color="#EC4899" stop-opacity="0.8" />  <!-- 파스텔 핑크 -->
</linearGradient>

<linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%"  stop-color="#A5B4FC" stop-opacity="0.7" />  <!-- 파랑빛 라벤더 -->
  <stop offset="100%" stop-color="#FBCFE8" stop-opacity="0.7" />  <!-- 연핑크 -->
</linearGradient>

<linearGradient id="hitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%"  stop-color="#FDBA74" stop-opacity="0.8" />  <!-- 파스텔 오렌지 -->
  <stop offset="100%" stop-color="#F47C7C" stop-opacity="0.8" />  <!-- 코랄핑크 -->
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
  // 기본값을 5로 변경
  shelvesCount: { type: Number, default: 5 },
  levelsCount:  { type: Number, default: 5 },
  highlighted:  { type: Array,  default: () => [] },
  items:        { type: Array,  default: () => [] },
  cellSize:     { type: Number, default: 100 }
})
const emit = defineEmits(['select'])

/**
 * 선반별 가로 위치를 계산합니다.
 * 5개 선반일 때는 12 34 5 형태가 되도록
 * 4개일 때는 1 23 4 형태가 되도록 배열해요.
 */
function posOffset(shelf) {
  // 5개 선반일 때: 1→0, 2→1, 3→3, 4→4, 5→6
  if (props.shelvesCount === 5) {
    if (shelf === 1) return 0
    if (shelf === 2) return 1
    if (shelf === 3) return 3
    if (shelf === 4) return 4
    if (shelf === 5) return 6
  }
  // 4개 선반일 때: 1→0, 2→2, 3→3, 4→5 (기존 로직)
  if (props.shelvesCount === 4) {
    if (shelf === 1) return 0
    if (shelf === 2) return 2
    if (shelf === 3) return 3
    if (shelf === 4) return 5
  }
  // 그 외엔 연속 배치
  return shelf - 1
}

// 전체 너비 계산: 5개 선반이라면 통로 2칸을 포함해 7칸으로 그립니다.
const width = computed(() => {
  if (props.shelvesCount === 5) {
    return 7 * props.cellSize
  }
  if (props.shelvesCount === 4) {
    return 6 * props.cellSize
  }
  return props.shelvesCount * props.cellSize
})
const height = computed(() => props.levelsCount * props.cellSize)
const shelves = computed(() => Array.from({ length: props.shelvesCount }, (_, i) => i + 1))
const levels  = computed(() => Array.from({ length: props.levelsCount },  (_, i) => i + 1))

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
/* 배경을 최신 파스텔&글래스모피즘 스타일로 변경 */
.warehouse-map {
  margin-top: calc(20px * var(--cell-scale));
  background:
    linear-gradient(135deg, rgba(240,245,255,0.9) 0%, rgba(255,245,250,0.9) 100%),
    radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(243,246,255,0.5) 100%);
  border-radius: 16px;
  padding: calc(10px * var(--cell-scale));
  border: 1px solid rgba(200,210,255,0.4);
  backdrop-filter: blur(20px);
}
.dark-mode .warehouse-map {
  background:
    linear-gradient(135deg, rgba(30,34,50,0.9) 0%, rgba(45,32,66,0.8) 100%),
    radial-gradient(circle at center, rgba(30,34,50,0.9) 0%, rgba(45,32,66,0.6) 100%);
  border: 1px solid rgba(70,40,120,0.4);
  backdrop-filter: blur(20px);
}

/* 나머지 map-cell 스타일과 애니메이션은 그대로 두어도 돼요 */
</style>
