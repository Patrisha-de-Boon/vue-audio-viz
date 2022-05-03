<template>
    <header>
        <div id="topPanel">
            <div
                id="chooser"
                class="noselect"
            >
                <FileSelector
                    id="chooser"
                    text="Choose a song"
                    @change="onFileChange"
                />
            </div>
            <div
                id="resetEQ"
                class="noselect"
            >
                <button
                    id="resetEQButton"
                    @click="onResetEqClicked"
                >
                    Reset EQ
                </button>
            </div>
            <div
                id="volume"
                class="noselect"
            />
        </div>
    </header>

    <main>
        <div id="visualizer">
            <AudioVisualizer
                :width="(d3.select('body').node() as HTMLElement)?.getBoundingClientRect().width"
                :height="(d3.select('body').node() as HTMLElement)?.getBoundingClientRect().height -
                    (d3.select('#topPanel').node() as HTMLElement)?.getBoundingClientRect().height"
                :high-colour="highColour"
                :low-colour="lowColour"
                :eq-colour="eqColour"
                :audio-context="audioContext"
                :audio-source="currentSource"
                :use-eq="true"
            />
        </div>
        <div
            id="metadata"
            class="noselect"
        >
            <div id="title" />
            <div id="artist" />
            <div id="album" />
            <div id="time">
                <div id="currentTime" />
                /
                <div id="totalTime" />
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
// import * as musicMetadata from 'music-metadata-browser';
import { ref } from 'vue';
import FileSelector from './components/FileSelector.vue';
import AudioVisualizer from './components/AudioVisualizer.vue';
import { AudioSource } from './audioSource';

const highColour = 'rgb(149,101,196)';
const lowColour = 'rgb(109,58,171)';
const eqColour = 'rgb(86,101,199)';

const audioContext: AudioContext = new AudioContext();
let currentSource: AudioSource | null = null;

let currentFile: File | null = null;

function secondsFormat(seconds: number) {
    return `${Math.floor(seconds / 60)}:${d3.format('02d')(Math.floor(seconds % 60))}`;
}

function onFileChange(files: FileList | null) {
    if (files == null || files.length < 1) {
        if (currentSource !== undefined && currentSource !== null && currentSource.isPlaying()) {
            currentSource.bufferSource.onended = function () {
                if (currentSource) {
                    currentSource.end();
                }
            };
            currentSource.stop();
        }
    } else if (currentFile !== files[0]) {
        currentFile = files[0];

        const fr = new FileReader();
        fr.onload = function (e) {
            if (e && e.target && e.target.result) {
                audioContext.decodeAudioData(e.target.result as ArrayBuffer, async (buffer) => {
                    // Get metadata and fill in the divs
                    // const metadata = await musicMetadata.parseBlob(currentFile as Blob);
                    // d3.select('#title').text(metadata.common.title ?? 'Unknown');
                    // d3.select('#artist').text(metadata.common.artist ?? 'Unknown');
                    // d3.select('#album').text(metadata.common.album ?? 'Unknown');

                    d3.selectAll('#time, #currentTime, #totalTime').style('display', 'inline');
                    d3.select('#totalTime').text(secondsFormat(buffer.duration));

                    const visualizerRef = ref<typeof AudioVisualizer>();
                    const audioSource = new AudioSource(buffer, audioContext);
                    if (currentSource !== undefined && currentSource !== null && currentSource.isPlaying()) {
                        currentSource.bufferSource.onended = function () {
                            if (currentSource) {
                                currentSource.end();
                            }
                            audioSource.play();
                            currentSource = audioSource;
                            (visualizerRef.value as typeof AudioVisualizer)?.play();
                        };
                        currentSource.stop();
                    } else {
                        audioSource.play();
                        currentSource = audioSource;
                        visualizerRef.value?.play();
                    }
                });
            }
        };

        fr.readAsArrayBuffer(currentFile);
    }
}

function onResetEqClicked() {
    if (currentSource) {
        const visualizerRef = ref<typeof AudioVisualizer>();
        (visualizerRef.value as typeof AudioVisualizer)?.resetEQ();
    }
}
</script>

<style>
@import "./assets/base.css";

#topPanel {
  position: absolute;
  top: 0;
  left: 0;
  min-height: 40px;
  height: 5%;
  width: 100%;
}

#chooser,
#resetEQ {
  display: flex;
  height: 100%;
  vertical-align: top;
  float: left;
  clear: none;
}

#uploadButton,
#resetEQ {
  display: flex;
  justify-content: center;
  cursor: pointer;
}

#chooser label,
#resetEQButton {
  align-self: center;
  padding: 0 10px;
  font-family: Lato;
  font-size: 20px;
  line-height: 19px;
  color: white;
  cursor: pointer;
}

#chooser:hover,
#resetEQ:hover {
  background-color: rgb(149, 101, 196);
}

#chooser:active,
#resetEQ:active {
  background-color: rgb(109, 58, 171);
}

#resetEQButton {
  border: none;
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

.volumeRight {
  text-anchor: end;
}

#currentVolume {
  pointer-events: none;
}

#visualizer {
  position: absolute;
  bottom: 0;
  left: 0;
}

#visualizer svg {
  display: block;
  pointer-events: none;
}

#visualizer svg * {
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
