<template>
    <main class="fullscreen">
        <div id="topPanel">
            <div
                id="chooser"
                class="noselect"
            >
                <FileSelector
                    text="Choose a song"
                    @change="onFileChange"
                />
            </div>
            <div
                id="play"
                class="noselect"
            >
                <button
                    id="playButton"
                    :disabled="!currentSource"
                    @click="onPlayClicked"
                >
                    Play
                </button>
            </div>
            <div
                id="resetEQ"
                class="noselect"
            >
                <button
                    id="resetEQButton"
                    :disabled="!currentSource"
                    @click="onResetEqClicked"
                >
                    Reset EQ
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
                    @change="onVolumeChange"
                />
            </div>
        </div>

        <div id="vizContainer">
            <div id="visualizer">
                <AudioVisualizer
                    :width="vizWidth"
                    :height="vizHeight / 2"
                    :high-colour="highColour"
                    :low-colour="lowColour"
                    :eq-colour="eqColour"
                    :audio-context="(audioContext as AudioContext)"
                    :audio-source="currentSource"
                    :use-eq="true"
                    :invert="false"
                    :playing="playing"
                    :eq-nodes="eqNodes"
                    @change="onEqChange"
                />
            </div>
            <div id="visualizerInverted">
                <AudioVisualizer
                    :width="vizWidth"
                    :height="vizHeight / 2"
                    :high-colour="highColour"
                    :low-colour="lowColour"
                    :eq-colour="eqColour"
                    :audio-context="(audioContext as AudioContext)"
                    :audio-source="currentStaticSource"
                    :use-eq="false"
                    :invert="true"
                    :playing="playing"
                    :eq-nodes="[]"
                />
            </div>
        </div>
        <div
            id="metadata"
            class="noselect"
        >
            <div id="title" />
            <div id="artist" />
            <div id="album" />
            <div id="time">
                <div id="currentTime">
                    {{ !currentSource || currentSource.ended || !currentSource?.playing ? '--:--'
                        : helper.secondsFormat((Date.now() - currentSource.getStartTime()) / 1000) }}
                </div>
                /
                <div id="totalTime" />
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
// import * as musicMetadata from 'music-metadata-browser';
import { ref, onMounted, type Ref } from 'vue';
import FileSelector from './components/FileSelector.vue';
import AudioVisualizer from './components/AudioVisualizer.vue';
import { AudioSource } from './audioSource';
import * as helper from './helper';
import VolumeSlider from './components/VolumeSlider.vue';

const highColour = 'rgb(149,101,196)';
const lowColour = 'rgb(109,58,171)';
const eqColour = 'rgb(86,101,199)';
const vizHeight = ref(0);
const vizWidth = ref(0);
const volumeWidth = ref(1);
// const currentTime = ref('--:--');
const audioContext: Ref<AudioContext | null> = ref(null);
const currentSource: Ref<AudioSource | null> = ref(null);
const currentStaticSource: Ref<AudioSource | null> = ref(null);
const playing = ref(false);
const eqNodes: Ref<BiquadFilterNode[]> = ref([]);

onMounted(() => {
    vizHeight.value = (d3.select('#vizContainer').node() as HTMLElement)?.getBoundingClientRect().height;
    vizWidth.value = (d3.select('body').node() as HTMLElement)?.getBoundingClientRect().width;
    volumeWidth.value = (d3.select('#topPanel').node() as Element).getBoundingClientRect().width / 2 ?? 0;
});

(window as any).audioContext = (window as any).AudioContext || (window as any).webkitAudioContext
                        || (window as any).mozAudioContext || (window as any).msAudioContext;

let currentFile: File | null = null;

function onEqChange(event: {gain: number, index: number}) {
    if (event && (event.gain || event.gain === 0) && event.index >= 0 && eqNodes.value && eqNodes.value.length > event.index) {
        eqNodes.value[event.index].gain.value = event.gain;
    }
}

function onVolumeChange(volume: number) {
    volumeWidth.value = (d3.select('#topPanel').node() as Element).getBoundingClientRect().width / 2 * volume ?? 0;
    if (currentSource.value) {
        currentSource.value.setVolume(volume);
    }
}

