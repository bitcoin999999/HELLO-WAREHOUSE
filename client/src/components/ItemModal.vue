<script setup>
import { reactive, ref, watch } from 'vue';

const props = defineProps({
  visible: Boolean,
  shelf: Number,
  level: Number,
  item: Object
});
const emit = defineEmits(['saved', 'close']);

const form = reactive({
  name: '',
  quantity: 0,
  arrivalDate: new Date().toISOString().slice(0, 10),
  remark: ''
});
const mode = ref('추가');

/* 모달 열릴 때마다 초기화 또는 수정용 데이터 삽입 */
watch(
  () => props.visible,
  (v) => {
    if (!v) return;
    if (props.item) {
      Object.assign(form, props.item);
      mode.value = '수정';
    } else {
      Object.assign(form, {
        name: '',
        quantity: 0,
        arrivalDate: new Date().toISOString().slice(0, 10),
        remark: ''
      });
      mode.value = '추가';
    }
  },
  { immediate: true }
);

function save() {
  emit('saved', {
    ...form,
    shelfId: props.shelf,
    levelId: props.level,
    id: props.item?.id
  });
}
</script>

<template>
  <!-- ⬇︎ props. 제거 → 템플릿에서 바로 visible/shelf 사용 -->
  <div v-if="visible" class="modal-backdrop">
    <div class="modal-window">
      <h3>아이템 {{ mode }} (선반 {{ shelf }} 층 {{ level }})</h3>

      <label>이름:     <input v-model="form.name" /></label>
      <label>수량:     <input v-model.number="form.quantity" type="number" /></label>
      <label>입고일:   <input v-model="form.arrivalDate" type="date" /></label>
      <label>비고:     <input v-model="form.remark" /></label>

      <div class="buttons">
        <button @click="save">저장</button>
        <button @click="$emit('close')">닫기</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 기존 스타일 그대로 */
.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;justify-content:center;align-items:center}
.modal-window{background:#fff;padding:1.5rem;border-radius:.5rem;width:300px}
.modal-window label{display:block;margin:.5rem 0}
.buttons{display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem}
</style>
