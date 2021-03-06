<template>
    <draggable
        :list="modelFiles"
        item-key="key"
    >
        <template #item="{ element }">
            <div
                :style="{'background-color': selected === element ? selectedColor : 'transparent'}"
                class="itemContainer"
                @click="emit('select', element)"
                @keydown="emit('select', element)"
            >
                <div class="item">
                    <div class="flexRow">
                        <div class="title">
                            {{ element?.title }}
                        </div>
                        <div
                            class="delete"
                            @click="emit('remove', element)"
                            @keydown="emit('remove', element)"
                            @click.stop
                        >
                            <InlineSvg
                                :src="Close"
                                alt="close"
                                fill="red"
                                :height="24"
                                :width="24"
                                viewBox="0 0 48 48"
                            />
                        </div>
                    </div>
                    <div class="flexRow">
                        <div class="info">
                            {{ element?.album + " - " + element?.artist }}
                        </div>
                        <div class="duration">
                            {{ element?.duration ? helper.secondsFormat(element?.duration) : '--:--' }}
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </draggable>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable';
import { ref, watch, type Ref, type WatchOptions } from 'vue';
import Close from '@/assets/Close.svg';
import InlineSvg from 'vue-inline-svg';
import type { AudioFile } from '@/models/audioFile';
import * as helper from '../util/helper';

const props = defineProps<{
    files: AudioFile[],
    removedFiles: AudioFile[],
    selected: AudioFile | null,
    selectedColor: string,
}>();

const modelFiles: Ref<AudioFile[]> = ref([]);

const emit = defineEmits<{
    (e: 'select', file: AudioFile): void
    (e: 'remove', file: AudioFile): void
}>();

watch(() => props.files, () => {
    props.files.forEach((x) => {
        const i = modelFiles.value.findIndex(y => x === y || x.key === y.key);
        if (i >= 0 && modelFiles.value[i] !== x) {
            modelFiles.value[i] = x;
        } else if (!(i >= 0)) {
            modelFiles.value.push(x);
        }
    });
}, { deep: true } as WatchOptions);

watch(() => props.removedFiles, () => {
    props.removedFiles.forEach((x) => {
        const i = modelFiles.value.findIndex(y => x === y);
        if (i >= 0) {
            modelFiles.value.splice(i, 1);
        }
    });
}, { deep: true } as WatchOptions);
</script>

<style scoped>
.item {
    padding: 10px;
}
.itemContainer:hover {
    background-color: gray !important;
}

.title {
    font-weight: bold;
    flex: auto;
}

.flexRow {
    display: flex;
    flex-direction: row;
}

.info {
    font-weight: lighter;
    flex: auto;
}

.duration {
    font-weight: lighter;
}

.header {
    cursor: pointer;
    margin: 15px;
}

.delete {
    visibility: hidden;
    cursor: pointer;
    color: red;
}

.item:hover .delete {
    visibility: visible;
}
</style>
