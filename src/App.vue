<template>
    <header id="topPanel">
        <ControlPanel
            :current-source="currentSource"
            :high-colour="highColour"
            :playing="playing"
            :volume-width="volumeWidth"
            :eq-unchanged="eqUnchanged"
            @volume-change="onVolumeChange"
            @files-change="onFileChange"
            @play-click="onPlayClicked"
            @reset-click="onResetEqClicked"
        />
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
                :selected-file="currentFile"
                @change="onEqChange"
                @change-time="onTimeChange"
            />
        </div>
        <div
            id="metadata"
            class="noselect"
        >
            <MetaData
                :current-file="currentFile"
                :current-time="currentTime"
            />
        </div>
    </main>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import { ref, onMounted, type Ref } from 'vue';
import AudioVisualizer from './components/AudioVisualizer.vue';
import { AudioSource } from './audioSource';
import type { AudioFile } from './models/audioFile';
import PlayList from './components/PlayList.vue';
import MetaData from './components/MetaData.vue';
import ControlPanel from './components/ControlPanel.vue';

let parseAudioMetadata: ((file: any) => Promise<any>) | null = null;
const highColour = 'rgb(149,101,196)';
const lowColour = 'rgb(109,58,171)';
const eqColour = 'rgb(86,101,199)';
const vizHeight = ref(0);
const vizWidth = ref(0);
const volumeWidth = ref(1);
const currentTime = ref('--:--');
const audioContext: Ref<AudioContext | null> = ref(null);
const currentSource: Ref<AudioSource | null> = ref(null);
const currentStableSource: Ref<AudioSource | null> = ref(null);
const currentFile: Ref<AudioFile | null> = ref(null);
const playing = ref(false);
const eqUnchanged = ref(true);
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

function onTimeChange(time: string) {
    currentTime.value = time;
}

function onEqChange(event: {gain: number, index: number}) {
    if (event && (event.gain || event.gain === 0) && event.index >= 0 && eqNodes.value && eqNodes.value.length > event.index) {
        // eqNodes.value[event.index].gain.value = event.gain;
        const newNodes: BiquadFilterNode[] = [];
        eqNodes.value.forEach((eq, index) => {
            if (index === event.index) {
                eq.gain.value = event.gain;
            }
            newNodes.push(eq);
        });
        eqNodes.value = newNodes;
        if (eqUnchanged.value) {
            eqUnchanged.value = false;
        }
    }
}

function onVolumeChange(volume: number) {
    volumeWidth.value = (d3.select('#topPanel').node() as Element).getBoundingClientRect().width / 2 * volume ?? 0;
    if (currentSource.value) {
        currentSource.value.setVolume(volume);
    }
    if (currentStableSource.value) {
        currentStableSource.value.setVolume(volume);
    }
}

function onFileRemove(file: AudioFile) {
    removedFiles.value = [file];
}

function onPlayClicked() {
    if (playing.value === true) {
        if (currentSource.value) {
            currentSource.value.pause();
        }
        if (currentStableSource.value) {
            currentStableSource.value.pause();
        }
        playing.value = false;
    } else {
        let pauseTime = null;
        if (currentSource.value) {
            pauseTime = currentSource.value.pauseTime;
            currentSource.value.play();
            eqNodes.value = currentSource.value.eqNodes;
        }
        if (currentStableSource.value) {
            currentStableSource.value.play(pauseTime);
        }
        playing.value = true;
    }
}

function onFileSelect(file: AudioFile | null) {
    if (file == null) {
        if (currentSource.value && currentSource.value.isPlaying()) {
            currentSource.value.stop();
            currentStableSource.value?.stop();
            playing.value = false;
        }
    } else if (currentFile.value !== file) {
        const fr = new FileReader();
        fr.onload = function (e) {
            if (e && e.target && e.target.result && audioContext.value) {
                audioContext.value.decodeAudioData(e.target.result as ArrayBuffer, (buffer) => {
                    d3.selectAll('#time, #currentTime, #totalTime').style('display', 'inline');

                    if (currentSource.value) {
                        let numToEnd = currentSource.value.isPlaying() ? 1 : 0;
                        let numEnded = 0;
                        playing.value = false;
                        if (currentStableSource.value) {
                            currentStableSource.value.setBuffer(buffer);
                            if (currentStableSource.value.isPlaying()) {
                                numToEnd += 1;
                                currentStableSource.value.bufferSource.onended = function () {
                                    numEnded += 1;
                                    if (numEnded >= numToEnd) {
                                        onPlayClicked();
                                    }
                                };
                            }
                            currentStableSource.value.stop();
                        }

                        currentSource.value.setBuffer(buffer);
                        if (currentSource.value.isPlaying()) {
                            currentSource.value.bufferSource.onended = function () {
                                numEnded += 1;
                                if (numEnded >= numToEnd) {
                                    onPlayClicked();
                                }
                            };
                            currentSource.value.stop();
                        }
                    } else {
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

                        currentSource.value = audioSource;
                        currentStableSource.value = audioSource2;
                        eqNodes.value = audioSource.eqNodes;
                        playing.value = false;
                        onPlayClicked();
                    }
                    currentFile.value = file;
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
    eqUnchanged.value = true;
}
</script>

<style>
@import "./assets/base.css";

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

#volume {
    display: block;
    float: right;
    cursor: default !important;
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
  /* font-family: Lato; */
  font-size: 30px;
  color: white;
  display: grid;
  height: min-content;
  grid-template-columns: auto auto;
  font-size:x-large;
}
</style>
