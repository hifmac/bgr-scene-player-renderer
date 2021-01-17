/**
 * @file scene-test.js
 * @description Dialog scene test view
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import {
    onLoad,
    Filesystem,
    printStack
} from './blanc/lisette.js';

import Adelite from './sandica/adelite.js';
import Lilium from './sandica/lilium.js';
import * as Ciffon from './jade/ciffon.js';
import * as Nina from './valmir/nina.js';

import('./valmir/nina.js');

const templateAdelite = {
    "canvas#sceneTestCanvas": {
        "once:width": 1024,
        "once:height": 576,
        "on:click": "{{ toggleUI() }}",
    },
    "div" :{
        "div#sceneTestUI": {
            "if": "{{ isUIEnabled }}",
            "once:class": "m-q2 p-q2",
            "div#dialogUI": {
                "once:class": "mb-q2",
                "label#dialog": { "once:textContent": "背景選択：" },
                "select#dialogSelect": {
                    "once:class": "mr-q2",
                    "on:change": "{{ onDialogChanged(getAttribute('selectedIndex')) }}",
                    "option": {
                        "forEach:dialog": "{{ dialogs }}",
                        "once:textContent": "{{ dialog }}",
                    }
                },
                "label#frontCharacter": { "once:textContent": "前面キャラ：" },
                "select#frontCharacterSelect": {
                    "on:change": "{{ onTopCharacterChanged(getAttribute('value')) }}",
                    "option#frontCharacterSelectLeft": {
                        "once:value": "left",
                        "once:textContent": "左",
                    },
                    "option#frontCharacterSelectRight": {
                        "once:value": "right",
                        "once:textContent": "右",
                    }
                }
            },
            "div#CharacterUI": {
                "forEach:char": "{{ [ ['左キャラ', 'left'], ['右キャラ', 'right'] ] }}",
                "once:class": "mb-q2",
                "label#character": { "once:textContent": "{{ char[0] }}：" },
                "select#characterSelect": {
                    "once:class": "mr-q2",
                    "on:change": "{{ onCharacterChanged(getAttribute('selectedIndex'), char[1]) }}",
                    "option": {
                        "forEach:character": "{{ characters }}",
                        "once:textContent": "{{ character.name }}",
                    }
                },
                "select#characterFace": {
                    "once:class": "mr-q2",
                    "on:change": "{{ onFaceChanged(getAttribute('selectedIndex'), char[1]) }}",
                    "option": {
                        "forEach:face": "{{ faces }}",
                        "once:textContent": "{{ face }}",
                    }
                },
                "label#shadow": { "once:textContent": "影：" },
                "input#shadowCheck": {
                    "once:class": "mr-q2",
                    "once:type": "checkbox",
                    "on:change": "{{ onCharacterShadowChanged(getAttribute('checked'), char[1]) }}"
                },
                "label#flip": { "once:textContent": "反転：" },
                "input#flipCheck": {
                    "once:type": "checkbox",
                    "on:change": "{{ onCharacterFlipChanged(getAttribute('checked'), char[1]) }}"
                }
            },
            "div#textUI": {
                "forEach:text": "{{ [ name, talk ] }}",
                "once:class": "mb-q2",
                "label.text-title-label": { "once:textContent": "{{ text.label }}" },
                "input.text-content": {
                    "once:type": "text",
                    "once:value": "{{ text.text }}",
                    "once:placeholder": "{{ text.placeholder }}",
                    "on:input": "{{ onTextChanged(text, 'text', getAttribute('value')) }}"
                },
                "label.text-font-label ml-q2": { "once:textContent": "フォント：" },
                "select": {
                    "bind:selectedIndex": "{{ text.font }}",
                    "on:input": "{{ onTextChanged(text, 'font', getAttribute('selectedIndex')) }}",
                    "option": {
                        "forEach:font": "{{ fonts }}",
                        "once:textContent": "{{ font }}",
                    }
                },
                "label.text-size-label ml-q2": { "once:textContent": "サイズ：" },
                "input.text-size": {
                    "once:type": "number",
                    "bind:value": "{{ text.size }}",
                    "on:input": "{{ onTextChanged(text, 'size', getAttribute('value')) }}"
                },
                "label.text-color-label ml-q2": { "once:textContent": "色：" },
                "input.text-color": {
                    "once:type": "text",
                    "bind:value": "{{ text.color }}",
                    "on:input": "{{ onTextChanged(text, 'color', getAttribute('value')) }}"
                },
            }
        }
    }
};

const templateLilium = {
    "on:update": "",
    "sprite": {
        "once:rect": "{{ [ 0, 0, 1024, 576 ] }}",
        "fill": {
            "once:color": "rgb(0, 0, 0)",
            "once:rect": "{{ [ 0, 0, 1024, 576 ] }}"
        },
        "image#background": {
            "bind:src": "{{ background }}",
            "once:rect": "{{ [ 0, 448, 1024, 576, 0, 0, 1024, 576 ] }}"
        },
        "sprite#character": {
            "forEach:target": "{{ [ back, front ] }}",
            "image#character": {
                "if": "{{ target.image }}",
                "bind:flip": "{{ target.flip }}",
                "bind:src": "{{ target.image }}",
                "bind:rect": "{{ target.bodyRect }}"
            },
            "image#character-face": {
                "if": "{{ target.image }}",
                "bind:flip": "{{ target.flip }}",
                "bind:src": "{{ target.image }}",
                "bind:rect": "{{ target.faceRect }}"
            },
            "image#character-shadow": {
                "if": "{{ target.hasShadow }}",
                "bind:flip": "{{ target.flip }}",
                "bind:src": "{{ target.shadow }}",
                "bind:rect": "{{ target.bodyRect }}"
            }
        },
        "sprite#talk": {
            "if": "{{ hasWidget('scenario-talk-bg') }}",
            "fill": {
                "once:color": "rgba(0, 0, 0, 0.7)",
                "once:rect": "{{ [ 70, 432, 884, 110 ] }}"
            },
            "image": {
                "once:src": "{{ widget['scenario-talk-bg'].image }}",
                "once:rect": "{{ widget['scenario-talk-bg'].rect }}"
            },
            "text": {
                "bind:textContent": "{{ talk.text }}",
                "once:font": "{{ talk.size }}px \"{{ fonts[talk.font] }}\"",
                "once:color":"{{ talk.color }}",
                "bind:lineHeight": "{{ add(parseInt(talk.size), 2) }}",
                "once:wrapWidth": 40,
                "once:leftTop": "{{ [ 125, 445 ] }}",
                "once:border": true,
            }
        },
        "sprite#name": {
            "if": "{{ hasWidget('scenario-name-bg') }}",
            "fill": {
                "once:color": "rgba(0, 0, 0, 0.7)",
                "once:rect": "{{ [ 67, 389, 198, 34 ] }}"
            },
            "image#scenario-name-bg": {
                "once:src": "{{ widget['scenario-name-bg'].image }}",
                "once:rect": "{{ widget['scenario-name-bg'].rect }}"
            },
            "text": {
                "bind:textContent": "{{ name.text }}",
                "once:font": "{{ name.size }}px \"{{ fonts[name.font] }}\"",
                "once:color":"{{ name.color }}",
                "once:leftTop": "{{ [ 75, 398 ] }}",
                "once:border": true,
            }
        },
        "sprite#buttons": {
            "forEach:button": "{{ buttons }}",
            "image": {
                "if": "{{ hasWidget(button) }}",
                "once:src": "{{ widget[button].image }}",
                "once:rect": "{{ widget[button].rect }}"
            },
        }
    }
};

const CHARACTER_POSITION = {
    left: {
        x: 1024 * 0.25 | 0,
        y: 576 * 0.25 | 0
    },
    right: {
        x: 1024 * 0.75 | 0,
        y: 576 * 0.25 | 0
    }
};

/**
 * @typedef {{
 *     image: Nina.DrawableElement,
 *     shadow: Nina.DrawableElement,
 *     hasShadow: boolean,
 *     flip: boolean,
 *     character: Object,
 *     face: string,
 *     bodyRect: number[],
 *     faceRect: number[],
 * }} CharacterState
 */

