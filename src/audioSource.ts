import * as d3 from 'd3';
import * as helper from './helper';

export function getShelfValues(audioContext: AudioContext) {
    const lowshelf = audioContext.createBiquadFilter();
    lowshelf.type = 'lowshelf'; // surprise!
    lowshelf.frequency.value = helper.lowShelfFreq;

    const highshelf = audioContext.createBiquadFilter();
    highshelf.type = 'highshelf';
    highshelf.frequency.value = helper.highShelfFreq;
    return {
        lowshelf,
        highshelf
    };
}

export class AudioSource {
    playing = false;
    ended = false;
    startTime = 0;
    pauseTime = 0;
    freqBins: number[];
    bufferSource: AudioBufferSourceNode;
    eqNodes: BiquadFilterNode[] = [];
    analyser: AnalyserNode;
    gainNode: GainNode;
    volume = 1;
    audioContext: AudioContext;
    buffer: AudioBuffer;
    onended: () => void;
    mute: boolean;

    public constructor(buffer: AudioBuffer, audioContext: AudioContext, onended: () => void, mute = false, volume = 1) {
        this.audioContext = audioContext;
        this.buffer = buffer;
        this.onended = onended;
        this.mute = mute;
        this.volume = volume;

        this.freqBins = helper.freqBins;

        this.bufferSource = this.audioContext.createBufferSource();
        this.analyser = this.audioContext.createAnalyser();
        this.gainNode = this.audioContext.createGain();

        this.setBufferSource(null, true);
    }

    setBufferSource(newBuffer: AudioBuffer | null = null, fromConstructor = false) {
        if (newBuffer) {
            this.buffer = newBuffer;
        }

        if (fromConstructor) {
            const shelfValues = getShelfValues(this.audioContext);
            this.gainNode.connect(shelfValues.lowshelf);

            this.eqNodes = [];
            this.eqNodes.push(shelfValues.lowshelf);
            this.gainNode.connect(shelfValues.lowshelf);

            let chainLink = shelfValues.lowshelf;
            for (let f = 0; f < helper.centerFreqs.length; f++) {
                const eq = this.audioContext.createBiquadFilter();
                eq.type = 'peaking';
                eq.frequency.value = helper.centerFreqs[f];
                eq.Q.value = helper.qFactors[f];
                this.eqNodes.push(eq);
                chainLink.connect(eq);
                chainLink = eq;
            }
            this.eqNodes.push(shelfValues.highshelf);
            chainLink.connect(shelfValues.highshelf);

            shelfValues.highshelf.connect(this.analyser);
            if (!this.mute) {
                this.analyser.connect(this.audioContext.destination);
            }
            this.analyser.fftSize = 8192;
            this.analyser.smoothingTimeConstant = 0;
            this.analyser.maxDecibels = -10;
        } else {
            this.bufferSource = this.audioContext.createBufferSource();
        }

        this.bufferSource.connect(this.gainNode);
        this.bufferSource.buffer = this.buffer;

        this.bufferSource.onended = (function (this: AudioSource) {
            this.end();
            this.onended();
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
        return this.volume;
    }

    setVolume(volume: number) {
        this.volume = volume;
        this.setGain(this.volume);
    }

    play() {
        if (!this.playing) {
            if (this.ended) {
                // can't call bufferSource.start more than once on the same buffer source.
                this.setBufferSource();
            }

            if (this.pauseTime) {
                this.bufferSource.start(0, this.pauseTime / 1000);
                this.startTime = Date.now() - this.pauseTime;
            } else {
                this.bufferSource.start(0);
                this.startTime = Date.now();
            }

            this.setGain(this.volume);
            this.pauseTime = 0;
            this.playing = true;
            this.ended = false;
        }
    }

    pause() {
        if (this.playing) {
            this.ended = true;
            this.playing = false;
            this.bufferSource.stop(0);
            this.pauseTime = Date.now() - this.startTime;
        }
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
            return freqArray;
        }

        return new Array(this.analyser.frequencyBinCount).fill(0);
    }

    stop() {
        if (this.playing) {
            this.playing = false;
            this.ended = true;
            this.bufferSource.stop(0);
            this.startTime = 0;
        }
        d3.select('#currentTime').text('--:--');
    }

    end() {
        this.playing = false;
        this.ended = true;
    }
}
