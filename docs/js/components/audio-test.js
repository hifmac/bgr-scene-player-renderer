/**
 * @file audio-test.js
 * @description Audio Test view
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import { IPC, Filesystem, onTimeout, printStack } from '../blanc/lisette.js';
import Adelite from '../sandica/adelite.js';
import { Player as ClairePlayer } from '../jade/claire.js';


/**
 * @typedef {import('../blanc/lisette.js').Config} Config
 */

const template = {
    "div.bgm": {
    },
    "div.audio_test_voice_table": {
        "div.audio_test_voice_row": {
            "forEach:characterId": "{{ characters }}",
            "div.audio_test_voice_title": {
                "once:textContent": "{{ characterId }}",
            },
            "div.audio_test_voice_list": {
                "button": {
                    "forEach:voiceName": "{{ Object.keys(directory[characterId]['voice']) }}",
                    "if": "{{ directory[characterId]['voice'][voiceName] }}",
                    "on:click": "{{ playVoice(directory[characterId]['voice'][voiceName]) }}",
                    "bind:class": "{{ filestat(characterId, voiceName) }}",
                    "once:textContent": "{{ voiceName }}",
                }
            },
        }
    }
};

/**
 * @class Audio Test
 */
export default class AudioTest {
    /**
     * @constructor
     * @param {string} id 
     * @param {Object} config 
     */
    constructor(id, config) {
        this.#adelite = new Adelite(id, template);
        this.#config = config;
    }

    data(directory, config) {
        return {
            directory,
            characters: Object.keys(directory),
            player: new ClairePlayer(config),
            filestatResult: {},
            filestat(characterId, voiceName) {
                if (characterId in this.filestatResult) {
                    if (this.filestatResult[characterId][voiceName]) {
                        return 'audio_test_voice_button';
                    }
                }
                return 'audio_test_voice_button audio_test_voice_button_ng';
            },
            playVoice(filename) {
                console.log(filename);
                this.player.play('voice-test', filename, false);
            }
        };
    }

    show() {
        IPC.requestDirectory().then((directory) => {
            this.#data = this.data(directory, this.#config);
            this.#adelite.show(this.#data);

            const promises = [];
            for (const characterId in directory) { 
                for (const voiceName in directory[characterId]['voice']) {
                    const voiceFile = directory[characterId]['voice'][voiceName];
                    if (voiceFile) {
                        const filepath = `${this.#config.data.audio.voice}/${voiceFile}`;
                        promises.push(Filesystem.statFile(filepath).then(() => {
                            if (!(characterId in this.#data.filestatResult)) {
                                this.#data.filestatResult[characterId] = {};    
                            }
                            this.#data.filestatResult[characterId][voiceName] = true;
                        }).catch(printStack));
                    }
                }
            }
            Promise.all(promises).then(() => {
                this.#adelite.update();
            });
        });
    }

    destroy() {
        this.#adelite.destroy();
    }

    /** @type {Adelite} */
    #adelite = null;

    /** @type {Config} */
    #config = null;

    #data = null;
};
