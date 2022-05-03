<template>
    <rect
        class-name="bar"
        fill="{{fill}}"
        width="{{width}}"
        height="{{height}}"
        x="{{x}}"
        y="{{chartHeight - height}}"
    />
</template>

<script setup lang="ts">
defineProps<{
  width: number;
  height: number;
  fill: string;
}>();
</script>

<style scoped>
rect.bar {
    shape-rendering: crispEdges;
}
</style>
