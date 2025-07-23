<template>
  <svg width="400" height="400">
    <g v-for="shelf in shelves" :key="shelf.number">
      <rect
        :x="(shelf.number - 1) * 100 + 10"
        y="10"
        width="80"
        height="300"
        fill="#eee"
        stroke="#333"
        @click="onShelfClick(shelf.number)"
      />
      <text :x="(shelf.number - 1) * 100 + 50" y="330" text-anchor="middle">{{ shelf.number }}번</text>
      <g v-for="level in [1,2,3,4]" :key="level">
        <line
          :x1="(shelf.number - 1) * 100 + 10"
          :y1="10 + (level * 60)"
          :x2="(shelf.number - 1) * 100 + 90"
          :y2="10 + (level * 60)"
          stroke="#999"
        />
      </g>
    </g>
  </svg>
</template>

<script setup>
import { ref } from 'vue';
const shelves = ref([
  { number: 1 },
  { number: 2 },
  { number: 3 },
  { number: 4 },
]);
const emit = defineEmits(['select-shelf']);

function onShelfClick(num) {
  emit('select-shelf', num);
}
</script>
