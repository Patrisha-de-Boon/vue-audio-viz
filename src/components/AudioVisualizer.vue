<template>
    <svg
        :width="width ?? 0"
        :height="height ?? 0"
    >
        <FreqSeries
            :freq-array="freqArray"
            :width="width ?? 0"
            :height="height ?? 0"
            :high-colour="highColour"
            :low-colour="lowColour"
            :eq-colour="eqColour"
            :use-eq="useEq"
            :audio-context="audioContext"
            :eq-nodes="eqNodes"
            :invert="invert"
            @change="(event) => emit('change', event)"
        />
    </svg>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import { ref, watch, type Ref } from 'vue';
import type { AudioSource } from '@/audioSource';
import FreqSeries from './FreqSeries.vue';
import * as helper from '../helper';

const props = defineProps<{
  height: number;
  width: number;
  eqColour: string;
  lowColour: string;
  highColour: string;
  audioSource: AudioSource | null;
  audioContext: AudioContext;
  useEq: boolean;
  playing: boolean;
  eqNodes: BiquadFilterNode[];
  invert: boolean;
}>();

const emit = defineEmits<{
    (e: 'change', event: { gain: number, index: number }): void
}>();

const freqArray: Ref<number[]> = ref([]);

function refreshArray() {
    if (props.audioSource) {
        freqArray.value = props.audioSource.getFreqArray();

        // This is faster than trying to make vue update through refs every second.
        d3.select('#currentTime').text(props.audioSource.ended ? '--:--'
            : helper.secondsFormat((Date.now() - props.audioSource.getStartTime()) / 1000));
    }

    if (props.playing) {
        setTimeout(() => {
            refreshArray();
        }, 10);
    }
}

watch(() => props.playing, (newValue, oldvalue) => {
    if (newValue && !oldvalue) {
        refreshArray();
    }
});

watch(() => props.eqNodes, () => {
    if (freqArray.value) {
        // change each value in freq array so it is greater than
        // 0 so vue updates correctly
        freqArray.value.forEach((x, i, arr) => {
            if (x === 0) {
                arr[i] = 1;
            }
        });
    }
});
</script>
