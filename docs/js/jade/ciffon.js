/**
 * @file ciffon.js
 * @description Ciffon the widget loader
 * @author hifmac(E32456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import { makeError, mergeObject, printStack } from "../blanc/lisette.js";
import * as Nina from "../valmir/nina.js";

 /**
  * @typedef {{
  *     path: string,
  *     src: number[],
  *     dst?: number[]
  * }} WidgetDefinition
  *
  * @typedef {{
  *     src: Nina.DrawableElement,
  *     dst: number[]
  * }} Widget
  */

/** @type {Object.<string, WidgetDefinition>} */
const SCENARIO_WIDGET = {
    "scenario-talk-bg":{
        "path": "dialog/atlas4",
        "src": [ 1019, 1337, 893, 134 ],
        "dst": [ 64, 425 ],
    },
    "scenario-name-bg":{
        "path":"dialog/atlas4",
        "src": [ 0, 501, 198, 34 ],
        "dst": [ 67, 389 ]
    },

    "scenario-log":{
        "path": "dialog/atlas4",
        "src": [ 33, 63, 32, 18 ],
        "dst": [ 818, 409 ]
    },
    "scenario-log-hover":{
        "path": "dialog/atlas4",
        "src": [ 0, 63, 32, 18 ],
        "dst": [ 818, 409 ]
    },
    "scenario-log-active":{
        "path": "dialog/atlas4",
        "src": [ 1621, 1083, 32, 18 ],
        "dst": [ 818, 409 ]
    },

    "scenario-auto":{
        "path":"dialog/atlas4",
        "src": [ 697, 364, 32, 18 ],
        "dst": [ 854, 409 ]
    },
    "scenario-auto-hover":{
        "path": "dialog/atlas4",
        "src": [ 645, 296, 32, 18 ],
        "dst": [ 854, 409 ]
    },

    "scenario-option":{
        "path":"dialog/atlas4",
        "src": [ 128, 576, 45, 18 ],
        "dst": [ 890, 409 ]
    },
    "scenario-option-hover":{
        "path":"dialog/atlas4",
        "src": [ 1457, 289, 45, 18 ],
        "dst": [ 890, 409 ]
    },
    "scenario-option-active":{
        "path":"dialog/atlas4",
        "src": [ 1058, 576, 45, 18 ],
        "dst": [ 890, 409 ]
    },

    "scenario-minimize":{
        "path":"dialog/atlas4",
        "src": [ 2027, 915, 18, 18 ],
        "dst": [ 939, 409 ]
    },
    "scenario-minimize-hover":{
        "path":"dialog/atlas4",
        "src": [ 592, 45, 18, 18 ],
        "dst": [ 939, 409 ]
    },
    "scenario-minimize-active":{
        "path":"dialog/atlas4",
        "src": [ 573, 45, 18, 18 ],
        "dst": [ 939, 409 ]
    },

    "scenario-skip":{
        "path": "dialog/atlas4",
        "src": [ 1240, 277, 63, 18 ],
        "dst": [ 928, 39 ]
    },
    "scenario-skip-hover":{
        "path": "dialog/atlas4",
        "src": [ 0, 576, 63, 18 ],
        "dst": [ 928, 39 ]
    },
    "scenario-skip-active":{
        "path": "dialog/atlas4",
        "src": [ 64, 576, 63, 18 ],
        "dst": [ 928, 39 ]
    },

    "quesion-ok":{
        "path": "dialog/atlas4",
        "src": [ 1660, 1078, 168, 168 ],
        "dst": [ 437, 154 ]
    },
    "quesion-ok-hover":{
        "path": "dialog/atlas4",
        "src": [ 1686, 907, 168, 168 ],
        "dst": [ 437, 154 ]
    },
    "quesion-ok-active":{
        "path": "dialog/atlas4",
        "src": [ 1831, 1078, 168, 168 ],
        "dst": [ 437, 154 ]
    },

    "quesion-ng":{
        "path": "dialog/atlas4",
        "src": [ 1382, 744, 168, 168 ],
        "dst": [ 755, 154 ]
    },
    "quesion-ng-hover":{
        "path": "dialog/atlas4",
        "src": [ 1857, 907, 168, 168 ],
        "dst": [ 755, 154 ]
    },
    "quesion-ng-active":{
        "path": "dialog/atlas4",
        "src": [ 1553, 736, 198, 40 ],
        "dst": [ 755, 154 ]
    },

    "question-choise-frame1":{
        "path": "dialog/atlas3",
        "src": [ 1777, 1404, 198, 40 ],
        "dst": [ 666, 115 ]
    }
};

 /**
  * Ciffon the widget loader
  */
