<template>
    <g>
        <rect
            class-name="equalizerRect"
            :fill="fill"
            :width="width ?? 0"
            :height="height / 75 ?? 0"
            :x="x"
            :y="y - ((height / 75 / 2) ?? 0)"
        />
        <rect
            class-name="equalizerClick"
            fill="none"
            :width="width ?? 0"
            :height="height ?? 0"
            :x="x"
            :y="chartHeight - height"
        />
    </g>
</template>

<script setup lang="ts"  >
import type * as d3 from 'd3';
import { ref, type Ref, watch } from 'vue';

const props = defineProps<{
  width: number;
  height: number;
  chartHeight: number;
  fill: string;
  x: number;
  gain: number;
  yScale: d3.ScaleLinear<number, number, never>;
}>();

function getDisplayGain(gain: number) {
    return gain < 0 ? gain / 2 : gain;
}

const y: Ref<number> = ref(props.yScale(getDisplayGain(props.gain)) ?? 0);

watch(() => props.gain, (newValue) => {
    y.value = props.yScale(getDisplayGain(newValue)) ?? 0;
});

watch(() => props.yScale, (newValue) => {
    y.value = newValue(getDisplayGain(props.gain)) ?? 0;
});
</script>

<style scoped>
rect.equalizerRect {
  shape-rendering: crispEdges;
  opacity: 0.5;
}
</style>
