/**
 * @file character-editor.js
 * @description Character data editor view
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import {
    Filesystem,
    mergeObject,
    printStack,
    MOUSE_BUTTON_PRIMARY,
    MOUSE_BUTTON_SECONDARY
} from '../blanc/lisette.js';
import * as Nina from '../valmir/nina.js';
import Adelite from '../sandica/adelite.js';

/**{
 * @typedef {{
 *     id: number,
 *     name: string,
 *     texture: string,
 *     body_rect: number[],
 *     face_rect: number[],
 * }} CharacterJson
 */
const template = {
    "div#character-select": {
        "select.select-character": {
            "on:change": "{{ onCharacterChanged(getAttribute('selectedIndex')) }}",
            "bind:selectedIndex": "{{ characterIndex }}",
            "option": {
                "forEach:character": "{{ characters }}",
                "bind:value": "{{ character.id }}",
                "bind:textContent": "{{ makeCharacterName(character) }}"
            }
        },
        "select.select-face": {
            "bind:selectedIndex": "{{ faceIndex }}",
            "on:change": "{{ onFaceChanged(getAttribute('selectedIndex')) }}",
            "option": {
                "forEach:face": "{{ faces }}",
                "bind:value": "{{ face }}",
                "bind:textContent": "{{ face }}"
            }
        }
    },
    "div.character-texture-setting p-q2": {
        "div.canvas-scaling": {
            "label": {
                "once:textContent": "スケール："
            },
            "button#scale-up-button": {
                "once:class": "frame-move-button",
                "once:textContent": "+",
                "on:click": "{{ renderer.scaleUp() }}"
            },
            "button#scale-down-button": {
                "once:class": "frame-move-button",
                "once:textContent": "-",
                "on:click": "{{ renderer.scaleDown() }}"
            },
            "button#scale-reset-button": {
                "once:class": "frame-move-button",
                "once:textContent": "1",
                "on:click": "{{ renderer.scaleReset() }}"
            }
        },
        "div.face-edge-control mt-q2": {
            "table.face-edge-control-table": {
                "tbody": {
                    "tr.face-edge-control-r1": {
                        "td.face-edge-control-c1": {},
                        "td.face-edge-control-c2": {},
                        "td.face-edge-control-c3": {
                            "button": {
                                "once:class": "frame-move-button frame-extend",
                                "once:textContent": "↑",
                                "on:click": "{{ updateFaceEdge(0, -1, 0, 1) }}"
                            }
                        },
                        "td.face-edge-control-c4": {},
                        "td.face-edge-control-c5": {}
                    },
                    "tr.face-edge-control-r2": {
                        "td.face-edge-control-c1": {},
                        "td.face-edge-control-c2 border-top border-left": {},
                        "td.face-edge-control-c3 border-top": {
                            "button": {
                                "once:class": "frame-move-button frame-narrow",
                                "once:textContent": "↓",
                                "on:click": "{{ updateFaceEdge(0, 1, 0, -1) }}"
                            }
                        },
                        "td.face-edge-control-c4 border-top border-right": {},
                        "td.face-edge-control-c5": {}
                    },
                    "tr.face-edge-control-r3": {
                        "td.face-edge-control-c1": {
                            "button": {
                                "once:class": "frame-move-button frame-extend",
                                "once:textContent": "←",
                                "on:click": "{{ updateFaceEdge(-1, 0, 1, 0) }}"
                            }
                        },
                        "td.face-edge-control-c2 border-left": {
                            "button": {
                                "once:class": "frame-move-button frame-narrow",
                                "once:textContent": "→",
                                "on:click": "{{ updateFaceEdge(1, 0, -1, 0) }}"
                            }
                        },
                        "td.face-edge-control-c3": {},
                        "td.face-edge-control-c4 border-right": {
                            "button": {
                                "once:class": "frame-move-button frame-narrow",
                                "once:textContent": "←",
                                "on:click": "{{ updateFaceEdge(0, 0, -1, 0) }}"
                            }
                        },
                        "td.face-edge-control-c5": {
                            "button": {
                                "once:class": "frame-move-button frame-extend",
                                "once:textContent": "→",
                                "on:click": "{{ updateFaceEdge(0, 0, 1, 0) }}"
                            }
                        }
                    },
                    "tr.face-edge-control-r4": {
                        "td.face-edge-control-c1": {},
                        "td.face-edge-control-c2 border-bottom border-left": {},
                        "td.face-edge-control-c3 border-bottom": {
                            "button": {
                                "once:class": "frame-move-button frame-narrow",
                                "once:textContent": "↑",
                                "on:click": "{{ updateFaceEdge(0, 0, 0, -1) }}"
                            }
                        },
                        "td.face-edge-control-c4 border-bottom border-right": {},
                        "td.face-edge-control-c5": {}
                    },
                    "tr.face-edge-control-r5": {
                        "td.face-edge-control-c1": {},
                        "td.face-edge-control-c2": {},
                        "td.face-edge-control-c3": {
                            "button": {
                                "once:class": "frame-move-button frame-extend",
                                "once:textContent": "↓",
                                "on:click": "{{ updateFaceEdge(0, 0, 0, 1) }}"
                            }
                        },
                        "td.face-edge-control-c4": {},
                        "td.face-edge-control-c5": {}
                    }
                }
            },
        },
        "div.face-destination-position mt-q2": {
            "label.face-position": {
                "once:textContent": "顔",
            },
            "div.face-oriented ml-q2": {
                "label": {
                    "once:textContent": "枠/点："
                },
                "input": {
                    "once:type": "checkbox",
                    "on:change": "{{ renderer.setFaceOriented(getAttribute('checked')) }}"
                }
            },
            "div#face-dst-position": {
                "once:class": "ml-q2",
                "forEach:dst": "{{ faceDstPositions }}",
                "label": {
                    "once:textContent": "{{ dst[0] }}"
                },
                "input.face-dst-position-size character-texture-size": {
                    "once:type": "number",
                    "bind:value": "{{ face.get(dst[1]) }}",
                    "on:change": "{{ face.set(dst[1], parseInt(getAttribute('value'))) }}",
                },
                "button.face-dst-position-sub": {
                    "once:type": "button",
                    "once:textContent": "+{{ dst[2] }}",
                    "on:click": "{{ face.set(dst[1], add(face.get(dst[1]), dst[2])) }}",
                },
                "button.face-dst-position-add": {
                    "once:type": "button",
                    "once:textContent": "-{{ dst[2] }}",
                    "on:click": "{{ face.set(dst[1], sub(face.get(dst[1]), dst[2])) }}",
                }
            },
        },
        "div.face-source-position mt-q2": {
            "label#face-emotion": {
                "once:textContent": "表情",
            },
            "div#face-src-position": {
                "once:class": "ml-q2",
                "forEach:src": "{{ faceSrcPositions }}",
                "label": {
                    "once:textContent": "{{ src[0] }}"
                },
                "input.face-src-position-size character-texture-size": {
                    "once:type": "number",
                    "bind:value": "{{ face.get(src[1]) }}",
                    "on:change": "{{ face.set(src[1], parseInt(getAttribute('value'))) }}",
                },
                "button.face-src-position-add": {
                    "once:type": "button",
                    "once:textContent": "+{{ src[2] }}",
                    "on:click": "{{ face.set(src[1], add(face.get(src[1]), src[2])) }}",
                },
                "button.face-src-position-sub": {
                    "once:type": "button",
                    "once:textContent": "-{{ src[2] }}",
                    "on:click": "{{ face.set(src[1], sub(face.get(src[1]), src[2])) }}",
                }
            }
        },
        "div.body-position mt-q2": {
            "label": {
                "once:textContent": "全身",
            },
            "div.body-position ml-q2": {
                "forEach:src": "{{ bodyPositions }}",
                "label": {
                    "once:textContent": "{{ src[0] }}"
                },
                "input.body-position-size character-texture-size": {
                    "once:type": "number",
                    "bind:value": "{{ body.get(src[1]) }}",
                    "on:change": "{{ body.set(src[1], parseInt(getAttribute('value'))) }}",
                },
                "button.body-position-add": {
                    "once:type": "button",
                    "once:textContent": "+{{ src[2] }}",
                    "on:click": "{{ body.set(src[1], add(body.get(src[1]), src[2])) }}",
                },
                "button.body-position-sub": {
                    "once:type": "button",
                    "once:textContent": "-{{ src[2] }}",
                    "on:click": "{{ body.set(src[1], sub(body.get(src[1]), src[2])) }}",
                }
            }
        },
        "button": {
            "once:class": "mt-q2",
            "once:textContent": "保存",
            "on:click": "{{ save() }}"
        }
    },
    "div#preview": {
        "once:class": "character-texture-preview",
        "canvas#character-texture-canvas": {
            "once:width": 2048,
            "once:height": 2048,
            "once:tabindex": 1,
            "on:mousedown": "{{ onMouseDown(event) }}",
            "on:mousemove": "{{ onMouseMove(event) }}",
            "on:keydown": "{{ onKeyDown(event) }}",
            "on:wheel": "{{ onWheel(event) }}",
        }
    }
};

