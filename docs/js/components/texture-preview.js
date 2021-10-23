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
        "select#1": {
            "bind:selectedIndex": "{{ selectedFolder }}",
            "on:change": "{{ onFolderChanged(getAttribute('selectedIndex')) }}",
            "option": {
                "forEach:option": "{{ folders }}",
                "bind:textContent": "{{ option }}",
                "bind:value": "{{ option }}"
            }
        },
        "select#2": {
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
            selectedFolder: 0,
            selectedIndex: 0,
            folders: [ 'dialog' ],
            textures: [],
            src: null,

            /**
             * @param {number} selectedFolder 
             */
            onFolderChanged: (selectedFolder) => {
                data.selectedFolder = selectedFolder;

                this.#path = `${this.#config.data.texture.dialog}/${data.folders[data.selectedFolder]}/`;
                Filesystem.readDirectory(this.#path).then((files) => {
                    this.#data.textures = files;
                    this.#data.onTextureChanged(0);        
                }).catch(printStack);
            },

            /**
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
            Filesystem.readDirectory(this.#config.data.texture.dialog).then((folders) => {
                this.#data.folders = folders;
                this.#data.onFolderChanged(folders.indexOf('dialog'));        
            }).catch(printStack);
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
     *     folders: string[],
     *     textures: string[],
     *     selectedFolder: number,
     *     selectedIndex: number,
     *     src: string,
     *     onFolderChanged: (number) => void,
     *     onTextureChanged: (number) => void,
     *     onWheelEvent: (WheelEvent) => void,
     *     onDoubleClick: () => void,
     * }}
     */
    #data = null;

    /** @type {string} */
    #path = null;
}
