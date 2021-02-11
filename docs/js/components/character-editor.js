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
    MOUSE_BUTTON_SECONDARY,
    sortCharacter,
    saveURLAsFile,
    IPC,
    onTimeout,
    getScreenSourceID,
} from '../blanc/lisette.js';
import * as Nina from '../valmir/nina.js';
import Adelite from '../sandica/adelite.js';

const CANVAS_SIZE = 2048;

/**{
 * @typedef {{
 *     id: number,
 *     name: string,
 *     texture: string,
 *     body_rect: number[],
 *     face_rect: Object.<string, number[]>,
 * }} CharacterJson
 */
const template = {
    "div.character-select": {
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
        },
        "label": {
            "bind:textContent": "{{ completedCharacters }}キャラ"
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
            "div.ml-q2": {
                "label": {
                    "once:textContent": "固定："
                },
                "input": {
                    "once:type": "checkbox",
                    "bind:value": "{{ isBodyRectFixed }}",
                    "on:change": "{{ fixBodyRect(getAttribute('checked')) }}",
                },
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
        "div": {
            "once:class": "mt-q2",
            "button#saveButton": {
                "once:class": "mr-q2",
                "once:textContent": "保存",
                "on:click": "{{ onSaveClicked() }}"
            }
        },
        "div#automation": {
            "button#recognitionButton": {
                "once:class": "mr-q2",
                "once:textContent": "ガイド",
                "on:click": "{{ onRecognitionClicked() }}"
            },
            "button#positionAdjustmentButton": {
                "once:class": "mr-q2",
                "once:textContent": "表情",
                "on:click": "{{ onFaceAdjustmentClicked() }}"    
            },
            "button#frameAdjustmentButton": {
                "once:textContent": "身体",
                "on:click": "{{ onBodyAdjustmentClicked() }}"

            }
        }
    },
    "div#preview": {
        "once:class": "character-texture-preview",
        "canvas#character-texture-canvas": {
            "once:width": CANVAS_SIZE,
            "once:height": CANVAS_SIZE,
            "once:tabindex": 1,
            "on:mousedown": "{{ onMouseDown(event) }}",
            "on:mousemove": "{{ onMouseMove(event) }}",
            "on:wheel": "{{ onWheel(event) }}",
            "on:dblclick": "{{ onDoubleClick(event) }}"
        }
    }
};

/**
 * compare 2 images and calculate difference score
 * @param {Nina.LumaData} lower 
 * @param {Nina.LumaData} upper 
 */
function calcScore(lower, upper) {
    const threshold = 9;
    let score = 0;
    if (lower.data.byteLength === upper.data.byteLength) {
        let i = lower.data.byteLength | 0;
        while (i & 0x1f) {
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
        }
        while (i) {
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);

            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);

            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);

            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
            score += (Math.abs(lower.data[i] - upper.data[i--]) < threshold ? (255 - upper.data[i]) : 0);
        }
    }
    return -score;
}

/**
 * estimate and fix pasted face example position
 * @param {Nina.LumaData} sample 
 * @param {Nina.LumaData} texture
 * @param {Nina.Rect} rect 
 */
function estimatePosition(sample, texture, rect) {
    const range = 20;

    /*
     * best estimated position and score
    */
    let best = {
        pos: rect,
        image: null,
        score: null,
    };
    best.image = texture.subimage(best.pos.x, best.pos.y, best.pos.w, best.pos.h);
    best.score = calcScore(sample, best.image);

    const nexts = [];
    for (let dx = -range; dx <= range; ++dx) {
        for (let dy = -range; dy <= range; ++dy) {
            if (dx !== 0 || dy !== 0) {
                nexts.push({ dx, dy });
            }
        }
    }

    /*
     * search best estimated position
     */
    const prev = best.pos;
    for (const next of nexts) {
        const pos = {
            x: prev.x + next.dx,
            y: prev.y + next.dy,
            w: prev.w,
            h: prev.h,
        };
        const image = texture.subimage(pos.x, pos.y, pos.w, pos.h);
        const score = calcScore(sample, image);
        if (score < best.score) {
            best = {
                pos,
                image,
                score,
            };
        }

    }

    return best;
}

/**
 * shrink or maximize rectangle
 * @param {Nina.DrawableElement} texture
 * @param {Nina.Rect} rect 
 * @returns {Nina.Rect}
 */
