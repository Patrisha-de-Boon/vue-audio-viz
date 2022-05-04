<template>
    <rect
        class-name="bar"
        :fill="fill"
        :width="width ?? 0"
        :height="height ?? 0"
        :x="x"
        :y="y + (invert ? 0 : chartHeight - height)"
    />
</template>

<script setup lang="ts">
defineProps<{
  width: number;
  height: number;
  chartHeight: number;
  x: number;
  y: number;
  fill: string;
  invert: boolean;
}>();
</script>

<style scoped>
rect.bar {
    shape-rendering: crispEdges;
}
</style>
