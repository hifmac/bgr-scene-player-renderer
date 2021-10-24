
/**
 * @file resource-decryptor.js
 * @description resource decryption window
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import { Filesystem, last, makeError, onLoad, onTimeout } from './blanc/lisette.js';
import Adelite from './sandica/adelite.js';
import Background from './components/background.js';

const template = {
    "input.select-folder": {
        "once:type": "file",
        "once:webkitdirectory": true,
        "once:directory": true,
        "once:multiple": true,
        "once:style": "color: #ffffff",
        "on:change": "{{ onFolderChanged(event.target.files) }}"
    }
};

const phrase = JSON.parse(atob('ewogICAgImtleSI6ICJFeG1HTTA0UVZwNTJzZ0dud0N3b1RPK2ltU25XVFhnNXkrUXJwVkJDWE5zPSIsCiAgICAiaXYiOiAiMnZZeWJIb0NuU2E5U0Q4TnU2c3NBQT09Igp9'));
phrase.key = CryptoJS.enc.Base64.parse(phrase.key);
phrase.iv  = CryptoJS.enc.Base64.parse(phrase.iv);

const arrayToString = arr => arr.reduce((str, code) => str + String.fromCharCode(code), '');

/**
 * @typedef {{
 *     words: Array
 *     sigBytes: number
 * }} WordsArray
 */

/**
 * @class Widget designer view
 */
export default class ResourceDecrypter {
    /**
     * @constructor
     */
    constructor() {
        this.#adelite = new Adelite('#app', template);

        /**
         * convert ArrayBuffer to Base64
         * @param {ArrayBuffer} arrayBuffer 
         */
        const arrayBufferToBase64 = (arrayBuffer) => {
            const buffer = new Uint8Array(arrayBuffer);

            let encrypted = '';
            for (let i = 0; i < buffer.length; ++i) { 
                encrypted += String.fromCharCode(buffer[i]);
            }

            return btoa(encrypted);
        }

        /**
         * convert WordsArray to buffer
         * @param {WordsArray} decoded 
         */
        const wordsToBuffer = (decoded) => {
            const decrypted = new Uint8Array(decoded.sigBytes);
            for (let i = 0; i < decrypted.length; ++i) {
                const shift = (3 - (i & 0x03)) * 8;
                decrypted[i] = (decoded.words[ i >> 2 ] >> shift) & 0xFF;
            }
            return decrypted
        }

        this.#data = {
            onFolderChanged(files) {
                let promise = onTimeout(0);

                for (const file of files) {
                    promise = promise.then(() => {
                        return new Promise((resolve, reject) => {
                            if (file.path.endsWith('dec')) {
                                resolve();
                                return ;
                            }

                            const fr = new FileReader();
                            fr.onload = (event) => {
                                /** @type {WordsArray} */
                                const decoded = CryptoJS.AES.decrypt(
                                    arrayBufferToBase64(event.target.result),
                                    phrase.key,
                                    { iv: phrase.iv });
                                Filesystem.writeFile(file.path + ".dec", wordsToBuffer(decoded))
                                    .then(resolve)
                                    .catch(reject);
                            };
                            fr.onerror = reject;
                            fr.readAsArrayBuffer(file);
                        });
                    });
                }

                promise.then(() => {
                    alert('完了しました');
                }).catch(() => {
                    alert('失敗しました');
                });
            }
        };

        onLoad((config) => {
            this.#background = new Background('#background', config);
            this.#background.setDialog('/dialog/dialog342');
            this.#background.show();

            this.#config = config;
            this.#adelite.show(this.#data);
        });
    };

    /** @type {Adelite} */
    #adelite = null;

    /** @type {Object} */
    #config = null;

    /** @type {Object} */
    #data = null;

    /** @type {Background} */
    #background = null;
}

const resourceDecrypter = new ResourceDecrypter();
