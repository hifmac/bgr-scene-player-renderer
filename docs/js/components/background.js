/**
 * @file background.js
 * @description Main screen background image view
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import Nina from '../valmir/nina.js';
import Adelite from '../sandica/adelite.js';
import { printStack } from '../blanc/lisette.js';

const template = {
    "once:class": "page-background",
    "img.page-background-image": {
        "bind:src": "{{ src }}"
    }
};

export default function Background(id, config) {
    this.adelite = new Adelite(id, template);
    this.config = config;
}

Background.prototype.src = null;

Background.prototype.show = function Background_show() {
    this.adelite.show(this);
}

Background.prototype.setDialog = function Background_setDialog(file) {
    Nina.readAsDataURL(this.config.data.texture.dialog + file)
        .then((url) => {
            this.src = url;
            this.adelite.update();
        })
        .catch(printStack);
}
