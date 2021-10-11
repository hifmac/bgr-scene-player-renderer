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
                "button.audio_test_voice_button": {
                    "forEach:voiceName": "{{ Object.keys(directory[characterId]['voice']) }}",
                    "if": "{{ directory[characterId]['voice'][voiceName] }}",
                    "on:click": "{{ playVoice(directory[characterId]['voice'][voiceName]) }}",
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
            onTimeout(0).then(() => { this.convertFileName(); });
        });
    }

    destroy() {
        this.#adelite.destroy();
    }

    convertFileName() {
        for (const characterId of Object.keys(this.#data.directory)) {
            const voiceDir = `${this.#config.data.audio.voice}/${characterId}`;
            const voiceList = this.#data.directory[characterId].voice;
            Filesystem.readDirectory(voiceDir).then((filenames) => {
                const filenameQueue = Array.from(filenames).sort().filter((x) => {
                    return x !== 'h01'
                        && x !== 'h02';
                });

                if (filenameQueue.indexOf('結婚後入り') !== -1) {
                    const srcdir = `${voiceDir}/結婚後入り`;
                    Filesystem.readDirectory(srcdir).then((filenames) => {
                        const filenameQueue2 = Array.from(filenames).sort();
                        Filesystem.mkdir(`${voiceDir}/backup`);
                        for (const filename of filenameQueue) { 
                            if (filename.startsWith('audio_')) {
                                Filesystem.rename(`${voiceDir}/${filename}`, `${voiceDir}/backup/${filename}`);
                            }
                            else {
                                console.warn(`${filename} is ignored.`);
                            }
                        }

                        for (const voiceName of Object.keys(voiceList)) {
                            const voiceFile = voiceList[voiceName];
                            if (voiceFile) {
                                if (filenameQueue2.length && filenameQueue2[0].startsWith('audio_')) {
                                    Filesystem.copy(`${srcdir}/${filenameQueue2.shift()}`, `${this.#config.data.audio.voice}/${voiceFile}`);
                                }
                                else {
                                    console.warn(`no target for ${voiceFile}`);
                                }
                            }
                        }
                    });
                    return ;
                }

    
                for (const voiceName of Object.keys(voiceList)) {
                    const voiceFile = voiceList[voiceName];
                    if (voiceFile) {
                        if (filenameQueue.length && filenameQueue[0].startsWith('audio_')) {
                            Filesystem.rename(`${voiceDir}/${filenameQueue.shift()}`, `${this.#config.data.audio.voice}/${voiceFile}`);
                        }
                        else {
                            console.warn(`no target for ${voiceFile}`);
                        }
                    }
                }
            });
        }
    }

    /** @type {Adelite} */
    #adelite = null;

    /** @type {Config} */
    #config = null;

    #data = null;
};
