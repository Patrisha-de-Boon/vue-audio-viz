<template>
    <div
        id="chooser"
        class="noselect"
    >
        <FileSelector
            :src="Add"
            @change="(e) => emit('filesChange', e)"
        />
    </div>
    <div
        id="play"
        class="noselect"
    >
        <button
            id="playButton"
            :disabled="!currentSource"
            @click="() => emit('playClick')"
        >
            <InlineSvg
                :src="playing ? Pause : PlayArrow"
                :alt="playing ? 'Pause' : 'Play'"
                :fill="currentSource ? 'white' : 'grey'"
            />
        </button>
    </div>
    <div
        id="resetEQ"
        class="noselect"
    >
        <button
            id="resetEQButton"
            :disabled="eqUnchanged || !currentSource"
            @click="() => emit('resetClick')"
        >
            <InlineSvg
                :src="GraphicEqualizerOff"
                alt="reset eq"
                :fill="eqUnchanged || !currentSource ? 'grey' : 'white'"
            />
        </button>
    </div>
    <div
        id="volume"
        class="noselect"
    >
        <VolumeSlider
            :width="((d3.select('#topPanel').node() as Element)?.getBoundingClientRect().width ?? 0) / 2"
            :height="(d3.select('#topPanel').node() as Element)?.getBoundingClientRect().height ?? 0"
            :current-width="volumeWidth"
            :fill="highColour"
            @change="(e) => emit('volumeChange', e)"
        />
    </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import PlayArrow from '@/assets/PlayArrow.svg';
import Add from '@/assets/Add.svg';
import GraphicEqualizerOff from '@/assets/GraphicEqualizerOff.svg';
import Pause from '@/assets/Pause.svg';
import InlineSvg from 'vue-inline-svg';
import VolumeSlider from './VolumeSlider.vue';
import FileSelector from './FileSelector.vue';
import type { AudioSource } from '../audioSource';

defineProps<{
  highColour: string;
  volumeWidth: number;
  currentSource: AudioSource | null;
  playing: boolean;
  eqUnchanged: boolean;
}>();

const emit = defineEmits<{
    (e: 'volumeChange', volume: number): void
    (e: 'resetClick'): void
    (e: 'playClick'): void
    (e: 'filesChange', files: FileList | null): void
}>();
</script>

<style>
#chooser,
#resetEQ,
#play {
  display: flex;
  height: 100%;
  vertical-align: top;
  float: left;
  clear: none;
}

#uploadButton,
#resetEQ,
#play {
  display: flex;
  justify-content: center;
  cursor: pointer;
}

#chooser label {
  align-self: center;
  padding: 0 10px;
  font-family: Lato;
  font-size: 20px;
  line-height: 19px;
  color: white;
  cursor: pointer;
}

#resetEQButton,
#playButton {
    font-size: 20px;
    font-family: Lato;
    background-color: transparent;
    padding: 0 10px;
    cursor: pointer;
    border: 0;
    color: white;
}

#chooser:hover,
#resetEQ:hover,
#play:hover {
  background-color: rgb(149, 101, 196) !important;
}

#chooser:active,
#resetEQ:active,
#play:active {
  background-color: rgb(109, 58, 171);
}

</style>
