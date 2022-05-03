<template>
    <g>
        <g
            v-for="(d, i) in data"
            :key="i"
        >
            <StandardBar
                :height="yScale(d)"
                :width="xScale.bandwidth()"
                :x="xScale(i)"
                :chart-height="height"
                :fill="colourScale(d)"
            />
            <EqualizerBar
                v-if="useEq"
                :height="height"
                :width="xScale.bandwidth()"
                :x="xScale(i) ?? 1"
                :chart-height="height"
                :fill="colourScale(d)"
                :eq="eqNodes[i]"
            />
        </g>
    </g>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import StandardBar from '../StandardBar.vue';
import EqualizerBar from '../EqualizerBar.vue';
import { getShelfValues } from '../../audioSource';
import * as constants from '../../constants';

const props = defineProps<{
  data: number[];
  height: number;
  width: number;
  eqColour: string;
  lowColour: string;
  highColour: string;
  useEq: boolean;
  audioContext: AudioContext;
}>();

const yScale = d3.scaleLinear()
    .domain([0, 255])
    .range([0, props.height]);

const xScale = d3.scaleBand<number>()
    .domain(d3.range(props.data.length))
    .range([0, props.width]);

const colourScale = d3.scaleLinear<string>()
    .domain([0, 255])
    .range([props.lowColour, props.highColour]);

const shelfValues = getShelfValues(props.audioContext);

// Initialize EQ values
const eqNodes: BiquadFilterNode[] = [];
eqNodes.push(shelfValues.lowshelf);
let chainLink = shelfValues.lowshelf;
for (let f = 0; f < constants.centerFreqs.length; f++) {
    const eq = props.audioContext.createBiquadFilter();
    eq.type = 'peaking';
    eq.frequency.value = constants.centerFreqs[f];
    eq.Q.value = constants.qFactors[f];
    eqNodes.push(eq);
    chainLink.connect(eq);
    chainLink = eq;
}
eqNodes.push(shelfValues.highshelf);
chainLink.connect(shelfValues.highshelf);

function resetEQ() {
    eqNodes.forEach((eq) => {
        eq.gain.value = 0;
    });
}
</script>
