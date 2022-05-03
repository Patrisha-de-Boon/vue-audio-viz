<template>
    <svg
        width="{{width}}"
        height="{{height}}"
    >
        <slot />
    </svg>
</template>

<script setup lang="ts">
defineProps<{
  width: number;
  height: number;
}>();
</script>
