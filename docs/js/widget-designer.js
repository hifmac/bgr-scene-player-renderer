/**
 * @file widget-designer.js
 * @description Widget designer window
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import { Filesystem, last, makeError, onLoad } from './blanc/lisette.js';
import * as Nina from './valmir/nina.js';
import Adelite from './sandica/adelite.js';

const template = {
    "canvas#canvas": {
        "on:click": "{{ onPreviewSwitch() }}"
    },
    "div#uiLayer": {
        "once:class": "m-q2 p-q2",
        "div": {
            "forEach:widget": "{{ widgets }}",
            "select": {
                "once:class": "mr-q2",
                "bind:selectedIndex": "{{ widget.index }}",
                "on:change": "{{ updateWidget(widget, 'index', getAttribute('selectedIndex')) }}",
                "option": {
                    "forEach:dialog": "{{ dialogs }}",
                    "once:textContent": "{{ dialog }}",                    
                }
            },
            "label#dxLabel": { "once:textContent": "dx:" },
            "input#dx": {
                "once:type": "number",
                "once:class": "widget-position mr-q2",
                "bind:value": "{{ widget.dx }}",
                "on:change": "{{ updateWidget(widget, 'dx', getAttribute('value')) }}"
            },
            "label#dyLabel": { "once:textContent": "dy:" },
            "input#dy": {
                "once:type": "number",
                "once:class": "widget-position mr-q2",
                "bind:value": "{{ widget.dy }}",
                "on:change": "{{ updateWidget(widget, 'dy', getAttribute('value')) }}"
            },
            "label#sxLabel": { "once:textContent": "sx:" },
            "input#sx": {
                "once:type": "number",
                "once:class": "widget-position mr-q2",
                "bind:value": "{{ widget.sx }}",
                "on:change": "{{ updateWidget(widget, 'sx', getAttribute('value')) }}"
            },
            "label#syLabel": { "once:textContent": "sy:" },
            "input#sy": {
                "once:type": "number",
                "once:class": "widget-position mr-q2",
                "bind:value": "{{ widget.sy }}",
                "on:change": "{{ updateWidget(widget, 'sy', getAttribute('value')) }}"
            },
            "label#swLabel": { "once:textContent": "w:" },
            "input#sw": {
                "once:type": "number",
                "once:class": "widget-position mr-q2",
                "bind:value": "{{ widget.sw }}",
                "on:change": "{{ updateWidget(widget, 'sw', getAttribute('value')) }}"
            },
            "label#shLabel": { "once:textContent": "h:" },
            "input#sh": {
                "once:type": "number",
                "once:class": "widget-position",
                "bind:value": "{{ widget.sh }}",
                "on:change": "{{ updateWidget(widget, 'sh', getAttribute('value')) }}"
            },
        },
        "button#add": {
            "once:textContent": "追加",
            "on:click": "{{ addWidget() }}",
        },
        "button#save": {
            "once:textContent": "保存",
            "on:click": "{{ save() }}",
        }
    },
};

/**
 * @class Widget designer view
 */
