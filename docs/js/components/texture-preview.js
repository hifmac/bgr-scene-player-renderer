/**
 * @file texture-preview.js
 * @description Texture Preview view
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import { Filesystem, printStack, saveURLAsFile } from '../blanc/lisette.js';
import * as Nina from '../valmir/nina.js';
import Adelite from '../sandica/adelite.js';

const template = {
    "div#select": {
        "select": {
            "bind:selectedIndex": "{{ selectedIndex }}",
            "on:change": "{{ onTextureChanged(getAttribute('selectedIndex')) }}",
            "option": {
                "forEach:option": "{{ textures }}",
                "bind:textContent": "{{ option }}",
                "bind:value": "{{ option }}"
            }
        },
    },
    "div#image": {
        "img.texture-preview-image": {
            "bind:src": "{{ src }}",
            "on:wheel": "{{ onWheelEvent(event) }}",
            "on:dblclick": "{{ onDoubleClick() }}"
        }
    }
};

/**
 * @class Texture preview view
 */
export default class TexturePreview {
    /**
     * @constructor
     * @param {string} id 
     * @param {Object} config 
     */
    constructor(id, config) {
        this.#adelite = new Adelite(id, template);
        this.#config = config;
        this.#path = this.#config.data.texture.dialog + '/dialog/';
    }

    show() {
        const data = {
            selectedIndex: 0,
            textures: [],
            src: null,

            /**
             * 
             * @param {number} selectedIndex 
             */
            onTextureChanged: (selectedIndex) => {
                data.selectedIndex = selectedIndex;

                Nina.readAsDataURL(this.#path + data.textures[data.selectedIndex])
                    .then((url) => {
                        data.src = url;
                        this.#adelite.update();
                    })
                    .catch(printStack);
            },

            /**
             * wheel event
             * @param {WheelEvent} e 
             */
            onWheelEvent: (e) => {
                if (e.deltaY < 0 && 0 < data.selectedIndex) {
                    data.onTextureChanged(data.selectedIndex - 1);
                    e.preventDefault();
                    e.returnValue = false;
                }
                else if (0 < e.deltaY && data.selectedIndex + 1 < data.textures.length) {
                    data.onTextureChanged(data.selectedIndex + 1);
                    e.preventDefault();
                    e.returnValue = false;
                }
            },

            /**
             * image double clicked
             */
            onDoubleClick: () => {
                if (data.src) {
                    saveURLAsFile(data.textures[data.selectedIndex] + '.png', data.src, 'image/png');
                }
            }
        };

        this.#data = data;
        this.#adelite.show(this.#data).then(() => {
            if (this.#data.textures.length === 0) {
                Filesystem.readDirectory(this.#path).then((files) => {
                    this.#data.textures = files;
                    this.#data.onTextureChanged(0);        
                }).catch(printStack);
            }
        }).catch(printStack);
    };

    destroy() {
        this.#adelite.destroy();
    };

    /** @type {Object} */
    #config = null;

    /** @type {Adelite} */
    #adelite = null;

    /**
     * @type {{
     *     textures: string[],
     *     selectedIndex: number,
     *     src: string,
     *     onTextureChanged: (number) => void,
     *     onWheelEvent: (WheelEvent) => void,
     *     onDoubleClick: () => void,
     * }}
     */
    #data = null;

    /** @type {string} */
    #path = null;
}