export class WidgetCatalog {
     /**
      * @constructor
      * @param {Object} config
      * @param {Object} widgetDefinitions 
      */
    constructor(config, widgetDefinitions=undefined) {
        this.#config = config;
        if (widgetDefinitions) {
            this.#widgetDefinitions = widgetDefinitions;
        }
        else {
            this.#widgetDefinitions = mergeObject([ SCENARIO_WIDGET ]);
        }
        this.#widgets = {};
        this.#listeners = {};
    }

    /**
     * load widget
     * @param {string} widgetName 
     */
    async load(widgetName) {
        if (widgetName in this.#widgetDefinitions) {
            const widget = this.#widgetDefinitions[widgetName];
            const path = this.#config.data.texture.dialog + '/' + widget.path;
            return {
                image: await Nina.clipImage(
                    await Nina.readAsImage(path),
                    { x: widget.src[0], y: widget.src[1], w: widget.src[2], h: widget.src[3] }),
                rect: widget.dst
            };
        }

    }

    /**
     * get widget
     * @param {string} widgetName 
     */
    get(widgetName) {
        if (widgetName in this.#widgets) {
            return this.#widgets[widgetName];
        }
        else if (widgetName in this.#widgetDefinitions) {
            const widgetDef = this.#widgetDefinitions[widgetName];
            const path = this.#config.data.texture.dialog + '/' + widgetDef.path;

            const widget = this.#widgets[widgetName] = {
                src: null,
                dst: [ 0, 0, 0, 0 ]
            };

            Nina.readAsImage(path).then((img) => {
                return Nina.clipImage(img, {
                    x: widgetDef.src[0],
                    y: widgetDef.src[1],
                    w: widgetDef.src[2],
                    h: widgetDef.src[3]
                });
            }).then((src) => {
                widget.src = src;
                widget.dst = [
                    widgetDef.dst[0],
                    widgetDef.dst[1],
                    widgetDef.src[2],
                    widgetDef.src[3]
                ];
                this.dispatchEvent('load', widget);
            }).catch(printStack);

            return widget;
        }
        else {
            throw makeError(`${widgetName} is not in the catalog`);
        }
    }

    /**
     * add widget event listener
     * @param {'load'} event 
     * @param {function(Widget): void} listener 
     */
    addEventListener(event, listener) {
        if (event in this.#listeners) {
            this.#listeners[event].push(listener);
        }
        else {
            this.#listeners[event] = [ listener ];
        }
    }

    /**
     * dispatch widget event
     * @param {string} event 
     * @param {Widget} widget
     */
    dispatchEvent(event, widget) {
        if (event in this.#listeners) {
            for (const listener of this.#listeners[event]) {
                listener(widget);
            }
        }
    }

    /** @type {Object} */
    #config = null;

    /** @type {Object.<string, WidgetDefinition>} */
    #widgetDefinitions = null;

    /** @type {Object.<string, Widget>} */
    #widgets = null;

    /** @type {Object.<string, (function(Widget): void)[]>} */
    #listeners = null;
}

export const FONTS = [
    'MS UI Gothic',
    'ＭＳ Ｐゴシック',
    'ＭＳ ゴシック',
    'ＭＳ Ｐ明朝',
    'ＭＳ 明朝',
    'メイリオ',
    'Meiryo UI',
    '游ゴシック',
    '游明朝',
    'ヒラギノ角ゴ Pro W3',
    'ヒラギノ角ゴ ProN W3',
    'ヒラギノ角ゴ Pro W6',
    'ヒラギノ角ゴ ProN W6',
    'ヒラギノ角ゴ Std W8',
    'ヒラギノ角ゴ StdN W8',
    'ヒラギノ丸ゴ Pro W4',
    'ヒラギノ丸ゴ ProN W4',
    'ヒラギノ明朝 Pro W3',
    'ヒラギノ明朝 ProN W3',
    'ヒラギノ明朝 Pro W6',
    'ヒラギノ明朝 ProN W6',
    '游ゴシック体',
    '游明朝体',
    'Osaka',
    'Osaka-Mono',
    'Droid Sans',
    'Roboto',

    'sans-serif',
    'arial',
    'arial black',
    'arial narrow',
    'arial unicode ms',
    'Century Gothic',
    'Franklin Gothic Medium',
    'Gulim',
    'Dotum',
    'Haettenschweiler',
    'Impact',
    'Ludica Sans Unicode',
    'Microsoft Sans Serif',
    'MS Sans Serif',
    'MV Boil',
    'New Gulim',
    'Tahoma',
    'Trebuchet',
    'Verdana',

    'serif',
    'Batang',
    'Book Antiqua',
    'Century',
    'Estrangelo Edessa',
    'Garamond',
    'Gautami',
    'Georgia',
    'Gungsuh',
    'Latha',
    'Mangal',
    'MS Serif',
    'PMingLiU',
    'Palatino Linotype',
    'Raavi',
    'Roman',
    'Shruti',
    'Sylfaen',
    'Times New Roman',
    'Tunga',
];
