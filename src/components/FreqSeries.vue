<template>
    <g>
        <g v-if="invert">
            <StandardBar
                v-for="(freq, i) in stableFreqArray"
                :key="i + '-' + freq"
                :height="yScale(freq) ?? 0"
                :width="barWidth"
                :x="xScale(i) ?? 0"
                :y="invert ? height / 2 : 0"
                :invert="true"
                :chart-height="invert ? height / 2 : height"
                :fill="colourScale(freq)"
            />
        </g>
        <g>
            <StandardBar
                v-for="(freq, i) in freqArray"
                :key="i + '-' + freq + '-' + eqNodes[i]"
                :height="yScale(freq) ?? 0"
                :width="barWidth"
                :x="xScale(i) ?? 0"
                :y="0"
                :invert="false"
                :chart-height="invert ? height / 2 : height"
                :fill="colourScale(freq)"
            />
        </g>
        <g
            @mousedown="mouseDown"
            @mousemove="mouseMove"
        >
            <EqualizerBar
                v-for="(eq, i) in currentEqNodes"
                :key="i"
                :height="height ?? 0"
                :width="barWidth"
                :x="xScale(i) ?? 1"
                :y-scale="eqYScale"
                :chart-height="height"
                :fill="eqColour"
                :gain="eq.gain.value"
            />
        </g>
    </g>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import { watch, ref, type Ref, onMounted, onUnmounted } from 'vue';
import type { ScaleBand, ScaleLinear } from 'd3';
import StandardBar from './StandardBar.vue';
import EqualizerBar from './EqualizerBar.vue';
import * as helper from '../helper';

const props = defineProps<{
    freqArray: number[];
    stableFreqArray: number[];
    height: number;
    width: number;
    eqColour: string;
    lowColour: string;
    highColour: string;
    audioContext: AudioContext;
    eqNodes: BiquadFilterNode[];
    invert: boolean;
}>();

const emit = defineEmits<{
    (e: 'change', event: { gain: number, index: number }): void
}>();

const currentEqNodes: Ref<BiquadFilterNode[]> = ref([]);
const xScale: Ref<ScaleBand<number>> = ref(d3.scaleBand<number>()
    .domain(d3.range(helper.freqBins.length - 1))
    .range([0, props.width]));
const barWidth: Ref<number> = ref(xScale.value.bandwidth() ?? 0);

watch(() => props.eqNodes, (newValue) => {
    currentEqNodes.value = newValue;
});

const eqYScale: Ref<ScaleLinear<number, number, never>> = ref(d3.scaleLinear()
    .domain([-20, 20])
    .range([props.height, 0]));

const yScale: Ref<ScaleLinear<number, number, never>> = ref(d3.scaleLinear()
    .domain([0, 255])
    .range([0, props.height]));

const colourScale: Ref<ScaleLinear<string, string, never>> = ref(d3.scaleLinear<string>()
    .domain([0, 255])
    .range([props.lowColour, props.highColour]));

watch(() => props.width, () => {
    xScale.value = d3.scaleBand<number>()
        .domain(d3.range(helper.freqBins.length - 1))
        .range([0, props.width]);
    barWidth.value = xScale.value.bandwidth() ?? 0;
});

watch(() => props.height || props.invert, () => {
    yScale.value = d3.scaleLinear()
        .domain([0, 255])
        .range([0, props.invert ? props.height / 2 : props.height]);
    eqYScale.value = d3.scaleLinear()
        .domain([-20, 20])
        .range([props.height, 0]);
});

watch(() => props.lowColour || props.highColour, () => {
    colourScale.value = d3.scaleLinear<string>()
        .domain([0, 255])
        .range([props.lowColour, props.highColour]);
});

let visualizerBounds: DOMRect | null = null;

function onResize() {
    visualizerBounds = (d3.select('#visualizer').node() as Element).getBoundingClientRect();
}

onMounted(() => {
    onResize();
    window.addEventListener('resize', onResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', onResize);
});

function setFilter(e: MouseEvent) {
    if (visualizerBounds) {
        let gain = eqYScale.value.invert(e.pageY - visualizerBounds.top);
        if (gain < 0) {
            // -40 is 0 volume, and 40 is max volume. 40 is disruptively and unpleasantly loud,
            // but users may want to be able to fully filter out a frequency band to 0 volume.
            // yScale range is -20 to 20, so we want the bottom half of the range to cover twice
            // the values as the top half;
            gain *= 2;
        }
        const index = Math.floor((e.pageX - visualizerBounds.left) / barWidth.value);
        const currentEq = currentEqNodes.value[index];
        if (Math.abs(currentEq.gain.value - gain) >= 0.1) {
            currentEq.gain.value = gain;
            currentEqNodes.value[index] = currentEq;
            emit('change', { gain, index });
        }
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
