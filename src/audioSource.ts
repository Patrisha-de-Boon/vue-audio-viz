import * as d3 from 'd3';
import * as constants from './constants';

export function getShelfValues(audioContext: AudioContext) {
    const lowshelf = audioContext.createBiquadFilter();
    lowshelf.type = 'lowshelf'; // surprise!
    lowshelf.frequency.value = constants.lowShelfFreq;

    const highshelf = audioContext.createBiquadFilter();
    highshelf.type = 'highshelf';
    highshelf.frequency.value = constants.highShelfFreq;
    return {
        lowshelf,
        highshelf
    };
}

export class AudioSource {
    playing = false;
    startTime: number;
    freqBins: number[];
    bufferSource: AudioBufferSourceNode;
    analyser: AnalyserNode;
    gainNode: GainNode;
    globalVolume = 100;

    public constructor(buffer: AudioBuffer, audioContext: AudioContext) {
        this.startTime = Date.now();

        this.freqBins = constants.freqBins;
        this.bufferSource = audioContext.createBufferSource();
        this.analyser = audioContext.createAnalyser();
        this.gainNode = audioContext.createGain();
        this.bufferSource.connect(this.gainNode);

        const shelfValues = getShelfValues(audioContext);
        this.gainNode.connect(shelfValues.lowshelf);

        shelfValues.highshelf.connect(this.analyser);
        this.analyser.connect(audioContext.destination);
        this.analyser.fftSize = 8192;
        this.analyser.smoothingTimeConstant = 0;
        this.analyser.maxDecibels = -10;
        this.bufferSource.buffer = buffer;

        this.bufferSource.onended = (function (this: AudioSource) {
            this.end();
        }).bind(this);
    }

    isPlaying() {
        return this.playing;
    }

    getDuration() {
        if (this.bufferSource.buffer) {
            return this.bufferSource.buffer.duration;
        }

        return 0;
    }

    getStartTime() {
        return this.startTime;
    }

    setGain(gain: number) {
        this.gainNode.gain.value = Math.min(Math.max(0, gain), 1);
    }

    getVolume() {
        return this.globalVolume;
    }

    setVolume(volume: number) {
        this.globalVolume = volume;
    }

    play() {
        this.setGain(this.globalVolume);
        this.bufferSource.start(0);
        this.startTime = Date.now();
        this.playing = true;
        this.getFreqArray();
    }

    getFreqArray(): number[] {
        if (this.playing) {
            const rawArray = new Uint8Array(this.analyser.frequencyBinCount);

            const freqArray = [];
            this.analyser.getByteFrequencyData(rawArray);
            for (let i = 1; i < this.freqBins.length; i++) {
                const values = [];
                for (let j = this.freqBins[i - 1]; j <= this.freqBins[i]; j++) {
                    values.push(rawArray[j]);
                }

                freqArray.push(Math.floor(d3.mean(values) ?? 0));
            }

            // draw(freqArray);
            // setTimeout(() => {
            //     this.getFreqArray();
            // }, 10);
            return freqArray;
        }

        return new Array(this.analyser.frequencyBinCount).fill(0);
    }

    stop() {
        this.bufferSource.stop(0);
        // d3.select('#currentTime').text('--:--');
    }

    end() {
        this.playing = false;
        // const arr = new Uint8Array(this.analyser.frequencyBinCount);
        // draw(arr, true);
    }
}