/**
 * Main screen background image view
 */
class SceneTest {
    /**
     * @constructor
     */
    constructor() {
        this.#adelite = new Adelite('#app', templateAdelite);
        this.#lilium = new Lilium('#sceneTestCanvas', templateLilium);
  
        this.#data = this.createData();

        // load config
        new Promise((resolve) => onLoad((config) => resolve(config)))
        // load dialog and character list
        .then((config) => {
            this.#config = config;
            this.#widgetCatalog = new Ciffon.WidgetCatalog(this.#config);
            return Promise.all([
                Filesystem.readDirectory(this.#config.data.texture.dialog + '/dialog'),
                ...Array.from(this.#config.json.character, (x) => Filesystem.readJsonFile(x))
            ]);
        })
        // show adelite
        .then((dialogAndCharacters) => {
            this.#data.dialogs = dialogAndCharacters[0];
            this.#data.characters = [];
            for (const key in dialogAndCharacters[1]) {
                this.#data.characters.push(dialogAndCharacters[1][key]);
            }
            this.#data.faces = Object.keys(this.#data.characters[0].face_rect);
            this.#data.front = this.createCharacter();
            this.#data.back = this.createCharacter();
            return this.#adelite.show(this.#data);
        })
        // show lilium
        .then(() => {
            return this.#lilium.show(this.#data);
        })
        // update dialog and character
        .then(() => {
            this.#data.onDialogChanged(0);
            this.#data.onCharacterChanged(0, 'left');
            this.#data.onCharacterChanged(0, 'right');
        })
        .catch(printStack);
    }

    /**
     * destroy this
     */
    destroy() {
        this.#adelite.destroy();
    }

    createData() {
        /**
         * @type {{
         *     background: Nina.DrawableElement,
         *     name: any,
         *     talk: any,
         *     isUIEnabled: boolean,
         *     characters: Object[],
         *     dialogs: string[],
         *     faces: string[],
         *     frontCharacter: string,
         *     front: CharacterState,
         *     back: CharacterState,
         *     widget: Object,
         *     buttons: string[],
         *     fonts: string[],
         *     toggleUI: () => void;
         *     hasWidget: (name: string) => boolean,
         *     onDialogChanged: (index: number) => void,
         *     onCharacterChanged: (index: number, pos: string) => void,
         *     onFaceChanged: (index: number, pos: string) => void,
         *     onTopCharacterChanged: (pos: string) => void,
         *     onCharacterShadowChanged: (shadow: boolean, pos: string) => void,
         *     onCharacterFlipChanged: (flip: boolean, pos: string) => void,
         *     onTextChanged: (text: Object, attr: string, value: string) => void,
         * }}
         */
        const data = {
            background: null,
            name: {
                label: '名前：',
                placeholder: 'リリウム',
                text: '',
                font: 0,
                size: 16,
                color: '#ffffff',
            },
            talk: {
                label: '台詞：',
                placeholder: 'あなたの相棒、リリウムよ',
                text: '',
                font: 0,
                size: 16,
                color: '#ffffff',
            },
            isUIEnabled: true,
            characters: [],
            dialogs: [],
            faces: [],
            frontCharacter: 'left',
            front: null,
            back: null,
            widget: {},
            buttons: [
                'scenario-log',
                'scenario-auto',
                'scenario-option',
                'scenario-minimize',
                'scenario-skip',
            ],
            fonts: Ciffon.FONTS,

            hasWidget: (name) => {
                const ret = (name in data.widget);
                if (!ret) {
                    this.#widgetCatalog.load(name)
                    .then((widget) => {
                        data.widget[name] = widget;
                        this.#lilium.update();
                    })
                    .catch(printStack);
                }
                return ret;
            },

            toggleUI: () => {
                data.isUIEnabled = !data.isUIEnabled;
                this.#adelite.update();
            },
        
            /**
            * on dialog select box changed
            * @param {number} index dialog select box index
            */
            onDialogChanged: (index) => {
                Nina.readAsImage(this.#config.data.texture.dialog + '/dialog/' + data.dialogs[index]).then((img) => {
                    data.background = img;
                    this.#lilium.update();
                });
            },
        
            onCharacterChanged: (index, position) => {
                const character = data.characters[index];
                const target = data.frontCharacter === position ? data.front : data.back;
                Nina.readAsImage(this.#config.data.texture.character + '/' + character.texture)
                .then((img) => {
                    target.character = character;
                    target.image = img;
                    this.updateCharacter(target, position);
                    return Nina.makeMaskImage(img);
                }).then((mask) => {
                    target.shadow = mask;
                    this.#lilium.update();
                });
            },
        
            onFaceChanged: (index, position) => {
                const target = data.frontCharacter === position ? data.front : data.back;
                target.face = data.faces[index];
                this.updateCharacter(target, position);
                this.#lilium.update();
            },
        
            onTopCharacterChanged: (position) => {
                if (data.frontCharacter !== position) {
                    data.frontCharacter = position;
                    const back = data.front;
                    data.front = data.back;
                    data.back = back;
                    this.#lilium.update();
                }
            },
        
            onCharacterShadowChanged: (checked, position) => {
                if (data.frontCharacter === position) {
                    data.front.hasShadow = checked;
                }
                else {
                    data.back.hasShadow = checked;
                }
                this.#lilium.update();
            },
        
            onCharacterFlipChanged: (checked, position) => {
                if (data.frontCharacter === position) {
                    data.front.flip = checked;
                    this.updateCharacter(data.front, position);
                }
                else {
                    data.back.flip = checked;
                    this.updateCharacter(data.back, position);
                }
                this.#lilium.update();
            },
        
            onTextChanged: (obj, attr, value) => {
                obj[attr] = value;
                this.#lilium.update();
            },
        };
        return data;
    }

    createCharacter() {
        return {
            image: null,
            shadow: null,
            hasShadow: false,
            flip: false,
            character: this.#data.characters[0],
            face: this.#data.faces[0],
            bodyRect: null,
            faceRect: null
        };
    }

    /**
     * @param {CharacterState} target
     * @param {string} position 
     */
    updateCharacter(target, position) {
        const pos = this.calcCharacterPosition(
            target.character.body_rect,
            target.character.face_rect[target.face],
            target.flip,
            CHARACTER_POSITION[position]);
        target.bodyRect = pos.body;
        target.faceRect = pos.face;
    }

    /**
     * 
     * @param {number[]} body 
     * @param {number[]} face 
     * @param {boolean} flip
     * @param {{
     *     x: number,
     *     y: number,
     * }} dest 
     * @returns {{
     *     body: number[],
     *     face: number[]
     * }}
     */
    calcCharacterPosition(body, face,  flip, dest) {
        const bodyRect = { x: body[0], y: body[1], w: body[2], h: body[3], };
        const faceRect = {
            sx: face[2], sy: face[3], sw: face[4], sh: face[5],
            dx: face[0], dy: face[1], dw: face[4], dh: face[5],
        };

        const hScale = flip ? -1 : 1;

        const bodyToFace = {
            dx: flip ? (bodyRect.x + bodyRect.w - faceRect.dx - faceRect.dw) : (faceRect.dx - bodyRect.x),
            dy: faceRect.dy - bodyRect.y,
        };
        const faceOffsetH = faceRect.dw >> 1;
        const faceOffsetV = faceRect.dh >> 1;

        const ret = {
            body: null, 
            face: null
        };

        ret.body = [
            bodyRect.x,
            bodyRect.y,
            bodyRect.w,
            bodyRect.h,
            hScale * (dest.x - faceOffsetH - bodyToFace.dx),
            dest.y - bodyToFace.dy,
            hScale * bodyRect.w,
            bodyRect.h,
        ];
        ret.face = [
            faceRect.sx,
            faceRect.sy,
            faceRect.sw,
            faceRect.sh,
            ret.body[4] + hScale * bodyToFace.dx,
            ret.body[5] + bodyToFace.dy,
            hScale * faceRect.dw,
            faceRect.dh
        ];

        return ret;
    }

    #data;

    /** @type {Adelite} */
    #adelite = null;

    /** @type {Lilium} */
    #lilium = null;

    /** @type {Ciffon.WidgetCatalog} */
    #widgetCatalog = null;

    /**
     * BGRSP config
     * @type {Object}
     */
    #config = null;
}

/** @type {SceneTest} */
const sceneTest = new SceneTest();
