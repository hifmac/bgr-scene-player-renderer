/**
 * @file search.js
 * @description Dialog data search view
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import { IPC, printStack } from '../blanc/lisette.js';
import Adelite from '../sandica/adelite.js';

const template = {
    "div.search-form m-q2": {
        "select#searchType": {
            "once:class": "mr-q2",
            "option": {
                "forEach:option": "{{ options }}",
                "bind:value": "{{ option.value }}",
                "bind:textContent": "{{ option.text }}"
            }
        },
        "input#searchText": {
            "once:class": "mr-q2",
            "once:type": "text",
            "once:placeholder": "例：リリウム",
            "on:change": "{{ submit(searchType.value, searchText.value) }}"
        },
        "button#searchSubmit": {
            "once:textContent": "検索",
            "on:click": "{{ submit(searchType.value, searchText.value) }}"
        }
    },
    "div.search-result-area": {
        "div.m-q2": {
            "forEach:table": "{{ tables }}",
            "table.search-result-table": {
                "tbody": {
                    "tr": {
                        "forEach:row": "{{ table.rows }}",
                        "td": {
                            "forEach:column": "{{ row }}",
                            "bind:class": "{{ column.class }}",
                            "bind:textContent": "{{ column.text }}"
                        }
                    }
                }
            },
            "hr": {}
        }
    }
};

/**
 * @class Dialog search view
 */
export default class Search {
    /**
     * @constructor
     * @param {string} id 
     * @param {Object} config 
     */
    constructor(id, config) {
        this.#adelite = new Adelite(id, template);
        this.config = config;
    }

    show() {
        this.#adelite.show(this);
    };

    destroy() {
        this.#adelite.destroy();
    };

    submit(searchType, searchText) {
        this.#tables = [];
        this.#adelite.update();

        let searchFunc;
        let validateFunc;
        switch (searchType) {
        case 'character':
            searchFunc = IPC.searchCharacter;
            validateFunc = (dialog) => {
                return dialog.name && dialog.name.indexOf(searchText) != -1;
            };
            break;
        case 'talk':
            searchFunc = IPC.searchTalk;
            validateFunc = (dialog) => {
                return dialog.talk && dialog.talk.indexOf(searchText) != -1;
            };
            break;
        case 'dialog':
            searchFunc = IPC.searchDialog;
            validateFunc = (dialog) => {
                return dialog.bg_pic && dialog.bg_pic.indexOf(searchText) != -1;
            };
            break;
        case 'bgm':
            searchFunc = IPC.searchBGM;
            validateFunc = (dialog) => {
                return dialog.bgm && dialog.bgm.indexOf(searchText) != -1;
            };
            break;
        }

        searchFunc(searchText)
        .then((dataList) => {
            for (const data of dataList) {
                const stages = []
                for (let page of data.pages) {
                    stages.push(page.title);
                }
                stages.shift();

                const characters = new Set();
                let text = null;
                for (let id in data.dialogs) {
                    const dialog = data.dialogs[id];
                    const name = dialog.name || '';
                    if (name && (dialog.char_id || 1 < name.length)) {
                        characters.add(name);
                    }
                    if (text == null) {
                        if (validateFunc(dialog)) {
                            text = name + '「' + (dialog.talk || '') + '」';
                        }
                    }
                }

                const table = { rows: [] };
                [
                    [ 'ステージ', stages.join(' > ') ],
                    [ 'セリフ', text ],
                    [ '登場キャラ', Array.from(characters).sort().join(', ') ]
                ].forEach(function(row) {
                    table.rows.push([
                        {
                            class: 'title',
                            text: row[0]
                        },
                        { 
                            class: 'body',
                            text: row[1]
                        }
                    ]);
                });
                this.#tables.push(table);
            }
            this.#adelite.update();
        })
        .catch(printStack);
    };

    get options() {
        return this.#options;
    }

    get tables() {
        return this.#tables;
    }

    /** @type {Adelite} */
    #adelite = null;

    #options = [
        {
            value: 'character',
            text: 'キャラクタ'
        },
        {
            value: 'talk',
            text: 'セリフ'
        },
        {
            value: 'dialog',
            text: '背景'
        },
        {
            value: 'bgm',
            text: 'BGM'
        }
    ];

    /**
     * @type {{
     *     rows: {
     *         class: string,
     *         text: string
     *     }[]
     * }[]}
     */
    #tables = [];
}