export default class CharacterEditor {
    constructor(id, config) {
        this.#adelite = new Adelite(id, template);
        this.#config = config;

        this.face = {
            editor: this,

            get(index) {
                const currentCharacter = this.editor.#characters[this.editor.#characterIndex];
                const currentFace = this.editor.#faces[this.editor.#faceIndex];        
                if (currentCharacter && currentFace) {
                    return currentCharacter.face_rect[currentFace][index];
                }
                return 0;
            },
            set(index, value) {
                const currentCharacter = this.editor.#characters[this.editor.#characterIndex];
                const currentFace = this.editor.#faces[this.editor.#faceIndex];        
                if (currentCharacter && currentFace) {
                    currentCharacter.face_rect[currentFace][index] = value;
                    this.editor.updateFace();
                }
            }
        };

        this.body = {
            editor: this,

            get(index) {
                const currentCharacter = this.editor.#characters[this.editor.#characterIndex];
                if (currentCharacter) {
                    return currentCharacter.body_rect[index];
                }
                return 0;
            },
            set(index, value) {
                const currentCharacter = this.editor.#characters[this.editor.#characterIndex];
                if (currentCharacter) {
                    currentCharacter.body_rect[index] = value;
                    console.log(currentCharacter);
                    this.editor.updateBody();
                }
            }
        };

        window.addEventListener('mouseup', (event) => this.onMouseUp(event));
        window.addEventListener('paste', (event) => this.onPaste(event));
    }

