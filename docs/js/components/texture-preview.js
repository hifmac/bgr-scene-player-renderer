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

export default function TexturePreview(id, config) {
    this.adelite = new Adelite(id, template);
    this.config = config;
    this.path = this.config.data.texture.dialog + '/dialog/';
}

/** @type {Adelite} */
TexturePreview.prototype.adelite = null;

/** @type {string[]} */
TexturePreview.prototype.textures = [];

/** @type {number} */
TexturePreview.prototype.selectedIndex = 0;

TexturePreview.prototype.src = null;

/** @type {string} */
TexturePreview.prototype.path = null;


TexturePreview.prototype.show = function Texture_show() {
    this.adelite.show(this);

    if (this.textures.length === 0) {
        Filesystem.readDirectory(this.path)
            .then((files) => {
                this.textures = files;
                this.onTextureChanged(0);
            })
            .catch(printStack);
    }
};

TexturePreview.prototype.destroy = function TexturePreview_destroy() {
    this.adelite.destroy();
};

TexturePreview.prototype.onTextureChanged = function Texture_onTextureChanged(selectedIndex) {
    this.selectedIndex = selectedIndex;

    Nina.readAsDataURL(this.path + this.textures[this.selectedIndex])
        .then((url) => {
            if (this.src) {
                URL.revokeObjectURL(this.src);
            }
            this.src = url;
            this.adelite.update();
        })
        .catch(printStack);
};

TexturePreview.prototype.onWheelEvent = function Texture_onWheelEvent(e) {
    if (e.deltaY < 0 && 0 < this.selectedIndex) {
        this.onTextureChanged(this.selectedIndex - 1);
        e.preventDefault();
        e.returnValue = false;
    }
    else if (0 < e.deltaY && this.selectedIndex + 1 < this.textures.length) {
        this.onTextureChanged(this.selectedIndex + 1);
        e.preventDefault();
        e.returnValue = false;
    }
};

TexturePreview.prototype.onDoubleClick = function Texture_onDoubleClick() {
    if (this.src) {
        const downLoadLink = document.createElement('a');
        downLoadLink.download = this.textures[this.selectedIndex] + '.png';
        downLoadLink.href = this.src;
        downLoadLink.dataset.downloadurl = ["image/png", downLoadLink.download, downLoadLink.href].join(":");
        downLoadLink.click();
    }
};
