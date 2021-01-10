/**
 * @file texture-preview.js
 * @description Texture Preview view
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import { Filesystem, printStack } from '../blanc/lisette.js';
import Nina from '../valmir/nina.js';
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
        this.config = config;
        this.#path = this.config.data.texture.dialog + '/dialog/';
    }

    show() {
        this.#adelite.show(this);

        if (this.#textures.length === 0) {
            Filesystem.readDirectory(this.#path)
                .then((files) => {
                    this.#textures = files;
                    this.onTextureChanged(0);
                })
                .catch(printStack);
        }
    };

    destroy() {
        this.#adelite.destroy();
    };

    /**
     * 
     * @param {number} selectedIndex 
     */
    onTextureChanged(selectedIndex) {
        this.#selectedIndex = selectedIndex;

        Nina.readAsDataURL(this.#path + this.#textures[this.#selectedIndex])
            .then((url) => {
                this.#src = url;
                this.#adelite.update();
            })
            .catch(printStack);
    };

    /**
     * wheel event
     * @param {WheelEvent} e 
     */
    onWheelEvent(e) {
        if (e.deltaY < 0 && 0 < this.#selectedIndex) {
            this.onTextureChanged(this.#selectedIndex - 1);
            e.preventDefault();
            e.returnValue = false;
        }
        else if (0 < e.deltaY && this.#selectedIndex + 1 < this.#textures.length) {
            this.onTextureChanged(this.#selectedIndex + 1);
            e.preventDefault();
            e.returnValue = false;
        }
    };

    /**
     * image double clicked
     */
    onDoubleClick() {
        if (this.#src) {
            const downLoadLink = document.createElement('a');
            downLoadLink.download = this.#textures[this.#selectedIndex] + '.png';
            downLoadLink.href = this.#src;
            downLoadLink.dataset.downloadurl = ["image/png", downLoadLink.download, downLoadLink.href].join(":");
            downLoadLink.click();
        }
    };

    get textures() {
        return this.#textures;
    }

    get selectedIndex() {
        return this.#selectedIndex;
    }

    get src() {
        return this.#src;
    }

    /** @type {Adelite} */
    #adelite = null;

    /** @type {string[]} */
    #textures = [];

    /** @type {number} */
    #selectedIndex = 0;

    /** @type {string} */
    #src = null;

    /** @type {string} */
    #path = null;
}
