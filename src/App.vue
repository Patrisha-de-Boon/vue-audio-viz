<template>
    <header id="topPanel">
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
                {{ playing ? "Pause" : "Play" }}
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
    </header>

    <main
        id="bottomPanel"
    >
        <div
            id="playlist"
            class="noselect"
        >
            <PlayList
                :files="audioFiles"
                :removed-files="removedFiles"
                :selected="currentFile"
                :selected-color="highColour"
                @select="onFileSelect"
                @remove="onFileRemove"
            />
        </div>

        <div
            id="visContainer"
        >
            <AudioVisualizer
                id="visualizer"
                :width="vizWidth"
                :height="vizHeight"
                :high-colour="highColour"
                :low-colour="lowColour"
                :eq-colour="eqColour"
                :audio-context="(audioContext as AudioContext)"
                :audio-source="currentSource"
                :audio-stable-source="currentStableSource"
                :invert="true"
                :playing="playing"
                :eq-nodes="eqNodes"
                @change="onEqChange"
            />
        </div>
        <div
            id="metadata"
            class="noselect"
        >
            <div id="textdata">
                <div id="title">
                    {{ currentFile?.title ?? '' }}
                </div>
                <div id="artist">
                    {{ currentFile?.artist ?? '' }}
                </div>
                <div id="album">
                    {{ currentFile?.album ?? '' }}
                </div>
                <div id="time">
                    <div id="currentTime">
                        --:--
                    </div>
                    /
                    <div id="totalTime">
                        {{ currentFile?.duration ? helper.secondsFormat(currentFile.duration) : '' }}
                    </div>
                </div>
            </div>
            <div
                id="pictureFrame"
                v-square-directive="'height'"
            >
                <img
                    v-if="currentFile?.picture"
                    id="picture"
                    :src="currentFile?.picture"
                    alt=""
                >
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import { ref, onMounted, type Ref } from 'vue';
import FileSelector from './components/FileSelector.vue';
import AudioVisualizer from './components/AudioVisualizer.vue';
import { AudioSource } from './audioSource';
import * as helper from './helper';
import VolumeSlider from './components/VolumeSlider.vue';
import type { AudioFile } from './models/audioFile';
import PlayList from './components/PlayList.vue';
import { squareDirective as vSquareDirective } from './helper';

let parseAudioMetadata: ((file: any) => Promise<any>) | null = null;
const highColour = 'rgb(149,101,196)';
const lowColour = 'rgb(109,58,171)';
const eqColour = 'rgb(86,101,199)';
const vizHeight = ref(0);
const vizWidth = ref(0);
const volumeWidth = ref(1);
const audioContext: Ref<AudioContext | null> = ref(null);
const currentSource: Ref<AudioSource | null> = ref(null);
const currentStableSource: Ref<AudioSource | null> = ref(null);
const currentFile: Ref<AudioFile | null> = ref(null);
const playing = ref(false);
const eqNodes: Ref<BiquadFilterNode[]> = ref([]);
const audioFiles: Ref<AudioFile[]> = ref([]);
const removedFiles: Ref<AudioFile[]> = ref([]);

onMounted(async () => {
    vizHeight.value = (d3.select('#visualizer').node() as HTMLElement)?.getBoundingClientRect().height;
    vizWidth.value = (d3.select('#visualizer').node() as HTMLElement)?.getBoundingClientRect().width;
    volumeWidth.value = (d3.select('#topPanel').node() as Element).getBoundingClientRect().width / 2 ?? 0;
    // @ts-ignore: This module doesn't have type declarations so it is implicitly 'any'
    const { default: parseFunction } = await import('parse-audio-metadata');
    parseAudioMetadata = parseFunction;
});

(window as any).audioContext = (window as any).AudioContext || (window as any).webkitAudioContext
                        || (window as any).mozAudioContext || (window as any).msAudioContext;

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

function onFileRemove(file: AudioFile) {
    removedFiles.value = [file];
}

function onPlayClicked() {
    if (currentSource.value) {
        if (playing.value === true) {
            currentSource.value.pause();
            playing.value = false;
        } else {
            currentSource.value.play();
            playing.value = true;
            eqNodes.value = currentSource.value.eqNodes;
        }
    }

    if (currentStableSource.value) {
        currentStableSource.value.play();
    }
}

