/**
 * @file check.js
 * @description File check view
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import {
    IPC,
    Filesystem,
    mergeObject,
    printStack
} from '../blanc/lisette.js';
import Adelite from '../sandica/adelite.js';

const template = {
    "div.check-summary m-q2 p-q2": {
        "div.check-progress": {
            "bind:textContent": "{{getProgress()}}, OK:{{okList.size}} files, NG:{{ngList.size}} files"
        },
        "div.check-summary-text": {
            "bind:textContent": "NG summary - ボイス:{{voices.length}} BGM:{{bgms.length}}, キャラ:{{characters.length}}, 背景/CG:{{dialogs.length}}"
        },
        "div.check-result-type": {
            "button.voice-result-button check-result-button": {
                "once:textContent": "ボイス",
                "on:click": "{{ setTable(voices) }}"
            },
            "button.bgm-result-button check-result-button": {
                "once:textContent": "BGM",
                "on:click": "{{ setTable(bgms) }}"
            },
            "button.character-result-button check-result-button": {
                "once:textContent": "キャラ",
                "on:click": "{{ setTable(characters) }}"
            },
            "button.dialog-result-button check-result-button": {
                "once:textContent": "背景",
                "on:click": "{{ setTable(dialogs) }}"
            }
        }
    },
    "table.check-table m-q2": {
        "tbody": {
            "tr.check-table-row": {
                "forEach:entry": "{{ files.entries() }}",
                "td": {
                    "forEach:e": "{{ entry }}",
                    "bind:textContent": "{{ e }}"
                }
            }
        }
    }
};

/**
 * @class File check view class
 */
export default class Check {
    /**
     * @constructor
     * @param {string} id 
     * @param {Object} config 
     */
    constructor(id, config) {
        this.#adelite = new Adelite(id, template);

        this.#okList = new Set;
        this.#ngList = new Set;
        this.#checked = new Set;
        this.#files = [];
        this.config = config;
    }

    getProgress() {
        return (1000 * this.#progress / this.#nItems | 0) / 10 + '%'
    };

    show() {
        this.#adelite.show(this);

        Promise.all(Array.from(this.config.json.character, (x) => Filesystem.readJsonFile(x)))
        .then((jsons) => { 
            this.characterData = mergeObject(jsons);
            return IPC.requestDialog();
        })
        .then((all_dialog) => {
            this.#keys = Object.keys(all_dialog);
            this.#nItems = this.#keys.length;
            this.splitDialogProcess(all_dialog);
        })
        .catch(printStack);
    };

    destroy() {
        this.#adelite.destroy();
        this.#okList = new Set;
        this.#ngList = new Set;
        this.#checked = new Set;
        this.#files = [];
    };

    splitDialogProcess(all_dialog) {
        this.processDialog(all_dialog);
        if (this.#progress < this.#nItems) {
            setTimeout(() => this.splitDialogProcess(all_dialog), 0);
        }
    };

    async statFile(filename) {
        try {
            await Filesystem.statFile(filename);
        }
        catch (e) {
            try {
                await Filesystem.statFile(filename + '.txt');
            }
            catch (e) {
                return [ null, filename ];
            }
        }
        return [ filename, null ];
    };

    setTable(table) {
        this.#files = table;
        this.#adelite.update();
    };

    async checkCharacter(char_id) {
        if (char_id in this.characterData) {
            const filename = this.config.data.texture.character + '/' + this.characterData[char_id].texture;
            if (!this.#checked.has(filename)) {
                this.#checked.add(filename);
                return await this.statFile(filename);
            }
            else {
                return [ null, null ];
            }
        }
        else {
            return [ null, this.config.data.texture.character + '/character' + char_id ];
        }
    };

    processDialog(all_dialog) {
        /**
         * batch process size to render
         */
        const batchSize = this.#nItems >> 7;

        const promises = [];
        for (let n = 0; n < batchSize && this.#progress < this.#nItems; ++n, ++this.#progress) {
            const dialog = all_dialog[this.#keys[this.#progress]];

            if ('bg_pic' in dialog) {
                const filename = this.config.data.texture.dialog + '/' + dialog.bg_pic;
                if (!this.#checked.has(filename)) {
                    this.#checked.add(filename);
                    promises.push(this.statFile(filename));
                }
            }

            if ('char_id' in dialog) {
                promises.push(this.checkCharacter(dialog.char_id));
            }

            if ('bgm' in dialog) {
                const filename = this.config.data.audio.bgm + '/' + dialog.bgm;
                if (!this.#checked.has(filename)) {
                    this.#checked.add(filename);
                    promises.push(this.statFile(filename));
                }
            }

            if ('voice' in dialog) {
                const filename = this.config.data.audio.voice + '/' + dialog.voice;
                if (!this.#checked.has(filename)) {
                    this.#checked.add(filename);
                    promises.push(this.statFile(filename));
                }
            }
        }

        Promise.all(promises).then((values) => {
            for (const value of values) {
                if (value[0]) {
                    this.#okList.add(value[0]);
                }

                if (value[1]) {
                    const file = value[1];
                    const ignore = [
                        'dialog/5.青空',
                        'dialog/dialog',
                        'dialog1/dialog1',
                        '1/h1',
                        '1/h2',
                        'bgm/NONE',
                        'bgm/None',
                        'bgm/※BGM変更なし',
                        'character/character0',
                        'character/character1'
                    ].reduce((prev, curr) => {
                        return prev || (file.indexOf(curr) !== -1)
                    }, false);

                    if (!ignore && !this.#ngList.has(file)) {
                        this.#ngList.add(file);

                        if (file.startsWith(this.config.data.audio.voice)) {
                            this.#voices.push(file);
                        }
                        else if (file.startsWith(this.config.data.texture.character)) {
                            this.#characters.push(file);
                        }
                        else if (file.startsWith(this.config.data.texture.dialog)) {
                            this.#dialogs.push(file);
                        }
                        else if (file.startsWith(this.config.data.audio.bgm)) {
                            this.#bgms.push(file);
                        }
                        else {
                            console.error('不明なデータ');
                        }
                    }
                }
            }
        
            if (this.#progress == this.#nItems) {
                this.#files = Array.from(this.#ngList).sort();
                this.#voices = this.#voices.sort();
                this.#characters = this.#characters.sort();
                this.#dialogs = this.#dialogs.sort();
                this.#bgms = this.#bgms.sort();
            }

            this.#adelite.update();
        })
        .catch(printStack);

        return false;
    };

    get okList() {
        return this.#okList;
    }

    get ngList() {
        return this.#ngList;
    }

    get files() {
        return this.#files;
    }

    get voices() {
        return this.#voices;
    }

    get bgms() {
        return this.#bgms;
    }

    get characters() {
        return this.#characters;
    }

    get dialogs() {
        return this.#dialogs;
    }


    /** @type {Adelite} */
    #adelite = null;

    /** @type {string[]} */
    #keys = [];

    /** @type {Set<string>} */
    #okList = null;

    /** @type {Set<string>} */
    #ngList = null;

    /** @type {Set<string>} */
    #checked = null;

    #progress = 0;
    #nItems = 0;

    /** @type {string[]} */
    #files = [];

    /** @type {string[]} */
    #voices = [];

    /** @type {string[]} */
    #bgms = [];

    /** @type {string[]} */
    #characters = [];

    /** @type {string[]} */
    #dialogs = [];    
}