    show() {
        this.#adelite.show(this).then(() => {
            this.#renderer = new CharacterTestRenderer(this.#adelite.getElementById('character-texture-canvas'), this.#config);
            this.onCharacterChanged(this.#characterIndex);
        });

        Promise.all(Array.from(this.#config.json.character, (x) => Filesystem.readJsonFile(x)))
        .then((jsons) => {
            this.#characters = [];
            const characters = mergeObject(jsons);
            for (const key of Object.keys(characters)) {
                this.#characters.push(characters[key]);
            }
            this.onCharacterChanged(this.#characterIndex);
        })
        .catch(printStack);

    }

    destroy() {
        this.#adelite.destroy();
        this.#renderer = null;
        this.#holdOrigin = null;
    }

    makeCharacterName(character) {
        let name = character.name;

        const noOrInitialBodyPosition = character.body_rect.length !== 4
            || JSON.stringify(character.body_rect) == JSON.stringify(CharacterEditor.INITIAL_BODY_POSITION);

        let remaining_faces = 0;
        for (const face in character.face_rect) {
            const noOrInitialFacePosition = character.face_rect[face].length !== 6 
                || JSON.stringify(character.face_rect[face]) === JSON.stringify(CharacterEditor.INITIAL_FACE_POSITION);
            remaining_faces += (noOrInitialFacePosition ? 1 : 0);
        }

        if (noOrInitialBodyPosition || remaining_faces) {
            if (noOrInitialBodyPosition && remaining_faces) {
                name = '[×] ' + name;
            }
            else {
                name = '[△] ' + name;
            }
            name += '(';
            name += '身体：' + (noOrInitialBodyPosition ? '未' : '完');
            name += ', 表情：' + (remaining_faces ? '残' + remaining_faces : '完');
            name += ')';
        }
        else if (!noOrInitialBodyPosition && !remaining_faces) {
            name = '[〇] ' + name;
        }

        return name;  
    }

    onCharacterChanged(index) {
        this.#characterIndex = index;
        const currentCharacter = this.#characters[this.#characterIndex];
        this.#renderer.setCharacter(currentCharacter.texture);
        this.#faces = Object.keys(currentCharacter.face_rect);

        const currentFace = this.#faces[this.#faceIndex];

        if (currentCharacter.face_rect[currentFace].length == 0) { 
            currentCharacter.face_rect[currentFace] = CharacterEditor.INITIAL_FACE_POSITION.slice();
        }
        this.updateFace();

        if (currentCharacter.body_rect.length == 0) { 
            currentCharacter.body_rect = CharacterEditor.INITIAL_BODY_POSITION.slice();
        }
        this.updateBody();
    }

    onFaceChanged(index) {
        const currentCharacter = this.#characters[this.#characterIndex];
        const oldValues = currentCharacter.face_rect[this.#faces[this.#faceIndex]].slice();

        this.#faceIndex = index;
        const currentFace = this.#faces[this.#faceIndex];

        if (currentCharacter.face_rect[currentFace].length == 0) {
            currentCharacter.face_rect[currentFace] = oldValues;
        }
        if (currentCharacter.face_rect[currentFace].length == 0) {
            currentCharacter.face_rect[currentFace] = CharacterEditor.INITIAL_FACE_POSITION.slice();
        }
        this.updateFace();
    }

    ensureRect(rect, alt) {
        const ret = [];
        for (let i = 0; i < alt.length; ++i) {
            ret.push((i < rect.length ? rect[i] : 0) || alt[i])
        }
        return ret;
    }

    updateFaceEdge(dx, dy, dw, dh) {
        const currentCharacter = this.#characters[this.#characterIndex];
        const currentFace = this.#faces[this.#faceIndex];
        const face_rect = currentCharacter.face_rect[currentFace];

        face_rect[0] += dx;
        face_rect[1] += dy;
        face_rect[2] += dx;
        face_rect[3] += dy;
        face_rect[4] += dw;
        face_rect[5] += dh;

        this.updateFace();
    }

    updateBody() {
        this.#renderer.setBody(this.#characters[this.#characterIndex].body_rect);
        this.#adelite.update();
    }

    updateFace() {
        const currentCharacter = this.#characters[this.#characterIndex];
        const currentFace = this.#faces[this.#faceIndex];

        this.#renderer.setFace(currentCharacter.face_rect[currentFace]);
        this.#adelite.update();
    }

    save() {
        const currentCharacter = this.#characters[this.#characterIndex];
        const json = {};
        json[currentCharacter.id] = currentCharacter;

        const downLoadLink = document.createElement('a');
        downLoadLink.download = currentCharacter.id + ".json";
        downLoadLink.href = URL.createObjectURL(new Blob([  JSON.stringify(json, undefined, 2) ], {type: 'text/plain'}));
        downLoadLink.dataset.downloadurl = ["text/plain", downLoadLink.download, downLoadLink.href].join(":");
        downLoadLink.click();
        setTimeout(function() {
            URL.revokeObjectURL(downLoadLink.href);
        }, 60000);
    }

    /**
     * mouse down event
     * @param {MouseEvent} e 
     */
    onMouseDown(e) {
        if (e.button != MOUSE_BUTTON_PRIMARY) {
            return ;
        }

        const currentCharacter = this.#characters[this.#characterIndex];
        const currentFace = this.#faces[this.#faceIndex];

        const tmp = new HoldObject(this.#renderer);
        const body_rect = currentCharacter.body_rect;
        const face_rect = currentCharacter.face_rect[currentFace];
        const example_rect = this.#renderer.getExample();

        if (tmp.start(e, { x: face_rect[0], y: face_rect[1], w: face_rect[4], h: face_rect[5] })) {
            const x = face_rect[0];
            const y = face_rect[1];
            tmp.setEventListener({
                mouseMove: (dx, dy) => {
                    face_rect[0] = x + dx;
                    face_rect[1] = y + dy;
                    this.#renderer.setFace(face_rect);
                    this.updateFace();
                },
                arrowKey: (dx, dy) => {
                    face_rect[0] += dx;
                    face_rect[1] += dy;
                    this.#renderer.setFace(face_rect);
                    this.updateFace();
                },
            });
        }
        else if (tmp.start(e, { x: face_rect[2], y: face_rect[3], w: face_rect[4], h: face_rect[5] })) {
            const x = face_rect[2];
            const y = face_rect[3];
            tmp.setEventListener({
                mouseMove: (dx, dy) => {
                    face_rect[2] = x + dx;
                    face_rect[3] = y + dy;
                    this.#renderer.setFace(face_rect);
                    this.updateFace();
                },
                arrowKey: (dx, dy) => {
                    face_rect[2] += dx;
                    face_rect[3] += dy;
                    this.#renderer.setFace(face_rect);
                    this.updateFace();
                },
            });
        }
        else if (example_rect && tmp.start(e, example_rect)) {
            tmp.setEventListener({
                mouseMove: (dx, dy) => {
                    this.#renderer.setExample(example_rect.x + dx, example_rect.y + dy);
                    this.updateBody();
                },
                arrowKey: (dx, dy) => {
                    const rect = this.#renderer.getExample();
                    this.#renderer.setExample(rect.x + dx, rect.y + dy);
                    this.updateBody();
                },
            });
        }
        else if (tmp.start(e, { x: body_rect[0], y: body_rect[1], w: body_rect[2], h: body_rect[3] })) {
            const x = body_rect[0];
            const y = body_rect[1];
            tmp.setEventListener({
                mouseMove: (dx, dy) => {
                    body_rect[0] = x + dx;
                    body_rect[1] = y + dy;
                    this.updateBody();
                },
                arrowKey: (dx, dy) => {
                    body_rect[0] += dx;
                    body_rect[1] += dy;
                    this.updateBody();
                },
            });
        }
        else {
            const preview = this.#adelite.getElementById('preview');
            let previewTop = parseInt(preview.style.top) | 0;
            let previewLeft = parseInt(preview.style.left) | 0;
            tmp.start(e, { x: 0, y: 0, w: 2048, h: 2048 });
            tmp.setEventListener({
                mouseMove(dx, dy) {
                    previewTop += dy;
                    previewLeft += dx;
                    preview.style.top = previewTop + 'px';
                    preview.style.left = previewLeft + 'px';
                },
                arrowKey(dx, dy) {
                    console.log(previewTop, previewLeft, dx, dy);
                    previewTop += dy;
                    previewLeft += dx;
                    preview.style.top = previewTop + 'px';
                    preview.style.left = previewLeft + 'px';
                },
            });
        }

        this.#holdOrigin = tmp;
    }

    /**
     * マウスハンドラ
     * @param {MouseEvent} e
     */
    onMouseMove(e) {
        if (this.#holdOrigin) {
            this.#holdOrigin.onMouseMove(e);
        }
    }

    /**
     * mouse up evemt
     * @param {MouseEvent} e 
     */
    onMouseUp(e) {
        switch (e.button) {
        case MOUSE_BUTTON_PRIMARY:
            if (this.#holdOrigin) {
                this.#holdOrigin.stop();
            }
            break;
        case MOUSE_BUTTON_SECONDARY:
            const scale = this.#renderer.getScale();
            this.#renderer.setGuide(e.offsetX / scale | 0, e.offsetY / scale | 0);
            this.#renderer.update();
            break;
        }
    }

    /**
     * mouse wheel event
     * @param {WheelEvent} e 
     */
    onWheel(e) {
        if (e.deltaY < 0) {
            this.#renderer.scaleUp();
            e.preventDefault();
        }
        else if (0 < e.deltaY) {
            this.#renderer.scaleDown();
            e.preventDefault();
        }
    }

    /**
     * paste event
     * @param {Event} e 
     */
    onPaste(e) {
        if (this.#renderer && e instanceof ClipboardEvent) {
            Nina.readAsImageFromClipboard(e).then((img) => {
                this.#renderer.setExample(0, 0, img);
                this.#renderer.update();
            }).catch(printStack);
        }
    }

    onKeyDown(e) {
        switch (e.key) {
        case "ArrowLeft":
            if (this.#holdOrigin) {
                this.#holdOrigin.onArrowKey(-1, 0);
                e.preventDefault();
            }
            break;
        case "ArrowRight":
            if (this.#holdOrigin) {
                this.#holdOrigin.onArrowKey(1, 0);
                e.preventDefault();
            }
            break;
        case "ArrowUp":
            if (this.#holdOrigin) {
                this.#holdOrigin.onArrowKey(0, -1);
                e.preventDefault();
            }
            break;
        case "ArrowDown":
            if (this.#holdOrigin) {
                this.#holdOrigin.onArrowKey(0, 1);
                e.preventDefault();
            }
            break;
        case "c":
            if (this.#characterIndex + 1 < this.#characters.length) {
                this.onCharacterChanged(this.#characterIndex + 1);
            }
            break;
        case "C":
            if (0 < this.#characterIndex) {
                this.onCharacterChanged(this.#characterIndex - 1);
            }
            break;
        case "f":
            if (this.#faceIndex + 1 < this.#faces.length) {
                this.onFaceChanged(this.#faceIndex + 1);
            }
            break;
        case "F":
            if (0 < this.#faceIndex) {
                this.onFaceChanged(this.#faceIndex - 1);
            }
            break;
        }
    }

    get renderer() {
        return this.#renderer;
    }

    get faceDstPositions() {
        return this.#faceDstPositions;
    }

    get faceSrcPositions() {
        return this.#faceSrcPositions;
    }

    get bodyPositions() {
        return this.#bodyPositions;
    }

    get characterIndex() {
        return this.#characterIndex;
    }

    get faceIndex() {
        return this.#faceIndex;
    }

    get characters() {
        return this.#characters;
    }

    get faces() {
        return this.#faces;
    }

    static INITIAL_FACE_POSITION = [0, 0, 100, 0, 100, 100];
    static INITIAL_BODY_POSITION = [200, 0, 100, 100];

    #faceDstPositions = [
        [ 'X:', 0, 50 ],
        [ 'Y:', 1, 50 ]
    ];

    #faceSrcPositions = [
        [ 'X:', 2, 50 ],
        [ 'Y:', 3, 50 ],
        [ 'W:', 4, 10 ],
        [ 'H:', 5, 10 ]
    ];

    #bodyPositions = [
        [ 'X:', 0, 50 ],
        [ 'Y:', 1, 50 ],
        [ 'W:', 2, 50 ],
        [ 'H:', 3, 50 ]
    ];

    /** @type {CharacterTestRenderer} */
    #renderer = null;

    /** @type {Adelite} */
    #adelite = null;

    /** @type {Object} */
    #config = null;

    /** @type {CharacterJson[]} */
    #characters = [];

    /** @type {string[]} */
    #faces = [];

    #characterIndex = 0;
    #faceIndex = 0;

    /** @type {HoldObject} */
    #holdOrigin = null;
}

/**
 * CharacterTestRenderer
 */
class CharacterTestRenderer {
    /**
     * 
     * @param {HTMLCanvasElement} canvas 
     * @param {Object} config 
     */
    constructor(canvas, config) {
        this.#config = config;
        this.#canvas = canvas;
        this.#ctx = canvas.getContext('2d');
        this.#example = {
            x: null,
            y: null,
            image: null,
        }
        this.#image = new Image();
        this.#image.addEventListener('load', () => this.update());
    }

    drawDot(rect, color, size=2) {
        if (rect) {
            const x = rect['x'] + rect['w'] / 2 | 0;
            const y = rect['y'] + rect['h'] / 2 | 0;
            this.#ctx.beginPath();
            this.#ctx.moveTo(x - size, y);
            this.#ctx.lineTo(x + size, y);
            this.#ctx.moveTo(x, y - size);
            this.#ctx.lineTo(x, y + size);
            this.#ctx.closePath();
            this.#ctx.lineWidth = 1;
            this.#ctx.strokeStyle = color;
            this.#ctx.stroke();
        }
    }

    drawRect(rect, color) {
        if (rect) {
            const x1 = rect['x'];
            const y1 = rect['y'];
            const x2 = x1 + rect['w'] - 1;
            const y2 = y1 + rect['h'] - 1;
            this.#ctx.beginPath();
            this.#ctx.moveTo(x1, y1);
            this.#ctx.lineTo(x1, y2);
            this.#ctx.lineTo(x2, y2);
            this.#ctx.lineTo(x2, y1);
            this.#ctx.lineTo(x1, y1);
            this.#ctx.closePath();
            this.#ctx.lineWidth = 1;
            this.#ctx.strokeStyle = color;
            this.#ctx.stroke();
        }
    }

    drawGrid(interval, color) {
            this.#ctx.beginPath();
            for (let x = 0; x < this.#canvas.width; x += interval) {
                this.#ctx.moveTo(x, 0);
                this.#ctx.lineTo(x, this.#canvas.height);
            }
            for (let y = 0; y < this.#canvas.height; y += interval) {
                this.#ctx.moveTo(0, y);
                this.#ctx.lineTo(this.#canvas.width, y);
            }
            this.#ctx.closePath();
            this.#ctx.lineWidth = 3;
            this.#ctx.strokeStyle = color;
            this.#ctx.stroke();
    }

    update() {
        if (this.#image) {
            const size = 2048 * this.#scale | 0;
            if (this.#canvas.width != size) {
                this.#canvas.width = size;
            }

            if (this.#canvas.height != size) {
                this.#canvas.height = size;
            }

            this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);

            this.#ctx.scale(this.#scale, this.#scale);

            this.drawGrid(100, '#808080');

            this.#ctx.drawImage(this.#image, 0, 0);

            if (this.#face_rect) {
                this.#ctx.drawImage(this.#image,
                    this.#face_rect['srcx'], this.#face_rect['srcy'], this.#face_rect['w'], this.#face_rect['h'],
                    this.#face_rect['dstx'], this.#face_rect['dsty'], this.#face_rect['w'], this.#face_rect['h']);

                const src_rect = {
                    x: this.#face_rect['srcx'],
                    y: this.#face_rect['srcy'],
                    w: this.#face_rect['w'],
                    h: this.#face_rect['h']
                };

                const dst_rect = {
                    x: this.#face_rect['dstx'],
                    y: this.#face_rect['dsty'],
                    w: this.#face_rect['w'],
                    h: this.#face_rect['h']
                };

                if (this.#face_oriented) {
                    this.drawDot(dst_rect, 'rgb(255, 0, 0)');
                    this.drawDot(src_rect, 'rgb(0, 0, 255)');
                }
                else {
                    this.drawRect(dst_rect, 'rgb(255, 0, 0)');
                    this.drawRect(src_rect, 'rgb(0, 0, 255)');
                }

                if (this.#example.image) {
                    this.#ctx.save();
                    this.#ctx.globalAlpha = 0.5;
                    this.#ctx.drawImage(this.#example.image, this.#example.x, this.#example.y);
                    this.#ctx.restore();
                }

                if (this.#guide) {
                    this.drawDot({
                        x: this.#face_rect.srcx + this.#guide.x,
                        y: this.#face_rect.srcy + this.#guide.y,
                        w: 0,
                        h: 0
                    }, 'rgb(255, 0, 255)');

                    this.drawDot({
                        x: this.#face_rect.dstx + this.#guide.x,
                        y: this.#face_rect.dsty + this.#guide.y,
                        w: 0,
                        h: 0
                    }, 'rgb(255, 0, 255)');
                }
            }

            if (this.#body_rect) {
                this.drawRect(this.#body_rect, 'rgb(0, 255, 0)');
            }

            this.#ctx.resetTransform();
        }
    };

    setCharacter(path) {
        if (this.#path == path) {
            console.log('skip', path);
        }
        else {
            this.#path = path;
            Nina.readAsImage(this.#config.data.texture.character + '/' + path)
                .then((img) => { 
                    this.#image = img;
                    this.update();
                })
                .catch(printStack);
        }
    };

    setFace(rect, keep_guide=false) {
        if (rect.length == 6) {
            const old_face = this.#face_rect;
            this.#face_rect = {
                dstx: rect[0],
                dsty: rect[1],
                srcx: rect[2],
                srcy: rect[3],
                w: rect[4],
                h: rect[5],
            };
            if (this.#guide && old_face) {
                if (keep_guide || this.#face_rect.w != old_face.w) {
                    this.#guide.x = (old_face.dstx + this.#guide.x) - this.#face_rect.dstx;
                }
                if (keep_guide || this.#face_rect.h != old_face.h) {
                    this.#guide.y = (old_face.dsty + this.#guide.y) - this.#face_rect.dsty;
                }
            }
            this.update();
        }
    };

    setBody(rect) {
        if (rect.length == 4) {
            this.#body_rect = {
                x: rect[0],
                y: rect[1],
                w: rect[2],
                h: rect[3],
            };
            this.update();
        }
    };

    setFaceOriented(face_oriented) {
        this.#face_oriented = face_oriented;
        this.update();
    };

    getScale() {
        return this.#scale;
    };

    scaleUp() {
        this.#scale += (Math.max(10, this.#scale * 10) | 0) / 100.0;
        this.#scale = Math.min(this.#scale, 4.0);
        this.update();
    };

    scaleDown() {
        this.#scale = (Math.max(10, this.#scale * 90) | 0) / 100.0;
        this.update();
    };

    scaleReset() {
        this.#scale = 1.0;
        this.update();
    };

    setGuide(x, y) {
        if (this.#face_rect) {
            this.#guide = {
                x: x - this.#face_rect.dstx,
                y: y - this.#face_rect.dsty
            };
        }
    };

    getExample(x, y, image) {
        if (this.#example.image) {
            return {
                x: this.#example.x,
                y: this.#example.y,
                w: this.#example.image.width,
                h: this.#example.image.height
            };
        }
        return null;
    };

    setExample(x, y, image) {
        this.#example.x = x;
        this.#example.y = y;
        if (image) {
            this.#example.image = image;
        }
    }

    #config = null;
    #canvas = null;
    #ctx = null;
    #path = null;
    #image = null;
    #face_rect = null;
    #body_rect = null;
    #guide = null;
    #example = null;
    #face_oriented = false;
    #scale = 1.0;
}

/**
 * Object holded by pointer
 */
class HoldObject {
    /**
     * @param {CharacterTestRenderer} renderer 
     */
    constructor(renderer) {
        this.#renderer = renderer;
    }

    start(e, rect) {
        this.#position = {
            x: e.offsetX,
            y: e.offsetY,
        };

        const scale = this.#renderer.getScale();
        this.#isStarted = rect.x <= this.#position.x / scale
            && this.#position.x / scale < rect.x + rect.w
            && rect.y <= this.#position.y / scale 
            && this.#position.y / scale < rect.y + rect.h;

        return this.#isStarted;
    }

    stop() {
        this.#isStarted = false;
    }

    onArrowKey(dx, dy) {
        if (this.#eventListener) {
            this.#eventListener.arrowKey(dx, dy);
        }
    }

    onMouseMove(e) {
        if (this.#isStarted && this.#eventListener) {
            var scale = this.#renderer.getScale();
            this.#eventListener.mouseMove(
                (e.offsetX - this.#position.x) / scale | 0,
                (e.offsetY - this.#position.y) / scale | 0);
        }
    }

    setEventListener(listener) {
        this.#eventListener = listener;
    }

    /**
     * @type {{
     *     x: number,
     *     y: number
     * }}
     */
    #position = null;

    /** @type {CharacterTestRenderer} */
    #renderer = null;

    /**
     * @type {{
     *     arrowKey: function(number, number): void,
     *     mouseMove: function(number, number): void
     * }}
     */
    #eventListener = null;

    /** @type {boolean} */
    #isStarted = false;
}