function adjustRect(texture, rect) {
    rect = Object.create(rect);

    /**
     * calculate transparent score
     * @param {Nina.Rect} line 
     */
    const calcTransparentScore = (line) => {
        const imageData = Nina.getImageData(texture, line);
        let count = 0;
        for (let i = imageData.data.byteLength; i;) {
            i -= 4;
            count += imageData.data[i + 3];
        }
        return count / (imageData.data.byteLength * 255 / 4);
    }

    const best = {
        top: {
            line: 0,
            makeLine() {
                return { x: rect.x, y: rect.y, w: rect.w, h: 1 };
            }
        },
        bottom: {
            line: 0,
            makeLine() {
                return { x: rect.x, y: rect.y + rect.h - 1, w: rect.w, h: 1 };
            }
        },
        left: {
            line: 0,
            makeLine() {
                return { x: rect.x, y: rect.y, w: 1, h: rect.h };
            }
        },
        right: {
            line: 0,
            makeLine() {
                return { x: rect.x + rect.w - 1, y: rect.y, w: 1, h: rect.h };
            }
        }
    };

    while (true) {
        /* calculate transparency score */
        for (const key in best) {
            const score = calcTransparentScore(best[key].makeLine());
            best[key].line = 0.01 < score ? 1 : 0;
        }

        /* check updated */
        let updated = false;
        for (const key in best) {
            updated = updated || (best[key].line !== 0);
        }

        if (updated) {
            rect = {
                x: rect.x - best.left.line,
                y: rect.y - best.top.line,
                w: rect.w + best.right.line + best.left.line,
                h: rect.h + best.bottom.line + best.top.line,
            };
        }
        else {
            break;
        }
    }

    return rect;
}

/**
 * count character setting tasks we should do
 * @param {CharacterJson} character 
 */
function countTasks(character) {
    const noOrInitialBodyPosition = character.body_rect.length !== 4
        || JSON.stringify(character.body_rect) == JSON.stringify(CharacterEditor.INITIAL_BODY_POSITION);

    let remainingFaces = 0;
    for (const face in character.face_rect) {
        const noOrInitialFacePosition = character.face_rect[face].length !== 6 
            || JSON.stringify(character.face_rect[face]) === JSON.stringify(CharacterEditor.INITIAL_FACE_POSITION);
        remainingFaces += (noOrInitialFacePosition ? 1 : 0);
    }

    return {
        body: noOrInitialBodyPosition ? 1 : 0,
        face: remainingFaces
    };
}

/**
 * @typedef {{
 *     preview: HTMLDivElement,
 *     renderer: CharacterTestRenderer,
 *     faceDstPositions: (string | number)[][],
 *     faceSrcPositions: (string | number)[][],
 *     bodyPositions: (string | number)[][],
 *     characters: CharacterJson[],
 *     faces: string[],
 *     characterIndex: number,
 *     faceIndex: number,
 *     holdOrigin: HoldObject,
 *     face: {
 *         get: function(number): number,
 *         set: function(number, number): void
 *     },
 *     body: {
 *         get: function(number): number,
 *         set: function(number, number): void
 *     },
 *     currentCharacter: CharacterJson,
 *     currentFace: string,
 *     isBodyRectFixed: boolean,
 *     completedCharacters: number,
 *     mediaSourceId: number,
 *     makeCharacterName: function(CharacterJson): string,
 *     updateFaceEdge: function(number, number, number, number): void,
 *     fixBodyRect: function(boolean): void,
 *     onCharacterChanged: function(number): void,
 *     onFaceChanged: function(number): void,
 *     onMouseDown: function(MouseEvent): void,
 *     onMouseMove: function(MouseEvent): void,
 *     onWheel: function(WheelEvent): void,
 *     onDoubleClick: function(): void,
 *     onSaveClicked: function(): void,
 *     onRecognitionClicked: () => void,
 *     onFaceAdjustmentClicked: () => void,
 *     onBodyAdjustmentClicked: () => void,
 *     onWindowKeyDown: function(KeyboardEvent): void,
 *     onWindowMouseUp: function(MouseEvent): void,
 *     onWindowPaste: function(Event): void,
 *     onBackgroundDoubleClick: function(): void,
 * }} Data
 */

/**
 * @param {CharacterEditor} characterEditor
 * @returns {Data}
 */