function onFileSelect(file: AudioFile | null) {
    if (file == null) {
        if (currentSource.value !== undefined && currentSource.value !== null && currentSource.value.isPlaying()) {
            currentSource.value.bufferSource.onended = function () {
                currentSource.value?.end();
                currentStableSource.value?.end();
            };
            currentSource.value.stop();
            currentStableSource.value?.stop();
        }
    } else if (currentFile.value !== file) {
        currentFile.value = file;

        const fr = new FileReader();
        fr.onload = function (e) {
            if (e && e.target && e.target.result && audioContext.value) {
                audioContext.value.decodeAudioData(e.target.result as ArrayBuffer, (buffer) => {
                    d3.selectAll('#time, #currentTime, #totalTime').style('display', 'inline');

                    const audioSource = new AudioSource(buffer, audioContext.value as AudioContext, () => {
                        if (audioSource.pauseTime === 0) {
                            playing.value = false;
                            const i = audioFiles.value.findIndex(x => x === currentFile.value);
                            if (i >= 0 && i < audioFiles.value.length - 1) {
                                onFileSelect(audioFiles.value[i + 1]);
                            }
                        }
                    });
                    const audioSource2 = new AudioSource(buffer, audioContext.value as AudioContext, () => {}, true);
                    if (currentSource.value !== undefined && currentSource.value !== null && currentSource.value.isPlaying()) {
                        currentSource.value.bufferSource.onended = function () {
                            currentSource.value?.end();
                            currentSource.value = audioSource;

                            currentStableSource.value?.end();
                            currentStableSource.value = audioSource2;
                            playing.value = false;
                            onPlayClicked();
                        };
                        currentSource.value.stop();
                        currentStableSource.value?.stop();
                    } else {
                        currentSource.value = audioSource;
                        currentStableSource.value = audioSource2;
                        eqNodes.value = audioSource.eqNodes;
                        playing.value = false;
                        onPlayClicked();
                    }
                });
            }
        };

        fr.readAsArrayBuffer(file);
    }
}

function onFileChange(files: FileList | null) {
    if (audioContext.value == null) {
        audioContext.value = new AudioContext();
    }

    if (files && files.length > 0 && files[0]) {
        [...files].forEach((file) => {
            if (file) {
                const urlFr = new FileReader();
                urlFr.onload = async function (e) {
                    if (e && e.target && e.target.result && parseAudioMetadata) {
                        const metadata = await parseAudioMetadata(file);
                        const audioFile = file as AudioFile;
                        audioFile.title = metadata.title;
                        audioFile.album = metadata.album;
                        audioFile.artist = metadata.artist;
                        audioFile.duration = metadata.duration;
                        audioFile.picture = metadata.picture ? URL.createObjectURL(metadata.picture) : undefined;
                        audioFile.key = `${audioFile?.title}-${audioFile?.album}-${audioFile?.artist}`;
                        const existing = audioFiles.value.findIndex(x => x.title === audioFile.title && x.album === audioFile.album && x.artist === audioFile.artist);
                        if (!(existing >= 0)) {
                            audioFiles.value.push(audioFile);
                        } else if (audioFiles.value[existing] !== currentFile.value) {
                            // con't update current file without rebuilding audio source.
                            // user should remove duplicate first before uploading.
                            audioFiles.value[existing] = audioFile;
                        }
                    }
                };
                urlFr.readAsDataURL(file);
            }
        });
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
  display: flex;
  flex-flow:column;
}

#topPanel {
  min-height: 40px;
  height: 5%;
  width: 100%;
}

#bottomPanel {
    flex: auto;
    display: flex;
    flex-flow: row;
}

#playlist {
    height: 100%;
    min-width: 2in;
    max-width: 4in;
    width: 25%;
    background-color: black;
}

#visContainer {
    flex: auto;
}

#visualizer {
    height: 100%;
    width: 100%;
    position: absolute;
    bottom: 0;
    left: 0;
}

#visContainer svg{
  display: block;
  pointer-events: none;
}

#visContainer svg * {
  pointer-events: all;
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

.flexColumn {
    flex-direction: column;
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
  display: grid;
  height: min-content;
  grid-template-columns: auto auto;
}

#pictureFrame {
    height: 100%;
}

#picture {
    position: absolute;
    vertical-align: middle;
    max-width: 100%;
    max-height: 100%;
    bottom: 0;
    left: 0;
}

#textdata{
    padding-right: 20px;
}

#time {
  display: none;
}
</style>
