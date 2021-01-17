/**
 * @file background.js
 * @description Main screen background image view
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import * as Nina from '../valmir/nina.js';
import Adelite from '../sandica/adelite.js';
import { printStack } from '../blanc/lisette.js';

const template = {
    "once:class": "page-background",
    "img.page-background-image": {
        "bind:src": "{{ src }}"
    }
};

/**
 * Main screen background image view
 */
export default class Background {
    /**
     * @constructor
     * @param {string} id 
     * @param {Object} config 
     */
    constructor(id, config) {
        this.#adelite = new Adelite(id, template);
        this.#config = config;
    }

    /**
     * show this
     */
    show() {
        this.#adelite.show(this);
    }

    /**
     * 
     * @param {string} file 
     */
    setDialog(file) {
        Nina.readAsDataURL(this.#config.data.texture.dialog + file)
            .then((url) => {
                this.#src = url;
                this.#adelite.update();
            })
            .catch(printStack);
    }

    get src() {
        return this.#src;
    }

    /** @type {Adelite} */
    #adelite = null;

    /**
     * BGRSP config
     * @type {Object}
     */
    #config = null;

    /**
     * image source
     * @type {string}
     */
    #src = null;    
}
