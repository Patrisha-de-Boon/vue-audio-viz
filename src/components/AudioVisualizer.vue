<template>
    <BarChart
        :width="width"
        :height="height"
    >
        <FreqSeries
            :data="freqArray"
            :width="width"
            :height="height"
            :high-colour="highColour"
            :low-colour="lowColour"
            :eq-colour="eqColour"
            :use-eq="useEq"
            :audio-context="audioContext"
        />
    </BarChart>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { AudioSource } from '@/audioSource';
import BarChart from './BarChart.vue';
import FreqSeries from './FreqSeries/FreqSeries.vue';

const props = defineProps<{
  height: number;
  width: number;
  eqColour: string
  lowColour: string;
  highColour: string;
  audioSource: AudioSource | null;
  audioContext: AudioContext;
  useEq: boolean;
}>();

let isPlaying = false;
let freqArray: number[] = [];

function refreshArray() {
    if (props.audioSource) {
        freqArray = props.audioSource.getFreqArray();
    }

    if (isPlaying) {
        setTimeout(() => {
            refreshArray();
        }, 10);
    }
}

function play() {
    isPlaying = true;
    refreshArray();
}

play();

function resetEQ() {
    const childComponentRef = ref<typeof FreqSeries>();
    childComponentRef.value?.resetEQ();
}

function end() {
    isPlaying = false;
}
</script>