export default class WidgetDesigner {
    /**
     * @constructor
     */
    constructor() {
        this.#adelite = new Adelite('#app', template);

        this.#data = {
            dialogs: null,
            preview: true,
            widgets: [],
            lastWidget: null,
            addWidget: () => {
                this.#data.lastWidget = {
                    index: 0,
                    dialog: null,
                    dx: 0,
                    dy: 0,
                    sx: 0,
                    sy: 0,
                    sw: 0,
                    sh: 0,
                };
                this.#data.widgets.push(this.#data.lastWidget);
                this.#adelite.update();
            },
            /**
             * update widget position
             * @param {Widget} widget 
             * @param {string} attr 
             * @param {number} value 
             */
            updateWidget: (widget, attr, value) => {
                switch (attr) {
                case 'index':
                    widget[attr] = value | 0;
                    Nina.readAsImage(this.#path + this.#data.dialogs[widget[attr]]).then((img) => {
                        widget.dialog = img;
                        this.updateCanvas();
                    });
                    break;
                case 'dx': case 'dy':
                    widget[attr] = value | 0;
                    this.updateCanvas();
                    break;
                case 'sx': case 'sy': case 'sw': case 'sh':
                    widget[attr] = value | 0;
                    this.updateCanvas();
                    break;
                default:
                    throw makeError(`Invalid attribute name: ${attr}`);
                }
            },
            onPreviewSwitch: () => {
                this.#data.preview = !this.#data.preview;
                this.updateCanvas();
            },
            save: () => {

            }
        };

        onLoad((config) => {
            this.#config = config;
            this.#path = this.#config.data.texture.dialog + '/dialog/';
            Filesystem.readDirectory(this.#path).then((files) => {
                this.#data.dialogs = files;
                return this.#adelite.show(this.#data);
            }).then(() => {
                this.#canvas = this.#adelite.getElementById('canvas');                
                this.updateCanvas();
            });
        });

        /**
         * @param {Event} event
         */
        window.addEventListener('paste', (event) => {
            if (event instanceof ClipboardEvent) {
                Nina.readAsImageFromClipboard(event).then((img) => {
                    this.#sample = img;
                    this.updateCanvas();
                });
            }
        });
    }

    updateCanvas() {
        this.#canvas.width = 1024;
        this.#canvas.height = 576;

        const center = {
            x: this.#canvas.width >> 1,
            y: this.#canvas.height >> 1,
        };

        /*
         * fill black background
         */
        const ctx = this.#canvas.getContext('2d');
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);

        if (this.#data.preview) {
            /*
             * draw sample background
             */
            if (this.#sample) {
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.drawImage(this.#sample, 0, 0);
                ctx.restore();
            }

            /*
             * draw widgets 
             */
            for (const widget of this.#data.widgets) {
                if (widget.dialog) {
                    ctx.drawImage(widget.dialog,
                        widget.sx, widget.sy, widget.sw, widget.sh,
                        widget.dx, widget.dy, widget.sw, widget.sh);
                }
            }
        }
        else {
            if (this.#data.lastWidget && this.#data.lastWidget.dialog) {
                const lastWidget = this.#data.lastWidget;

                const offsetX = (lastWidget.sw >> 1);
                const offsetY = (lastWidget.sh >> 1);
                const dx = center.x - offsetX;
                const dy = center.y - offsetY;

                /*
                 * fill white widget background
                 */
                ctx.fillStyle = 'rgb(255, 255, 255)';
                ctx.fillRect(dx, dy, lastWidget.sw, lastWidget.sh);

                /*
                 * draw widget 
                 */
                ctx.drawImage(this.#data.lastWidget.dialog,
                    lastWidget.sx, lastWidget.sy, lastWidget.sw, lastWidget.sh,
                    dx, dy, lastWidget.sw, lastWidget.sh);
 
                /*
                 * stroke widget box 
                 */
                ctx.strokeStyle = 'rgb(0, 255, 0, 1)';
                ctx.beginPath();
                ctx.moveTo(dx - 1, dy - 1);
                ctx.lineTo(dx + lastWidget.sw + 1, dy - 1);
                ctx.lineTo(dx + lastWidget.sw + 1, dy + lastWidget.sh + 1);
                ctx.lineTo(dx - 1, dy + lastWidget.sh + 1);
                ctx.closePath();
                ctx.stroke();
            }
        }

        this.#adelite.update();
    }

    /** @type {Adelite} */
    #adelite = null;

    /** @type {Object} */
    #config = null;

    /**
     * @typedef {{
     *     index: number,
     *     dialog: Nina.DrawableElement | null,
     *     dx: number,
     *     dy: number,
     *     sx: number,
     *     sy: number,
     *     sw: number,
     *     sh: number
     * }} Widget
     *
     * @type {{
     *     dialogs: string[],
     *     preview: boolean,
     *     widgets: Widget[],
     *     lastWidget: Widget,
     *     onPreviewSwitch: () => void,
     *     addWidget: () => void,
     *     updateWidget: (Widget, string, number) => void,
     *     save: () => void
     * }}
     */
    #data = null;

    /** @type {HTMLCanvasElement} */
    #canvas = null;

    /** @type {Nina.DrawableElement} */
    #sample = null;

    /** @type {string} */
    #path = null;
}

const widgetDesigner = new WidgetDesigner();
