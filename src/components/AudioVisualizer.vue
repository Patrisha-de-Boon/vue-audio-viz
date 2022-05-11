<template>
    <svg
        :width="width ?? 0"
        :height="height ?? 0"
    >
        <FreqSeries
            :freq-array="freqArray"
            :stable-freq-array="stableFreqArray"
            :width="width ?? 0"
            :height="height ?? 0"
            :high-colour="highColour"
            :low-colour="lowColour"
            :eq-colour="eqColour"
            :audio-context="audioContext"
            :eq-nodes="eqNodes"
            :invert="invert"
            @change="(event) => emit('change', event)"
        />
    </svg>
</template>

<script setup lang="ts">
import { ref, watch, type Ref } from 'vue';
import type { AudioSource } from '@/audioSource';
import FreqSeries from './FreqSeries.vue';
import * as helper from '../util/helper';
import type { AudioFile } from '@/models/audioFile';

const props = defineProps<{
  height: number;
  width: number;
  eqColour: string;
  lowColour: string;
  highColour: string;
  audioContext: AudioContext;
  audioSource: AudioSource | null;
  audioStableSource: AudioSource | null;
  playing: boolean;
  selectedFile: AudioFile | null;
  eqNodes: BiquadFilterNode[];
  invert: boolean;
}>();

const emit = defineEmits<{
    (e: 'change', event: { gain: number, index: number }): void
    (e: 'changeTime', time: string): void
}>();

const freqArray: Ref<number[]> = ref([]);
const stableFreqArray: Ref<number[]> = ref([]);
let lastTime = '--:--';

function refreshArray() {
    if (props.audioSource && (props.audioSource.playing || !props.audioSource.pauseTime)) {
        freqArray.value = props.audioSource.getFreqArray();

        const seconds = helper.secondsFormat((Date.now() - props.audioSource.getStartTime()) / 1000);
        if (lastTime !== seconds) {
            lastTime = seconds;
            emit('changeTime', seconds);
        }
    }

    if (props.audioStableSource && (props.audioStableSource.playing || !props.audioStableSource.pauseTime)) {
        stableFreqArray.value = props.audioStableSource.getFreqArray();
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

watch(() => props.selectedFile, () => {
    refreshArray();
});
</script>
