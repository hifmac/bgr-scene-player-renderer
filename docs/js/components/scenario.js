/**
 * @file scenario.js
 * @description Scenario selection view
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import {
    IPC,
    last,
    printStack
} from '../blanc/lisette.js';
import Nina from '../valmir/nina.js';
import Adelite from '../sandica/adelite.js';

const template = {
    "div.page_list_row": {
        "forEach:row": "{{ rows }}",
        "on:click": "{{ onRowClicked(row) }}",
        "img": {
            "if": "{{ row.hasIcon }}",
            "bind:src": "{{ row.iconSrc }}"
        },
        "div": {
            "bind:textContent": "{{ row.title }}"
        }
    }
};

export default function Scenario(id, initPage, config) {
    this.history = [ initPage ];
    this.adelite = new Adelite(id, template);
    this.config = config;
    this.listeners = [];
};

/** @type {Object} */
Scenario.prototype.rows = [];

/** @type {string[]} */
Scenario.prototype.history = null;

/** @type {Adelite} */
Scenario.prototype.adelite = null;

/** @type {Object} */
Scenario.prototype.config = {};

/** @type {(function(string): void)[]} */
Scenario.prototype.listeners = null;

/**
 * show this component
 */
Scenario.prototype.show = function Scenario_show() {
    this.adelite.show(this);
    IPC.requestPage(last(this.history))
        .then((page) => this.drawPage(page))
        .catch(printStack);
}

Scenario.prototype.destroy = function Scenario_destroy() {
    this.adelite.destroy();
};

/**
* on row clicked
* @param {{
*     icon: string,
*     title: string,
*     page: Object
* }} data 
*/
Scenario.prototype.onRowClicked = function Scenario_onRowClicked(data) {
    if (data.page) {
        if ('subpages' in data.page) {
            this.history.push(data.page.id);
            IPC.requestPage(data.page.id)
                .then((page) => this.drawPage(page))
                .catch(printStack);            
        }
        else if ('view' in data.page) {
            this.onViewChanged(data.page.view);
        }
        else {
            console.error('Cannot handle: ', data.page);
        }
    }
    else if ('back' in data) {
        this.back();
    }
}

Scenario.prototype.drawPage = function Scenario_drawPage(page) {
    this.rows = [];
    this.adelite.update();

    const promises = [];
    for (let subpageId of page.subpages) {
        promises.push(IPC.requestPage(subpageId));
    }

    Promise.all(promises)
    .then((subpages) => {
        this.rows = [
            {
                title: '戻る',
                back: true,
            }
        ];

        for (const subpage of subpages) { 
            const row = {
                hasIcon: 'icon' in subpage,
                iconSrc: null,
                title: subpage.title,
                page: subpage
            };
            this.rows.push(row);

            if (row.hasIcon) {
                Nina.readAsDataURL(this.config.data.texture.icon + '/' + subpage.icon + '.png')
                    .then((url) => {
                        row.iconSrc = url;
                        this.adelite.update();
                    })
                    .catch(printStack);
            }
        }

        this.adelite.update();
    })
    .catch(printStack);
};

/**
 * add view change listener
 * @param {function(string): void} listener 
 */
Scenario.prototype.addViewChangeListener = function Scenario_addViewChangeListener(listener) {
    this.listeners.push(listener);
};

/**
 * invoke listeners on view changed
 * @param {string} view view name to be rendered 
 */
Scenario.prototype.onViewChanged = function Scenario_onViewChanged(view) {
    for (let listener of this.listeners) {
        listener(view);
    }
};

Scenario.prototype.back = function Scenario_back() {
    if (2 <= this.history.length) {
        this.history.pop();
    }

    IPC.requestPage(last(this.history))
        .then((page) => this.drawPage(page))
        .catch(printStack);
}
