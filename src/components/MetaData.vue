<template>
    <div id="textdata">
        <div id="title">
            {{ currentFile?.title ?? '' }}
        </div>
        <div id="album-artist">
            {{ (currentFile?.album ?? '') + (currentFile?.artist && currentFile?.album ? ' - ' : '') + (currentFile?.artist ?? '') }}
        </div>
        <div id="time">
            <div id="currentTime">
                {{ currentTime }}
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
</template>

<script setup lang="ts">
import type { AudioFile } from '@/models/audioFile';
import * as helper from '../helper';
import { squareDirective as vSquareDirective } from '../helper';

defineProps<{
  currentFile: AudioFile | null;
  currentTime: string;
}>();
</script>

<style scoped>#pictureFrame {
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
