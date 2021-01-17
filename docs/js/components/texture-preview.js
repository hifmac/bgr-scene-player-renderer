/**
 * @file texture-preview.js
 * @description Texture Preview view
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import { Filesystem, printStack } from '../blanc/lisette.js';
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
        this.#data = {
            selectedIndex: 0,
            textures: [],
            src: null,
            onTextureChanged: (selectexIndex) => this.onTextureChanged(selectexIndex),
            onWheelEvent: (event) => this.onWheelEvent(event),
            onDoubleClick: () => this.onDoubleClick,
        };
        this.#adelite.show(this.#data).then(() => {
            if (this.#data.textures.length === 0) {
                Filesystem.readDirectory(this.#path).then((files) => {
                    this.#data.textures = files;
                    this.onTextureChanged(0);        
                }).catch(printStack);
            }
        }).catch(printStack);
    };

    destroy() {
        this.#adelite.destroy();
    };

    /**
     * 
     * @param {number} selectedIndex 
     */
    onTextureChanged(selectedIndex) {
        this.#data.selectedIndex = selectedIndex;

        Nina.readAsDataURL(this.#path + this.#data.textures[this.#data.selectedIndex])
            .then((url) => {
                this.#data.src = url;
                this.#adelite.update();
            })
            .catch(printStack);
    };

    /**
     * wheel event
     * @param {WheelEvent} e 
     */
    onWheelEvent(e) {
        if (e.deltaY < 0 && 0 < this.#data.selectedIndex) {
            this.onTextureChanged(this.#data.selectedIndex - 1);
            e.preventDefault();
            e.returnValue = false;
        }
        else if (0 < e.deltaY && this.#data.selectedIndex + 1 < this.#data.textures.length) {
            this.onTextureChanged(this.#data.selectedIndex + 1);
            e.preventDefault();
            e.returnValue = false;
        }
    };

    /**
     * image double clicked
     */
    onDoubleClick() {
        if (this.#data.src) {
            const downLoadLink = document.createElement('a');
            downLoadLink.download = this.#data.textures[this.#data.selectedIndex] + '.png';
            downLoadLink.href = this.#data.src;
            downLoadLink.dataset.downloadurl = ["image/png", downLoadLink.download, downLoadLink.href].join(":");
            downLoadLink.click();
        }
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
