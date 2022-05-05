<template>
    <svg
        id="slider"
        :width="width"
        :height="height"
    >
        <rect
            id="volumeClick"
            :x="0"
            :y="0"
            fill="black"
            :width="width"
            :height="height"
            @mousemove="mouseMove"
            @mousedown="mouseDown"
        />
        <rect
            id="currentVolume"
            :x="0"
            :y="0"
            :fill="fill"
            :width="currentWidth"
            :height="height"
        />
    </svg>
    <div
        id="volumeIcons"
        class="noselect"
    >
        <div
            id="volumeDown"
            class="iconContainer noselect"
        >
            <InlineSvg
                :src="VolumeDown"
                class="noselect"
                alt="reset eq"
                :width="36"
                :height="36"
                viewBox="0 0 48 48"
                fill="white"
            />
        </div>
        <div
            id="volumeUp"
            class="iconContainer noselect"
        >
            <InlineSvg
                :src="VolumeUp"
                class="noselect"
                alt="reset eq"
                :width="36"
                :height="36"
                viewBox="0 0 48 48"
                fill="white"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import VolumeDown from '@/assets/VolumeDown.svg';
import VolumeUp from '@/assets/VolumeUp.svg';
import InlineSvg from 'vue-inline-svg';

const emit = defineEmits<{
    (e: 'change', volume: number): void
}>();

defineProps<{
  height: number;
  width: number;
  currentWidth: number;
  fill: string;
}>();

function setVolume(e: MouseEvent) {
    if (e.target) {
        const newWidth = e.pageX - ((d3.select('#volumeClick').node() as Element)?.getBoundingClientRect().left ?? 0);
        emit('change', newWidth / (e.target as Element).getBoundingClientRect().width);
    }
}

function mouseDown(e: MouseEvent) {
    setVolume(e);
}

function mouseMove(e: MouseEvent) {
    if (e.buttons === 1) {
        setVolume(e);
    }
}
</script>

<style scoped>
svg {
  cursor: pointer;
}

#currentVolume {
  pointer-events: none;
}

#slider {
    display: block;
}

#volumeIcons {
    position: absolute !important;
    width: 100%;
    height: 100%;
    top: 0;
    right: 0;
    pointer-events: none;
}

#volumeDown {
    left: 20px;
}

#volumeUp {
    right: 20px;
}

.iconContainer {
    position: absolute;
    height: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
}

#volumeIcons svg {
    position: relative;
    display: block;
    margin: auto;
}
</style>
