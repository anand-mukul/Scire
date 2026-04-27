/**
 * AudioWorklet Processor for real-time audio recording.
 * Resamples input audio to 16kHz and emits fixed-size chunks (2048 samples).
 *
 * Loaded by AudioManager via audioContext.audioWorklet.addModule('/recorder-processor.js')
 */
class RecorderProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._remainder = 0;
        this.BUFFER_SIZE = 2048;
        this._buffer = new Float32Array(2048);
        this._bufferIdx = 0;
        this.targetSampleRate = 16000;
        console.log("RecorderProcessor: Initialized. Context SampleRate:", sampleRate);
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input && input.length > 0) {
            const inputChannel = input[0];
            const currentRate = sampleRate;
            const ratio = currentRate / this.targetSampleRate;

            let inputIndex = this._remainder;

            while (inputIndex < inputChannel.length) {
                this._buffer[this._bufferIdx++] = inputChannel[Math.floor(inputIndex)];

                if (this._bufferIdx >= this.BUFFER_SIZE) {
                    this.port.postMessage(this._buffer.slice());
                    this._bufferIdx = 0;
                }

                inputIndex += ratio;
            }

            this._remainder = inputIndex - inputChannel.length;
        }
        return true;
    }
}

registerProcessor('recorder-processor', RecorderProcessor);