function createData(characterEditor) {
    /** @type {Data} */
    const data = {
        preview: null,
        renderer: null, 
        faceDstPositions: [
            [ 'X:', 0, 50 ],
            [ 'Y:', 1, 50 ]
        ],
        faceSrcPositions: [
            [ 'X:', 2, 50 ],
            [ 'Y:', 3, 50 ],
            [ 'W:', 4, 10 ],
            [ 'H:', 5, 10 ]
        ],
        bodyPositions: [
            [ 'X:', 0, 50 ],
            [ 'Y:', 1, 50 ],
            [ 'W:', 2, 50 ],
            [ 'H:', 3, 50 ]
        ],
        characters: [],
        faces: [],
        characterIndex: 0,
        faceIndex: 0,
        holdOrigin: null,

        face: {
            get(index) {
                try {
                    return data.currentCharacter.face_rect[data.currentFace][index];
                }
                catch {
                    return 0;
                }
            },
            set(index, value) {
                data.currentCharacter.face_rect[data.currentFace][index] = value;
                characterEditor.updateFace();
            }
        },

        body: {
            get(index) {
                try {
                    return data.currentCharacter.body_rect[index];
                }
                catch {
                    return 0;
                }
            },
            set(index, value) {
                data.currentCharacter.body_rect[index] = value;
                characterEditor.updateBody();
            }
        },

        isBodyRectFixed: false,
        completedCharacters: 0,
        mediaSourceId: null,

        get currentCharacter() {
            return data.characters[data.characterIndex];
        },

        get currentFace() {
            return data.faces[data.faceIndex];
        },

        makeCharacterName(character) {
            const tasks = countTasks(character);
            let name = character.name;
            if (0 < tasks.body + tasks.face) {
                if (tasks.body && tasks.face) {
                    name = `[×] ${name}`;
                }
                else {
                    name = `[△] ${name}`;
                }
                name += `(身体：${tasks.body ? '未' : '完'}, 表情：${tasks.face ? `残${tasks.face}` : '完'})`;
            }
            else {
                name = `[〇] ${name}`;
            }
    
            return name;  
        },

        updateFaceEdge(dx, dy, dw, dh) {
            const face_rect = data.currentCharacter.face_rect[data.currentFace];
            face_rect[0] += dx;
            face_rect[1] += dy;
            face_rect[2] += dx;
            face_rect[3] += dy;
            face_rect[4] += dw;
            face_rect[5] += dh;    
            characterEditor.updateFace();
        },

        fixBodyRect(fixed) {
            data.isBodyRectFixed = fixed;
        },

        onCharacterChanged(index) {
            data.characterIndex = index;
            data.renderer.setCharacter(data.currentCharacter.texture);
            data.faces = Object.keys(data.currentCharacter.face_rect);
        
            if (data.currentCharacter.face_rect[data.currentFace].length == 0) { 
                data.currentCharacter.face_rect[data.currentFace] =
                    CharacterEditor.INITIAL_FACE_POSITION.slice();
            }
            characterEditor.updateFace();
    
            if (data.currentCharacter.body_rect.length == 0) { 
                data.currentCharacter.body_rect = CharacterEditor.INITIAL_BODY_POSITION.slice();
            }
            characterEditor.updateBody();
        },
    
        onFaceChanged(index) {
            const oldValues = data.currentCharacter.face_rect[data.currentFace].slice();
            data.faceIndex = index;
            if (data.currentCharacter.face_rect[data.currentFace].length == 0) {
                data.currentCharacter.face_rect[data.currentFace] = oldValues;
            }
            if (data.currentCharacter.face_rect[data.currentFace].length == 0) {
                data.currentCharacter.face_rect[data.currentFace] =
                    CharacterEditor.INITIAL_FACE_POSITION.slice();
            }
            characterEditor.updateFace();
        },

        /**
         * mouse down event
         */
        onMouseDown(e) {
            if (e.button !== MOUSE_BUTTON_PRIMARY) {
                return ;
            }

            const tmp = new HoldObject(data.renderer);
            const body_rect = data.currentCharacter.body_rect;
            const face_rect = data.currentCharacter.face_rect[data.currentFace];

            const makeFaceHandler = (x, y, w, h) => {
                return {
                    rect: { x: face_rect[x], y: face_rect[y], w: face_rect[w], h: face_rect[h] },
                    mouseMove(dx, dy) {
                        face_rect[x] = this.rect.x + dx / data.renderer.getScale() | 0;
                        face_rect[y] = this.rect.y + dy / data.renderer.getScale() | 0;
                        data.renderer.setFace(data.currentCharacter.face_rect, data.faces[data.faceIndex]);
                        characterEditor.updateFace();
                    },
                    arrowKey: (dx, dy) => {
                        face_rect[x] += dx;
                        face_rect[y] += dy;
                        data.renderer.setFace(data.currentCharacter.face_rect, data.faces[data.faceIndex]);
                        characterEditor.updateFace();
                    }
                }
            };
    
            const handlers = [
                makeFaceHandler(0, 1, 4, 5),
                makeFaceHandler(2, 3, 4, 5),
                {
                    rect: data.renderer.getExample() ? data.renderer.getExample().rect : null,
                    mouseMove(dx, dy) {
                        data.renderer.setExample(
                            this.rect.x + dx / data.renderer.getScale() | 0,
                            this.rect.y + dy / data.renderer.getScale() | 0);
                        characterEditor.updateBody();
                    },
                    arrowKey(dx, dy) {
                        const rect = data.renderer.getExample().rect;
                        data.renderer.setExample(rect.x + dx, rect.y + dy);
                        characterEditor.updateBody();
                    }
                },
                {
                    rect: data.isBodyRectFixed
                        ? { x: 0, y: 0, w: 0, h: 0 }
                        : { x: body_rect[0], y: body_rect[1], w: body_rect[2], h: body_rect[3] },
                    mouseMove(dx, dy) {
                        body_rect[0] = this.rect.x + dx / data.renderer.getScale() | 0;
                        body_rect[1] = this.rect.y + dy / data.renderer.getScale() | 0;
                        characterEditor.updateBody();
                    },
                    arrowKey(dx, dy) {
                        body_rect[0] += dx;
                        body_rect[1] += dy;
                        characterEditor.updateBody();
                    }
                },
                {
                    previewTop: parseInt(data.preview.style.top) | 0,
                    previewLeft: parseInt(data.preview.style.left) | 0,
                    rect: { x: 0, y: 0, w: CANVAS_SIZE, h: CANVAS_SIZE },
                    mouseMove(dx, dy) {
                        data.preview.style.top = this.previewTop + dy  + 'px';
                        data.preview.style.left = this.previewLeft + dx + 'px';
                    },
                    arrowKey(dx, dy) {
                        data.preview.style.top = parseInt(data.preview.style.top) + dy + 'px';
                        data.preview.style.left = parseInt(data.preview.style.left) + dx + 'px';
                    }
                }
            ];

            for (const handler of handlers) {
                if (handler.rect && tmp.start(e, handler.rect)) {
                    tmp.setEventListener(handler);
                    data.holdOrigin = tmp;
                    break;
                }
            }
        },

        /**
         * マウスハンドラ
         */
        onMouseMove(e) {
            if (data.holdOrigin) {
                data.holdOrigin.onMouseMove(e);
            }
        },

        /**
         * mouse wheel event
         */
        onWheel(e) {
            if (e.deltaY < 0) {
                data.renderer.scaleUp();
                e.preventDefault();
            }
            else if (0 < e.deltaY) {
                data.renderer.scaleDown();
                e.preventDefault();
            }
        },

        onWindowKeyDown(e) {
            switch (e.key) {
            case "ArrowLeft":
                if (data.holdOrigin) {
                    data.holdOrigin.onArrowKey(-1, 0);
                    e.preventDefault();
                }
                break;
            case "ArrowRight":
                if (data.holdOrigin) {
                    data.holdOrigin.onArrowKey(1, 0);
                    e.preventDefault();
                }
                break;
            case "ArrowUp":
                if (data.holdOrigin) {
                    data.holdOrigin.onArrowKey(0, -1);
                    e.preventDefault();
                }
                break;
            case "ArrowDown":
                if (data.holdOrigin) {
                    data.holdOrigin.onArrowKey(0, 1);
                    e.preventDefault();
                }
                break;
            case "c":
                if (data.characterIndex + 1 < data.characters.length) {
                    data.onCharacterChanged(data.characterIndex + 1);
                }
                break;
            case "C":
                if (0 < data.characterIndex) {
                    data.onCharacterChanged(data.characterIndex - 1);
                }
                break;
            case "f":
                if (data.faceIndex + 1 < data.faces.length) {
                    data.onFaceChanged(data.faceIndex + 1);
                }
                break;
            case "F":
                if (0 < data.faceIndex) {
                    data.onFaceChanged(data.faceIndex - 1);
                }
                break;
            }
        },

        onDoubleClick() {
            if (data.renderer.image) {
                const filename = data.currentCharacter.name + '.png';
                const type = 'image/png';
                if (data.renderer.image instanceof HTMLImageElement) {
                    saveURLAsFile(filename, data.renderer.image.src, type);
                }
                else if (data.renderer.image instanceof HTMLVideoElement) {
                    saveURLAsFile(filename, Nina.toDataURL(data.renderer.image), type);
                }
                else {
                    saveURLAsFile(filename, data.renderer.image.toDataURL(), type);
                }
            }
        },

        onSaveClicked() {
            const json = {};
            json[data.currentCharacter.id] = data.currentCharacter;
    
            const fr = new FileReader();
            fr.addEventListener('load', (event) => {
                if (typeof event.target.result === 'string') {
                    saveURLAsFile(data.currentCharacter.id + ".json", event.target.result, 'text/plain')
                }
            });
            fr.readAsDataURL(new Blob([  JSON.stringify(json, undefined, 2) ]));
        },

        onRecognitionClicked() {
            /*
             * get example image data 
             */
            const example = data.renderer.getExample();
            const exampleData = new Nina.LumaData(Nina.getImageData(example.image,
                { x: 0, y:0, w: example.image.width, h: example.image.height }));

            /*
             * fix example position
             */
            const lumaImage = new Nina.LumaData(Nina.getImageData(data.renderer.image,
                { x: 0, y:0, w: data.renderer.image.width, h: data.renderer.image.height }));
            const estimated = estimatePosition(exampleData, lumaImage, example.rect);
            data.renderer.setExample(estimated.pos.x, estimated.pos.y);

            /*
             * find best face from guides
             */
            const faces = [];
            for (const guide of data.renderer.guide) {
                const face = estimatePosition(
                    exampleData,
                    lumaImage, 
                    {
                        x: guide.x - (exampleData.width >> 1),
                        y: guide.y - (exampleData.height >> 1),
                        w: exampleData.width,
                        h: exampleData.height,
                    });
                faces.push(face);
                faces.sort((a, b) => {
                    return a.score - b.score;
                });
            }

            /*
             * update and adjust face with the best if there is 
             */
            const oldFace = data.currentCharacter.face_rect[data.currentFace];

            const confirmFace = () => {
                if (faces.length) {
                    const bestFace = faces.shift();
                    data.currentCharacter.face_rect[data.currentFace] = [
                        estimated.pos.x,
                        estimated.pos.y,
                        bestFace.pos.x,
                        bestFace.pos.y,
                        bestFace.pos.w,
                        bestFace.pos.h,
                    ];
                    characterEditor.updateFace();
        
                    data.renderer.onAnimated().then(() => {
                        if (confirm('これで良いですか？')) {
                            data.renderer.removeGuide(bestFace.pos);
                            if (confirm('次の表情に切り替えてください') && data.faceIndex + 1 < data.faces.length) {
                                ++data.faceIndex;
                                characterEditor.updateFace();
                                characterEditor.faceCapturer.wait().then(() => {
                                    data.onRecognitionClicked();
                                })
                            }
                        }
                        else {
                            confirmFace();
                        }
                    });
                }
                else {
                    data.currentCharacter.face_rect[data.currentFace] = oldFace;
                    characterEditor.updateFace();
                    alert('残念・・・');
                }
            };

            confirmFace();
        },

        onFaceAdjustmentClicked() {
            const example = data.renderer.getExample();
            if (example && data.renderer.image) {
                /*
                 * get example image data 
                 */
                const example = data.renderer.getExample();
                const exampleData = new Nina.LumaData(Nina.getImageData(example.image,
                    { x: 0, y:0, w: example.image.width, h: example.image.height }));
    
                /*
                 * fix example position
                 */
                const lumaImage = new Nina.LumaData(Nina.getImageData(data.renderer.image,
                    { x: 0, y:0, w: data.renderer.image.width, h: data.renderer.image.height }))
                const estimated = estimatePosition(exampleData, lumaImage, example.rect);
                data.renderer.setExample(estimated.pos.x, estimated.pos.y);

                /*
                 * find best position from current
                 */
                const currentCharacter = data.characters[data.characterIndex];
                const currentFace = data.faces[data.faceIndex];
                const faceRect = currentCharacter.face_rect[currentFace];
                const estimatedFace = estimatePosition(
                    exampleData,
                    lumaImage, 
                    {
                        x: faceRect[2],
                        y: faceRect[3],
                        w: exampleData.width,
                        h: exampleData.height,
                    });

                /*
                 * adjust current face size
                 */
                faceRect[0] = estimated.pos.x ;
                faceRect[1] = estimated.pos.y;
                faceRect[2] = estimatedFace.pos.x;
                faceRect[3] = estimatedFace.pos.y;
                faceRect[4] = estimatedFace.pos.w;
                faceRect[5] = estimatedFace.pos.h;

                characterEditor.updateFace();
                data.renderer.update();
            }
        },

        onBodyAdjustmentClicked() {
            const currentCharacter = data.characters[data.characterIndex];
            const newBodyRect = adjustRect(data.renderer.image, {
                x: currentCharacter.body_rect[0],
                y: currentCharacter.body_rect[1],
                w: currentCharacter.body_rect[2],
                h: currentCharacter.body_rect[3],
            });
            currentCharacter.body_rect[0] = newBodyRect.x;
            currentCharacter.body_rect[1] = newBodyRect.y;
            currentCharacter.body_rect[2] = newBodyRect.w;
            currentCharacter.body_rect[3] = newBodyRect.h;

            characterEditor.updateBody();
            data.renderer.update();
        },

        /**
         * mouse up evemt
         */
        onWindowMouseUp(e) {
            switch (e.button) {
            case MOUSE_BUTTON_PRIMARY:
                if (data.holdOrigin) {
                    data.holdOrigin.stop();
                }
                break;
            case MOUSE_BUTTON_SECONDARY:
                const scale = data.renderer.getScale();
                data.renderer.addGuide(e.offsetX / scale | 0, e.offsetY / scale | 0);
                data.renderer.update();
                break;
            }
        },

        /**
         * paste event
         */
        onWindowPaste(e) {
            if (data.renderer && e instanceof ClipboardEvent) {
                Nina.readAsImageFromClipboard(e).then((img) => {
                    data.renderer.setExample(0, 0, img);
                    data.renderer.update();
                }).catch(printStack);
            }
        },

        onBackgroundDoubleClick() {
            data.preview.style.top = '0px';
            data.preview.style.left = '0px';
        }
    };

    return data;
}

