<template>
    <div id="uploadButton">
        <label for="audioFile">
            {{ text }}
            <input
                id="audioFile"
                ref="audioFile"
                type="file"
                accept="audio/*"
                @change="onFileChange"
            >
        </label>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
    (e: 'change', file: FileList | null): void
}>();

defineProps<{
  text: string;
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
