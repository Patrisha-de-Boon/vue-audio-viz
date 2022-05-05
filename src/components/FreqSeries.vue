<template>
    <g>
        <g v-if="invert">
            <g
                v-for="(freq, i) in stableFreqArray"
                :key="i + '-' + freq"
            >
                <StandardBar
                    :height="yScale(freq) ?? 0"
                    :width="barWidth"
                    :x="xScale(i) ?? 0"
                    :y="invert ? height / 2 : 0"
                    :invert="true"
                    :chart-height="invert ? height / 2 : height"
                    :fill="colourScale(freq)"
                />
            </g>
        </g>
        <g
            v-for="(freq, i) in freqArray"
            :key="i + '-' + freq + '-' + eqNodes[i]"
        >
            <StandardBar
                :height="yScale(freq) ?? 0"
                :width="barWidth"
                :x="xScale(i) ?? 0"
                :y="0"
                :invert="false"
                :chart-height="invert ? height / 2 : height"
                :fill="colourScale(freq)"
            />
            <EqualizerBar
                :height="height ?? 0"
                :width="barWidth"
                :x="xScale(i) ?? 1"
                :chart-height="height"
                :fill="eqColour"
                :eq="getEQ(i)"
                @change="(gain: number) => emit('change', { gain: gain, index: i})"
            />
        </g>
    </g>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import { watch, ref, type Ref } from 'vue';
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

function getEQ(index: number) {
    return props.eqNodes.length > index ? props.eqNodes[index] : null;
}
const yScale: Ref<ScaleLinear<number, number, never>> = ref(d3.scaleLinear()
    .domain([0, 255])
    .range([0, props.height]));

const xScale: Ref<ScaleBand<number>> = ref(d3.scaleBand<number>()
    .domain(d3.range(helper.freqBins.length - 1))
    .range([0, props.width]));

const barWidth: Ref<number> = ref(xScale.value.bandwidth() ?? 0);

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
});

watch(() => props.lowColour || props.highColour, () => {
    colourScale.value = d3.scaleLinear<string>()
        .domain([0, 255])
        .range([props.lowColour, props.highColour]);
});
</script>
