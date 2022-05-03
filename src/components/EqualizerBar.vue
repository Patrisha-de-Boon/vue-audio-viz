<template>
    <g>
        <rect
            class-name="equalizerRect"
            fill="{{fill}}"
            width="{{width}}"
            height="{{height / 75}}"
            x="{{x}}"
            y="{{yScale(eq.gain.value)}}"
        />
        <rect
            class-name="equalizerClick"
            fill="none"
            width="{{width}}"
            height="{{height}}"
            x="{{x}}"
            y="{{chartHeight - height}}"
            @mousedown="mouseDown"
            @mousemove="mouseMove"
            @mouseup="mouseUp"
        />
    </g>
</template>

<script setup lang="ts"  >
import * as d3 from 'd3';

const props = defineProps<{
  width: number;
  height: number;
  fill: string;
  x: number;
  eq: BiquadFilterNode;
}>();

const emit = defineEmits<{
    (e: 'change', gain: number): void
}>();

let mouseIsDown = false;
const clickingVolume = false;

const yScale = d3.scaleLinear()
    .domain([-20, 20])
    .range([props.height, 0]);

function setFilter(e: MouseEvent) {
    const viz = d3.select('#visualizer').node();

    if (viz) {
        emit('change', yScale.invert(e.pageY - props.height / 150 - (viz as Element).getBoundingClientRect().top));
    }
}

function mouseDown(e: MouseEvent) {
    mouseIsDown = true;
    setFilter(e);
}

function mouseMove(e: MouseEvent) {
    if (mouseIsDown && !clickingVolume) {
        setFilter(e);
    }
}

function mouseUp() {
    mouseIsDown = false;
}
</script>

<style scoped>
rect.equalizerRect {
  shape-rendering: crispEdges;
  opacity: 0.5;
}
</style>
