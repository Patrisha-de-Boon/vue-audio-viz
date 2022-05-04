<template>
    <svg
        :width="width"
        :height="height"
    >
        <rect
            id="volumeClick"
            :x="0"
            :y="0"
            fill="black"
            :width="width"
            :height="height"
            @mousemove="mouseMove"
            @mousedown="mouseDown"
        />
        <rect
            id="currentVolume"
            :x="0"
            :y="0"
            :fill="fill"
            :width="currentWidth"
            :height="height"
        />
        <text
            className="volumeLeft"
            :x="10"
            :y="height / 2"
        >0</text>
        <text
            className="volumeRight"
            :x="width - 10"
            :y="height / 2"
        >100</text>
    </svg>
</template>

<script setup lang="ts">
import * as d3 from 'd3';

const emit = defineEmits<{
    (e: 'change', volume: number): void
}>();

defineProps<{
  height: number;
  width: number;
  currentWidth: number;
  fill: string;
}>();

function setVolume(e: MouseEvent) {
    if (e.target) {
        const newWidth = e.pageX - ((d3.select('#volumeClick').node() as Element)?.getBoundingClientRect().left ?? 0);
        emit('change', newWidth / (e.target as Element).getBoundingClientRect().width);
    }
}

function mouseDown(e: MouseEvent) {
    setVolume(e);
}

function mouseMove(e: MouseEvent) {
    if (e.buttons === 1) {
        setVolume(e);
    }
}
</script>

<style scoped>
.volumeRight {
  text-anchor: end;
}
</style>