export default class CharacterEditor {
    constructor(id, config) {
        this.#adelite = new Adelite(id, template);
        this.#config = config;
        this.#data = createData(this);
        this.#faceCapturer = new FaceCapturer();
    }

    show() {
        window.addEventListener('mouseup', this.#data.onWindowMouseUp);
        window.addEventListener('keydown', this.#data.onWindowKeyDown);
        window.addEventListener('paste', this.#data.onWindowPaste);
        document.getElementById('background').addEventListener('dblclick', this.#data.onBackgroundDoubleClick);

        this.#adelite.show(this.#data).then(() => {
            this.#data.preview = this.#adelite.getElementById('preview');
            this.#data.renderer = new CharacterTestRenderer(this.#adelite.getElementById('character-texture-canvas'), this.#config);
            return Promise.all(Array.from(this.#config.json.character, (x) => Filesystem.readJsonFile(x)));
        }).then((jsons) => {
            this.#data.characters = [];
            this.#data.completedCharacters = 0;
            const characters = mergeObject(jsons);
            for (const key of Object.keys(characters)) {
                this.#data.characters.push(characters[key]);
                const tasks = countTasks(characters[key]);
                if (tasks.body + tasks.face <= 3) {
                    ++this.#data.completedCharacters;
                }
            }
            sortCharacter(this.#data.characters);
            this.#data.onCharacterChanged(this.#data.characterIndex);
            this.#faceCapturer.start();
            this.#faceCapturer.addUpdateListener((img) => {
                this.#data.renderer.setExample(0, 0, img);
                this.#data.renderer.update();
            });
        }).catch(printStack);
    }

    destroy() {
        console.log('destroy!');

        this.#adelite.destroy();

        window.removeEventListener('mouseup', this.#data.onWindowMouseUp);
        window.removeEventListener('keydown', this.#data.onWindowKeyDown);
        window.removeEventListener('paste', this.#data.onWindowPaste);
        document.getElementById('background').removeEventListener('dblclick', this.#data.onBackgroundDoubleClick);
        this.#data = null;

        this.#faceCapturer.stop();
        this.#faceCapturer = null;
    }

    updateBody() {
        this.#data.renderer.setBody(this.#data.characters[this.#data.characterIndex].body_rect);
        this.#adelite.update();
    }

    updateFace() {
        const currentCharacter = this.#data.characters[this.#data.characterIndex];
        const currentFace = this.#data.faces[this.#data.faceIndex];

        this.#data.renderer.setFace(currentCharacter.face_rect, currentFace);
        this.#adelite.update();
    }

    static INITIAL_FACE_POSITION = [100, 0, 200, 0, 100, 100];
    static INITIAL_BODY_POSITION = [300, 0, 100, 100];

    get faceCapturer() {
        return this.#faceCapturer;
    }

    /** @type {Adelite} */
    #adelite = null;

    /** @type {Object} */
    #config = null;

    /** @type {Data} */
    #data = null;

    /** @type {FaceCapturer} */
    #faceCapturer = null;
}

/**
 * @typedef {{
 *     x: number,
 *     y: number,
 *     w: number,
 *     h: number,
 * }} BodyRect
 * @typedef {{
 *     dstx: number,
 *     dsty: number,
 *     srcx: number,
 *     srcy: number,
 *     w: number,
 *     h: number,
 * }} FaceRect
 */

/**
 * CharacterTestRenderer
 */
class CharacterTestRenderer {
    DST_RECT_COLOR = 'rgb(255, 0, 0)';
    SRC_RECT_COLOR = 'rgb(0, 0, 255)';
    SRC_RECT_INACTIVE_COLOR = 'rgb(255, 255, 0)';
    EXAMPLE_FRAME_COLOR = 'rgb(0, 0, 0)';
    GUIDE_COLOR = 'rgb(255, 0, 255)';
    BODY_RECT_COLOR = 'rgb(0, 255, 0)';

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
            x: 0,
            y: 0,
            image: null,
        }
    }

    drawDot(rect, color, size=2) {
        if (this.#enableRectangle && rect) {
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
        if (this.#enableRectangle && rect) {
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

    /**
     * draw face with boroder
     * @param {number} faceIndex
     * @param {string} borderColor
     */
    drawFace(faceIndex, borderColor) {
        const faceRect = this.#faceRects[faceIndex];

        if (faceIndex === this.#faceActive) {
            const dst_rect = {
                x: faceRect['dstx'],
                y: faceRect['dsty'],
                w: faceRect['w'],
                h: faceRect['h']
            };
    
            this.#ctx.drawImage(this.#image,
                faceRect['srcx'], faceRect['srcy'], faceRect['w'], faceRect['h'],
                faceRect['dstx'], faceRect['dsty'], faceRect['w'], faceRect['h']);
            if (this.#faceOriented) {
                this.drawDot(dst_rect, this.DST_RECT_COLOR);
            }
            else {
                this.drawRect(dst_rect, this.DST_RECT_COLOR);
            }
        }

        const src_rect = {
            x: faceRect['srcx'],
            y: faceRect['srcy'],
            w: faceRect['w'],
            h: faceRect['h']
        };

        if (this.#faceOriented) {
            this.drawDot(src_rect, borderColor);
        }
        else {
            this.drawRect(src_rect, borderColor);
        }              
    }

    drawGrid(interval, color) {
        if (this.#enableRectangle) {
            this.#ctx.beginPath();
            for (let x = 0; x < CANVAS_SIZE; x += interval) {
                this.#ctx.moveTo(x, 0);
                this.#ctx.lineTo(x, CANVAS_SIZE);
            }
            for (let y = 0; y < CANVAS_SIZE; y += interval) {
                this.#ctx.moveTo(0, y);
                this.#ctx.lineTo(CANVAS_SIZE, y);
            }
            this.#ctx.closePath();
            this.#ctx.lineWidth = 3;
            this.#ctx.strokeStyle = color;
            this.#ctx.stroke();
        }
    }

    update() {
        if (!this.#animated) {
            this.#animated = true;
            requestAnimationFrame(() => this.animationFrame());
        }
    }

    #enableRectangle = true;

    #animationListener = [];

    onAnimated() {
        return new Promise((resolve) => {
            this.#animationListener.push(resolve);
        });
    }

    animationFrame() {
        this.#animated = false;
        if (this.#image) {
            const size = CANVAS_SIZE * this.#scale | 0;
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

            if (this.#faceRects) {
                /*
                 * draw inactive face rectangles
                 */
                for (let i = 0; i < this.#faceRects.length; ++i) {
                    if (i != this.#faceActive) {
                        this.drawFace(i, this.SRC_RECT_INACTIVE_COLOR);                   
                    }
                }

                /*
                 * draw face
                 */
                this.drawFace(this.#faceActive, this.SRC_RECT_COLOR);

                /*
                 * draw pasted example image
                 */
                if (this.#example.image) {
                    this.#ctx.save();
                    this.#ctx.globalAlpha = 0.5;
                    this.#ctx.drawImage(this.#example.image, this.#example.x, this.#example.y);
                    this.#ctx.restore();

                    this.drawRect(this.getExample().rect, this.EXAMPLE_FRAME_COLOR);
                }

                /*
                 * draw face guide
                 */
                for (const guide of this.#guide) {
                    this.drawDot({
                        x: guide.x,
                        y: guide.y,
                        w: 0,
                        h: 0,
                    }, this.GUIDE_COLOR);
                }
            }

            if (this.#bodyRect) {
                this.drawRect(this.#bodyRect, this.BODY_RECT_COLOR);
            }

            this.#ctx.resetTransform();
        }

        if (this.#animationListener.length) {
            onTimeout(0).then(() => {
                this.#animationListener.forEach((listener) => listener());
            });
        }
    }

    setCharacter(path) {
        if (this.#path == path) {
            console.log('skip', path);
        }
        else {
            this.#path = path;
            this.#guide = [];
            Nina.readAsImage(this.#config.data.texture.character + '/' + path).then((img) => { 
                this.#image = img;
                this.update();
            }).catch(printStack);
        }
    }

    /**
     * 
     * @param {Object.<string, number[]>} rects 
     * @param {string} currentFace 
     */
    setFace(rects, currentFace) {
        this.#faceRects = [];
        for (const face in rects) {
            if (rects[face].length == 6) {
                const rect = {
                    dstx: rects[face][0],
                    dsty: rects[face][1],
                    srcx: rects[face][2],
                    srcy: rects[face][3],
                    w: rects[face][4],
                    h: rects[face][5],

                };
                if (face === currentFace) {
                    this.#faceActive = this.#faceRects.length;
                }
                this.#faceRects.push(rect);
            }
        }
        this.update();
    }

    setBody(rect) {
        if (rect.length == 4) {
            this.#bodyRect = {
                x: rect[0],
                y: rect[1],
                w: rect[2],
                h: rect[3],
            };
            this.update();
        }
    }

    setFaceOriented(face_oriented) {
        this.#faceOriented = face_oriented;
        this.update();
    }

    getScale() {
        return this.#scale;
    }

    scaleUp() {
        this.#scale += (Math.max(10, this.#scale * 10) | 0) / 100.0;
        this.#scale = Math.min(this.#scale, 4.0);
        this.update();
    }

    scaleDown() {
        this.#scale = (Math.max(10, this.#scale * 90) | 0) / 100.0;
        this.update();
    }

    scaleReset() {
        this.#scale = 1.0;
        this.update();
    }

    addGuide(x, y) {
        this.#guide.push({ x, y });
    }

    removeGuide(rect) {
        this.#guide = this.#guide.filter((guide) => {
            return !(rect.x <= guide.x
                && guide.x < rect.x + rect.w
                && rect.y <= guide.y
                && guide.y < rect.y + rect.h);
        });
    }

    getExample() {
        if (this.#example.image) {
            return {
                image: this.#example.image,
                rect: {
                    x: this.#example.x,
                    y: this.#example.y,
                    w: this.#example.image.width,
                    h: this.#example.image.height
                }
            };
        }
        return null;
    }

    setExample(x, y, image) {
        if (x) { 
            this.#example.x = x;
        }
        if (y) { 
            this.#example.y = y;
        }
        if (image) {
            this.#example.image = image; 
        }
    }

    get canvas() {
        return this.#canvas;
    }

    get image() {
        return this.#image;
    }

    get guide() {
        return this.#guide;
    }

    #config = null;

    /** @type {HTMLCanvasElement} */
    #canvas = null;

    /** @type {CanvasRenderingContext2D} */
    #ctx = null;

    /** @type {string | null} */
    #path = null;

    #animated = false;

    /** @type {Nina.DrawableElement} */
    #image = null;

    #faceActive = 0;

    /** @type {FaceRect[]} */
    #faceRects = null;

    /** @type {BodyRect} */
    #bodyRect = null;

    /** @type {{ x: number, y: number }[]} */
    #guide = null;

    /**
     * @type {{
     *     x: number,
     *     y: number,
     *     image: Nina.DrawableElement
     * }}
     */
    #example = null;

    #faceOriented = false;

    #scale = 1.0;
}

class FaceCapturer {
    constructor() {
        this.#listeners = [];
        this.#waiters = [];
    }

    /**
     * start capture
     */
    start() {
        this.stop();

        this.#frameWindow = IPC.createWindow('frame.html', {
            width: 128,
            height: 128,
            alwaysOnTop: true,
            openDevTools: false,
            transparent: true,
            frame: false
        });
    
        this.#video = document.createElement('video');
        this.#video.ontimeupdate = () => {
            if(this.#frameWindow) {
                this.#frameWindow.getBindingRect().then((rect) => {
                    if (this.#video) {
                        const borderSize = 3;
                        rect.x += borderSize;
                        rect.y += borderSize;
                        rect.w -= borderSize * 3;
                        rect.h -= borderSize * 3;
                        return Nina.clipImage(this.#video, rect);    
                    }
                    return null;
                }).then((img) => {
                    for (const listener of this.#listeners) {
                        listener(img);
                    }
                    for (const waiter of this.#waiters) {
                        waiter(img);
                    }
                });
            }
        };

        getScreenSourceID().then((sourceId) => {
            return navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    // @ts-ignore - old interface for electron
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId,
                    },
                }
            });
        }).then((stream) => {
            this.#video.srcObject = stream
            this.#video.onloadedmetadata = () => {
                this.#video.play();
            };
        });
    }

    /**
     * stop capture
     */
    stop() {
        if (this.#video) {
            this.#video.pause();
            this.#video = null;
        }

        if (this.#frameWindow) {
            this.#frameWindow.close();
            this.#frameWindow = null;
        }
    }

    /**
     * add update event listner
     * @param {function(HTMLCanvasElement): void} listener 
     */
    addUpdateListener(listener) {
        this.#listeners.push(listener);
    }

    /**
     * wait next update
     */
    wait() {
        return new Promise((resolve) => {
            this.#waiters.push(resolve);
        });
    }

    /** @type {(function(HTMLCanvasElement): void)[]} */
    #listeners = null;

    /** @type {(function(HTMLCanvasElement): void)[]} */
    #waiters = null;

    /** @type {import('../blanc/lisette.js').IPCWindow} */
    #frameWindow = null;

    /** @type {HTMLVideoElement} */
    #video = null;
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
        this.#position = e;

        const scale = this.#renderer.getScale();
        this.#isStarted = rect.x <= this.#position.offsetX / scale
            && this.#position.offsetX / scale < rect.x + rect.w
            && rect.y <= this.#position.offsetY / scale 
            && this.#position.offsetY / scale < rect.y + rect.h;

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

    /**
     * on mouse move
     * @param {MouseEvent} e 
     */
    onMouseMove(e) {
        if (this.#isStarted && this.#eventListener) {
            this.#eventListener.mouseMove(e.x - this.#position.x, e.y - this.#position.y);
        }
    }

    setEventListener(listener) {
        this.#eventListener = listener;
    }

    /**
     * @type {MouseEvent}
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