function onPlayClicked() {
    if (currentSource.value) {
        currentSource.value.play();
        playing.value = true;
        // const visualizerRef = ref();
        // (visualizerRef.value as typeof AudioVisualizer)?.play(() => {
        //     d3.select('#currentTime').text((currentSource.value as AudioSource).ended ? '--:--'
        //         : secondsFormat((Date.now() - (currentSource.value as AudioSource).getStartTime()) / 1000));
        // });
    }

    if (currentStaticSource.value) {
        currentStaticSource.value.play();
    }
}

function onFileChange(files: FileList | null) {
    if (audioContext.value == null) {
        audioContext.value = new AudioContext();
    }

    if (files == null || files.length < 1) {
        if (currentSource.value !== undefined && currentSource.value !== null && currentSource.value.isPlaying()) {
            currentSource.value.bufferSource.onended = function () {
                currentSource.value?.end();
                currentStaticSource.value?.end();
            };
            currentSource.value.stop();
            currentStaticSource.value?.stop();
        }
    } else if (currentFile !== files[0]) {
        currentFile = files[0];

        const fr = new FileReader();
        fr.onload = function (e) {
            if (e && e.target && e.target.result && audioContext.value) {
                audioContext.value.decodeAudioData(e.target.result as ArrayBuffer, async (buffer) => {
                    // Get metadata and fill in the divs
                    // const metadata = await musicMetadata.parseBlob(currentFile as Blob);
                    // d3.select('#title').text(metadata.common.title ?? 'Unknown');
                    // d3.select('#artist').text(metadata.common.artist ?? 'Unknown');
                    // d3.select('#album').text(metadata.common.album ?? 'Unknown');

                    d3.selectAll('#time, #currentTime, #totalTime').style('display', 'inline');
                    d3.select('#totalTime').text(helper.secondsFormat(buffer.duration));

                    // const visualizerRef = ref<typeof AudioVisualizer>();
                    const audioSource = new AudioSource(buffer, audioContext.value as AudioContext, () => { playing.value = false; });
                    const audioSource2 = new AudioSource(buffer, audioContext.value as AudioContext, () => {}, true);
                    if (currentSource.value !== undefined && currentSource.value !== null && currentSource.value.isPlaying()) {
                        currentSource.value.bufferSource.onended = function () {
                            currentSource.value?.end();
                            currentSource.value = audioSource;

                            currentStaticSource.value?.end();
                            currentStaticSource.value = audioSource2;
                            onPlayClicked();
                        };
                        currentSource.value.stop();
                        currentStaticSource.value?.stop();
                    } else {
                        currentSource.value = audioSource;
                        currentStaticSource.value = audioSource2;
                        eqNodes.value = audioSource.eqNodes;
                        onPlayClicked();
                    }
                });
            }
        };

        fr.readAsArrayBuffer(currentFile);
    }
}

function onResetEqClicked() {
    const newNodes: BiquadFilterNode[] = [];
    eqNodes.value.forEach((eq) => {
        eq.gain.value = 0;
        newNodes.push(eq);
    });
    eqNodes.value = newNodes;
}
</script>

<style>
@import "./assets/base.css";

.fullscreen {
    height: 100%;
    widows: 100%;
}

#app {
  height: 100vh;
}

#topPanel {
  min-height: 40px;
  height: 5%;
  width: 100%;
}

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

#volume {
  display: inline-block;
  float: right;
  cursor: default !important;
}

#volume svg {
  cursor: pointer;
}

#volume svg text {
  dominant-baseline: middle;
  pointer-events: none;
  font-family: Lato;
  font-size: 20px;
  opacity: 0.2;
  fill: white;
}

#currentVolume {
  pointer-events: none;
}

#vizContainer {
  height: 95%;
  width: 100%;
}

#visualizer {
  position: absolute;
  top: 0;
  left: 0;
}

#visualizerInverted {
  position: absolute;
  bottom: 0;
  left: 0;
}

#visualizer svg,
#visualizerInverted svg {
  display: block;
  pointer-events: none;
}

#visualizer svg *,
#visualizerInverted svg * {
  pointer-events: all;
}

#metadata {
  pointer-events: none;
  cursor: default;
  position: fixed;
  bottom: 20px;
  right: 20px;
  text-align: right;
  font-family: Lato;
  font-size: 30px;
  color: white;
}

#time {
  display: none;
}
</style>
