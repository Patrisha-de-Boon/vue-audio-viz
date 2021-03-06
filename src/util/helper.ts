import * as d3 from 'd3';
import type { DirectiveBinding, ObjectDirective } from 'vue';

export const centerFreqs = [53.8, 64.6, 75.4, 88.8, 102.3, 118.4, 140, 164.2, 191.1, 223.4, 261.1,
    306.8, 360.7, 419.9, 492.6, 576, 672.9, 788.7, 923.2, 1079.4, 1262.4, 1477.7,
    1728, 2021.4, 2366, 2769.7, 3240.7, 3792.5, 4438.5, 5192.2, 6077.7, 7114,
    8322.6, 9738.4, 11396.4, 13337.1, 15608.9, 18265.5, 21374.4];

export const qFactors = [5, 6, 7, 5.5, 9.5, 5.5, 6.5, 6.1, 7.1, 5.9, 6.9, 5.7, 6.7, 6.5,
    6.1, 6.7, 6.3, 6.4, 6.4, 6.5, 6.3, 6.4, 6.4, 6.4, 6.4, 6.4, 6.4,
    6.3, 6.4, 6.4, 6.3, 6.4, 6.4, 6.4, 6.4, 6.4, 6.4, 6.4, 6.4];

export const freqBins = [8, 10, 12, 14, 17, 19, 23, 27, 32, 37, 44, 51, 61, 71, 83, 98, 114,
    134, 157, 184, 215, 252, 295, 345, 404, 473, 554, 648, 759, 888,
    1039, 1217, 1424, 1666, 1950, 2282, 2671, 3126, 3658, 4095];

export const lowShelfFreq = 48.5;

export const highShelfFreq = 23051.3;

export function secondsFormat(seconds: number) {
    return `${Math.floor(seconds / 60)}:${d3.format('02d')(Math.floor(seconds % 60))}`;
}

export const squareDirective: ObjectDirective = {
    updated(el, binding: DirectiveBinding) {
        if (binding.value === 'height') {
            el.style.width = `${el.parentElement.offsetHeight}px`;
        } else if (el.style.height) {
            el.style.height = `${el.parentElement.offsetWidth}px`;
        }
    }
};
