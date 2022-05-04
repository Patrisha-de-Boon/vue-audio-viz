<template>
    <g>
        <rect
            class-name="equalizerRect"
            :fill="fill"
            :width="width ?? 0"
            :height="height / 75 ?? 0"
            :x="x"
            :y="y"
        />
        <rect
            class-name="equalizerClick"
            fill="none"
            :width="width ?? 0"
            :height="height ?? 0"
            :x="x"
            :y="chartHeight - height"
            @mousedown="mouseDown"
            @mousemove="mouseMove"
        />
    </g>
</template>

<script setup lang="ts"  >
import * as d3 from 'd3';
import { ref, type Ref, watch } from 'vue';

const props = defineProps<{
  width: number;
  height: number;
  chartHeight: number;
  fill: string;
  x: number;
  eq: BiquadFilterNode | null;
}>();

const emit = defineEmits<{
    (e: 'change', gain: number): void
}>();

const yScale = d3.scaleLinear()
    .domain([-20, 20])
    .range([props.height, 0]);

const gain: Ref<number> = ref(props.eq?.gain.value ?? 0);
const y: Ref<number> = ref(yScale(gain.value) ?? 0);

watch(() => props.eq, (newValue) => {
    gain.value = newValue?.gain.value ?? 0;
    y.value = yScale(gain.value) ?? 0;
});

function setFilter(e: MouseEvent) {
    const viz = d3.select('#visualizer').node();

    if (viz) {
        const rec = (viz as Element).getBoundingClientRect();
        // gain.value = yScale.invert(e.pageY - props.height / 150 - (viz as Element).getBoundingClientRect().top);
        gain.value = yScale.invert(e.pageY - rec.top);
        y.value = yScale(gain.value) ?? 0;
        emit('change', gain.value);
    }
}

function mouseDown(e: MouseEvent) {
    setFilter(e);
}

function mouseMove(e: MouseEvent) {
    if (e.buttons === 1) {
        setFilter(e);
    }
}
</script>

<style scoped>
rect.equalizerRect {
  shape-rendering: crispEdges;
  opacity: 0.5;
}
</style>
