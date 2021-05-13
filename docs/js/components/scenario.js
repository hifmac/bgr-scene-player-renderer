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
import * as Nina from '../valmir/nina.js';
import Adelite from '../sandica/adelite.js';

const template = {
    "div.page_list_row": {
        "forEach:row": "{{ rows }}",
        "bind:id": "{{ row.id }}",
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

/**
 * @class Scenario page view
 */
export default class Scenario {
    /**
     * @constructor
     * @param {string} id 
     * @param {string} initPage initial page to show 
     * @param {Object} config 
     */
    constructor(id, initPage, config) {
        this.#history = [ initPage ];
        this.#adelite = new Adelite(id, template);
        this.#config = config;
        this.#listeners = [];
    };

    /**
     * show this component
     */
    show() {
        this.#adelite.show(this);
        IPC.requestPage(last(this.#history))
            .then((page) => this.drawPage(page))
            .catch(printStack);
    }

    destroy() {
        this.#adelite.destroy();
    };

    /**
    * on row clicked
    * @param {{
    *     icon: string,
    *     title: string,
    *     page: Object
    * }} data 
    */
    onRowClicked(data) {
        if (data.page) {
            if ('subpages' in data.page) {
                this.#history.push(data.page.id);
                IPC.requestPage(data.page.id)
                    .then((page) => this.drawPage(page))
                    .catch(printStack);            
            }
            else if ('view' in data.page) {
                this.onViewChanged(data.page.view);
            }
            else if ('html' in data.page) {
                IPC.createWindow(data.page.html, { openDevTools: true });
            }
            else if ('dialog' in data.page) {
                IPC.createWindow(`replay.html?v=${data.page.dialog}`, { openDevTools: true });
            }
            else {
                console.error('Cannot handle: ', data.page);
            }
        }
        else if ('back' in data) {
            this.back();
        }
    }

    drawPage(page) {
        return new Promise((resolve, reject) => {
            this.#rows = [];
            this.#adelite.update();
    
            const promises = [];
            for (let subpageId of page.subpages) {
                promises.push(IPC.requestPage(subpageId));
            }
    
            Promise.all(promises).then((subpages) => {
                this.#rows = [
                    {
                        title: '戻る',
                        back: true,
                    }
                ];

                for (const subpage of subpages) {
                    const row = {
                        id: subpage.id || null,
                        hasIcon: 'icon' in subpage,
                        iconSrc: null,
                        title: subpage.title,
                        page: subpage
                    };
                    this.#rows.push(row);

                    if (row.hasIcon) {
                        Nina.readAsDataURL(this.#config.data.texture.icon + '/' + subpage.icon + '.png')
                            .then((url) => {
                                row.iconSrc = url;
                                this.#adelite.update();
                            })
                            .catch(printStack);
                    }
                }

                this.#adelite.update().then(resolve).catch(reject);
            })
            .catch(printStack);
        });
    };

    /**
     * add view change listener
     * @param {function(string): void} listener 
     */
    addViewChangeListener(listener) {
        this.#listeners.push(listener);
    };

    /**
     * invoke listeners on view changed
     * @param {string} view view name to be rendered 
     */
    onViewChanged(view) {
        for (let listener of this.#listeners) {
            listener(view);
        }
    };

    back() {
        let anchor = null;
        if (2 <= this.#history.length) {
            anchor = this.#history.pop();
        }

        IPC.requestPage(last(this.#history))
            .then((page) => {
                this.drawPage(page).then(() => {
                    document.location.hash = `#${anchor}`;
                });
            }).catch(printStack);
    }

    get rows() {
        return this.#rows;
    }

    /** @type {Object} */
    #rows = [];

    /** @type {string[]} */
    #history = null;

    /** @type {Adelite} */
    #adelite = null;

    /** @type {Object} */
    #config = {};

    /** @type {(function(string): void)[]} */
    #listeners = null;
}
