/**
 * @file replay.js
 * @description Scenario Replay
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import {
    onLoad,
    IPC,
    printStack,
    getURLParameter,
    Filesystem,
    makeError,
} from './blanc/lisette.js';

import * as Claire from './jade/claire.js';

/**
 * @typedef {import('./blanc/lisette.js').Config} Config
 * @typedef {import('./blanc/lisette.js').Dialog} Dialog
 * @typedef {import('./blanc/lisette.js').Character} Character
 */

import Lilium from './sandica/lilium.js';
import * as Ciffon from './jade/ciffon.js';
import * as Nina from './valmir/nina.js';

const template = {
    "sprite": {
        "once:rect": "{{ [ 0, 0, 1024, 576 ] }}",
        "on:click": "{{ onClicked() }}",
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
            "if": "{{ widgetCatalog.get('scenario-talk-bg').src }}",
            "fill": {
                "once:color": "rgba(0, 0, 0, 0.7)",
                "once:rect": "{{ [ 70, 432, 884, 110 ] }}"
            },
            "image": {
                "once:src": "{{ widgetCatalog.get('scenario-talk-bg').src }}",
                "once:rect": "{{ widgetCatalog.get('scenario-talk-bg').dst }}"
            },
            "text": {
                "bind:textContent": "{{ talk.text }}",
                "once:font": "{{ talk.size }}px \"{{ name.font }}\"",
                "once:color":"{{ talk.color }}",
                "once:lineHeight": "{{ talk.lineHeight }}",
                "once:wrapWidth": 40,
                "once:leftTop": "{{ [ 125, 445 ] }}",
                "once:border": false,
            }
        },
        "sprite#name": {
            "if": "{{ widgetCatalog.get('scenario-name-bg').src }}",
            "fill": {
                "once:color": "rgba(0, 0, 0, 0.7)",
                "once:rect": "{{ [ 67, 389, 198, 34 ] }}"
            },
            "image#scenario-name-bg": {
                "once:src": "{{ widgetCatalog.get('scenario-name-bg').src }}",
                "once:rect": "{{ widgetCatalog.get('scenario-name-bg').dst }}",
            },
            "text": {
                "bind:textContent": "{{ name.text }}",
                "once:font": "{{ name.size }}px \"{{ name.font }}\"",
                "once:color":"{{ name.color }}",
                "once:leftTop": "{{ [ 75, 398 ] }}",
                "once:border": true,
            }
        },
        "sprite#buttons": {
            "button": {
                "forEach:button": "{{ buttons }}",
                "bind:src": "{{ widgetCatalog.get(button.normal).src }}",
                "bind:rect": "{{ widgetCatalog.get(button.normal).dst }}",
                "bind:src-hover": "{{ widgetCatalog.get(button.hover).src }}",
                "bind:rect-hover": "{{ widgetCatalog.get(button.hover).dst }}",
                "bind:src-active": "{{ widgetCatalog.get(button.active).src }}",
                "bind:rect-active": "{{ widgetCatalog.get(button.active).dst }}",
                "on:click": "{{ button.onClicked() }}"
            }
        },
        "sprite#2choices": {
            "if": "{{ hasTwoChoiceOption() }}",
            "once:rect": "{{ [ 0, 0, 1024, 576 ] }}",
            "on:click": "{{ onClickIgnored() }}",
            "button": {
                "forEach:choice": "{{ twoChoices }}",
                "bind:src": "{{ widgetCatalog.get(choice.normal).src }}",
                "bind:rect": "{{ widgetCatalog.get(choice.normal).dst }}",
                "bind:src-hover": "{{ widgetCatalog.get(choice.hover).src }}",
                "bind:rect-hover": "{{ widgetCatalog.get(choice.hover).dst }}",
                "bind:src-active": "{{ widgetCatalog.get(choice.active).src }}",
                "bind:rect-active": "{{ widgetCatalog.get(choice.active).dst }}",
                "on:click": "{{ choice.onClicked() }}"
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
 * Replay component
 */
class Replay {
    /**
     * @constructor
     */
    constructor() {
        this.#lilium = new Lilium('#app', template);

        const params = getURLParameter();

        const receiveAllDialog = () => {
            /** @type {Object.<string, Dialog>} */
            const dialogs = {};
            return new Promise((resolve, reject) => {
                /** @type {function(Dialog): void} */
                const receiveDialog = (dialog) => {
                    dialogs[dialog.id] = dialog;
                    if (!('next' in dialog) || dialog.next.length === 0) {
                        resolve(dialogs);
                    }
                    else {
                        for (const next of dialog.next) {
                            if (!(next in dialogs)) {
                                dialogs[next] = null;
                                IPC.requestDialog(next)
                                    .then(receiveDialog)
                                    .catch(reject);
                            }
                        }
                    }
                };
    
                dialogs[params.v] = null;
                IPC.requestDialog(params.v)
                    .then(receiveDialog)
                    .catch(reject);
            });
        };

        // load config
        new Promise((resolve) => onLoad((config) => resolve(config)))
        // load dialog and character list
        .then((config) => {
            this.#config = config;
            return receiveAllDialog();
        })
        .then((dialogs) => {
            this.#data = this.createData();
            this.#data.widgetCatalog.addEventListener('load', () => {
                this.#lilium.update();
            });
            this.#data.dialogs = dialogs;
            return Promise.all(
                Array.from(this.#config.json.character, (x) => Filesystem.readJsonFile(x))
            );
        })
        .then((characters) => {
            this.#data.characters = characters[0];
            return this.#lilium.show(this.#data);
        })
        .then(() => {
            this.#data.loadDialog(params.v);
        })
        .catch(printStack);
    }

    createData() {
        /**
         * @type {{
         *     background: Nina.DrawableElement,
         *     name: any,
         *     talk: any,
         *     characters: Character,
         *     dialog: Dialog,
         *     dialogs: Object.<string,Dialog>,
         *     frontCharacter: string,
         *     front: CharacterState,
         *     back: CharacterState,
         *     erase: boolean,
         *     buttons: {
         *          normal: string,
         *          hover: string,
         *          active: string,
         *          onClicked: () => void
         *     }[],
         *     twoChoices: {
         *          normal: string,
         *          hover: string,
         *          active: string,
         *          onClicked: () => void
         *     }[],
         *     fonts: string[],
         *     player: Claire.Player,
         *     widgetCatalog: Ciffon.WidgetCatalog,
         *     hasTwoChoiceOption: () => boolean,
         *     hasFourChoiceOption: () => boolean,
         *     onClicked: () => void,
         *     onClickIgnored: () => void,
         *     loadDialog: (dialog_id: string) => void,
         * }}
         */
        const data = {
            background: null,
            name: {
                text: '',
                font: 'メイリオ',
                size: 16,
                color: '#ffffff',
            },
            talk: {
                text: '',
                fonr: 'メイリオ',
                size: 18,
                lineHeight: 22,
                color: '#ffffff',
            },
            characters: null,
            dialog: null,
            dialogs: null,
            frontCharacter: null,
            front: this.createCharacter(),
            back: this.createCharacter(),
            erase: false,

            buttons: [
                {
                    normal: 'scenario-log',
                    hover: 'scenario-log-hover',
                    active: 'scenario-log-active',
                    onClicked(event) {
                        alert(event);
                    }
                },
                {
                    normal: 'scenario-auto',
                    hover: 'scenario-auto',
                    active: 'scenario-auto',
                    onClicked(event) {
                        alert(event);
                    }
                },
                {
                    normal: 'scenario-option',
                    hover: 'scenario-option-hover',
                    active: 'scenario-option-active',
                    onClicked(event) {
                        alert(event);
                    }
                },
                {
                    normal: 'scenario-minimize',
                    hover: 'scenario-minimize-hover',
                    active: 'scenario-minimize-active',
                    onClicked(event) {
                        alert(event);
                    }
                },
                {
                    normal: 'scenario-skip',
                    hover: 'scenario-skip-hover',
                    active: 'scenario-skip-active',
                    onClicked(event) {
                        alert(event);
                    }
                },
            ],

            twoChoices: [
                {
                    normal: 'quesion-ok',
                    hover: 'quesion-ok-hover',
                    active: 'quesion-ok-active',
                    onClicked() {
                        const pos = data.dialog.option.indexOf('〇');
                        if (pos === -1) {
                            if (confirm('終了しますか？')) {
                                window.close();
                            }
                        }
                        else {
                            if (pos < data.dialog.next.length) {
                                data.loadDialog(data.dialog.next[pos]);
                            }
                        }
                    }
                },
                {
                    normal: 'quesion-ng',
                    hover: 'quesion-ng-hover',
                    active: 'quesion-ng-active',
                    onClicked() {
                        const pos = data.dialog.option.indexOf('×');
                        if (pos === -1) {
                            if (confirm('終了しますか？')) {
                                window.close();
                            }
                        }
                        else {
                            if (pos < data.dialog.next.length) {
                                data.loadDialog(data.dialog.next[pos]);
                            }
                        }
                    }
                }
            ],

            fonts: Ciffon.FONTS,
            player: new Claire.Player(this.#config),
            widgetCatalog: new Ciffon.WidgetCatalog(this.#config),

            hasTwoChoiceOption: () => {
                return data.dialog && data.dialog.option && data.dialog.option.length == 2;
            },

            hasFourChoiceOption: () => {
                return data.dialog && data.dialog.option && data.dialog.option.length == 4;
            },

            onClicked: () => {
                if (data.dialog.next) {
                    data.loadDialog(data.dialog.next[0]);
                }
                else {
                    if (confirm('終了しますか？')) {
                        window.close();
                    }
                }
            },

            onClickIgnored: () => {},

            loadDialog: (dialog_id) => {
                const dialog = data.dialog = data.dialogs[dialog_id];

                if (data.erase) {
                    data.front = this.createCharacter();
                    data.back = this.createCharacter();
                }
                data.erase = 'erace' in dialog;

                if (data.frontCharacter !== (dialog.pos || null)) {
                    data.frontCharacter = (dialog.pos || null);

                    const tmp = data.front;
                    data.front = data.back;
                    data.back = tmp;
            
                    data.front.hasShadow = false;
                    data.back.hasShadow = true;
                };

                if ('char_id' in dialog) {
                    if (!(dialog.char_id in data.characters)) {
                        throw makeError(`Invalid character id: ${dialog.char_id}`);
                    }
                    const character = data.characters[dialog.char_id];

                    if (!('face' in dialog)) {
                        throw makeError('No face in the dialog but char_id');
                    }

                    if (!(dialog.face in character.face_rect)) {
                        throw makeError(`Invalid face name: ${dialog.face}`);
                    }

                    let position = null;
                    switch (data.frontCharacter) {
                    case '右側':
                        position = 'right';
                        data.front.flip = true;
                        break;
                    case '左側':
                        position = 'left';
                        data.front.flip = false;
                        break;
                    default:
                        throw makeError(`Invalid character position: ${data.frontCharacter}`);
                    }

                    data.front.character = character;
                    Nina.readAsImage(`${this.#config.data.texture.character}/${character.texture}`)
                    .then((img) => {
                        data.front.image = img;
                        this.updateCharacter(data.front, position);
                        return Nina.makeMaskImage(img);
                    }).then((mask) => {
                        data.front.shadow = mask;
                        this.#lilium.update();
                    }).catch(printStack);

                    data.front.face = dialog.face;
                    this.updateCharacter(data.front, position);
                    this.#lilium.update();
                }
                else {
                    data.front = this.createCharacter();
                }

                if ('bg_pic' in dialog) {
                    Nina.readAsImage(`${this.#config.data.texture.dialog}/${dialog.bg_pic}`).then((img) => {
                        data.background = img;
                        this.#lilium.update();
                    }).catch(printStack);
                }

                if ('name' in dialog) {
                    data.name.text = dialog.name
                    this.#lilium.update();
                }

                if ('talk' in dialog) {
                    data.talk.text = dialog.talk;
                    this.#lilium.update();
                }

                if ('bgm' in dialog) {
                    data.player.play('bgm0', dialog.bgm, true);
                }

                if ('voice' in dialog) {
                    data.player.play('voice0', dialog.voice, false);
                }
            }
        };
        return data;
    }

    createCharacter() {
        return {
            image: null,
            shadow: null,
            hasShadow: false,
            flip: false,
            character: null,
            face: null,
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

    /** @type {any} */
    #data = null;

    /** @type {Lilium} */
    #lilium = null;

    /** @type {Config} */
    #config = null;
}

/** @type {Replay} */
const replay = new Replay();
