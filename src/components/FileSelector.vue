<template>
    <div id="uploadButton">
        <label for="audioFile">
            <InlineSvg
                :src="src"
                alt="add"
                fill="white"
            />
            <input
                id="audioFile"
                ref="audioFile"
                type="file"
                accept="audio/*"
                multiple="true"
                @change="onFileChange"
            >
        </label>
    </div>
</template>

<script setup lang="ts">
import InlineSvg from 'vue-inline-svg';

const emit = defineEmits<{
    (e: 'change', file: FileList | null): void
}>();

defineProps<{
  src: any;
}>();

function onFileChange(event: Event) {
    if (event && event.target) {
        emit('change', (event.target as HTMLInputElement).files);
    }
}
</script>

<style scoped>
input {
    display: none;
}
</style>
