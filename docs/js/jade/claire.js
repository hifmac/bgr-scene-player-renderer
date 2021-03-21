/**
 * @file claire.js
 * @description Claire the artist
 * @author hifmac(E32456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import { Filesystem, makeError, printStack } from "../blanc/lisette.js";

/** @typedef {import('../blanc/lisette.js').Config} Config */

export class Player {
    /**
     * @param {Config} config 
     */
    constructor(config) {
        this.#config = config;
        this.#context = {};
    }

    /**
     * 
     * @param {string} channel channel name
     * @param {string} filename audio filename
     * @param {boolean} loop loop play
     */
    play(channel, filename, loop) {
        if (!(channel in this.#context) || this.#context[channel].filename !== filename) {
            this.stop(channel);

            this.#context[channel] = {
                filename,
                audio: document.createElement('audio')
            };
            this.#context[channel].audio.loop = loop;

            Filesystem.readFile(this.channelToPath(channel, filename)).then((data) => {
                const fr = new FileReader();
                fr.addEventListener('load', (event) => {
                    if (typeof event.target.result === 'string') {
                        this.#context[channel].audio.src = event.target.result;
                        this.#context[channel].audio.play();
                    }
                    else {
                        throw makeError(`Unknown data type: ${typeof event.target.result}`);
                    }
                });
                fr.readAsDataURL(new Blob([ data ], { type: 'audio/mp3' }));
            }).catch(printStack);
        }
    }

    stop(channel) {
        if (channel in this.#context && this.#context[channel].audio) {
            this.#context[channel].audio.pause();
        }
    }

    channelToPath(channel, filename) {
        if (channel.startsWith('bgm')) {
            return `${this.#config.data.audio.bgm}/${filename}`;
        }
        else if (channel.startsWith('voice') || channel.startsWith('bgv')) {
            return `${this.#config.data.audio.voice}/${filename}`;
        }
        else {
            throw makeError(`Invalid channel name: ${channel}`);
        }
    }

    /** @type {Config} */
    #config = null;

    /**
     * @type {Object.<string, {
     *     filename: string,
     *     audio: HTMLAudioElement,
     * }>}
     */
    #context = null;
}
