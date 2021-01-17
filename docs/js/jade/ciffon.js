/**
 * @file ciffon.js
 * @description Ciffon the widget loader
 * @author hifmac(E32456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import { makeError, mergeObject } from "../blanc/lisette.js";
import * as Nina from "../valmir/nina.js";

const heritage = {
    "back_button":{
        "path": "dialog/atlas4",
        "crop": {
            "x": 1973,
            "y": 443,
            "w": 64,
            "h": 66
        }
    },
    "directory_bg":{
        "path":"dialog/atlas6",
        "crop":{
            "x":0,
            "y":1472,
            "w":1024,
            "h":576
        }
    },
    "directory_arrow":{
        "path":"dialog/atlas7",
        "crop":{
            "x":335,
            "y":15,
            "w":17,
            "h":75
        }
    },
    "directory_name_bg":{
        "path":"dialog/atlas4",
        "crop":{
            "x":956,
            "y":370,
            "w":21,
            "h":28
        }
    },
    "directory_select_face":{
        "path":"dialog/atlas8",
        "crop":{
            "x":1121,
            "y":9,
            "w":125,
            "h":42
        }
    },
    "directory_favorite_bg":{
        "path":"dialog/atlas6",
        "crop":{
            "x":1158,
            "y":144,
            "w":120,
            "h":33
        }
    },
    "directory_select_voice":{
        "path":"dialog/atlas4",
        "crop":{
            "x":304,
            "y":317,
            "w":78,
            "h":32
        }
    },
    "directory_bgr_emblem":{
        "path":"dialog/atlas4",
        "crop":{
            "x":1289,
            "y":338,
            "w":50,
            "h":50
        }
    },
    "directory_text_frame":{
        "path":"dialog/atlas4",
        "crop":{
            "x":1444,
            "y":343,
            "w":43,
            "h":28
        }
    },
    "directory_sd_button":{
        "path":"dialog/atlas7",
        "crop":{
            "x":228,
            "y":30,
            "w":106,
            "h":36
        }
    },
    "directory_switch_button":{
        "path":"dialog/atlas6",
        "crop":{
            "x":1391,
            "y":1726,
            "w":328,
            "h":46
        }
    },
    "directory_bar":{
        "path": "dialog/atlas4",
        "crop": {
            "x": 6,
            "y": 469,
            "w": 300,
            "h": 15
        }
    },
    "directory_normal_voice_button": {
        "path": "dialog/atlas6",
        "crop": {
            "x": 379,
            "y": 1,
            "w": 106,
            "h": 34
        }
    },
    "directory_battle_voice_button": {
        "path": "dialog/atlas6",
        "crop": {
            "x": 517,
            "y": 82,
            "w": 106,
            "h": 34
        }
    },
    "directory_favorite_voice_button": {
        "path": "dialog/atlas6",
        "crop": {
            "x": 516,
            "y": 47,
            "w": 106,
            "h": 34
        }
    },
    "directory_marriage_voice_button": {
        "path": "dialog/atlas6",
        "crop": {
            "x": 1762,
            "y": 1605,
            "w": 106,
            "h": 34
        }
    },
    "directory_slider":{
        "path": "dialog/atlas4",
        "crop": {
            "x": 989,
            "y": 1059,
            "w": 19,
            "h": 53
        }
    },
    "directory_voice_play_button":{
        "path": "dialog/atlas4" ,
        "crop": {
            "x": 752,
            "y": 326,
            "w": 44,
            "h": 33
        }
    },
    "scenario_talk_bg":{
        "path":"dialog/atlas4",
        "crop":{
            "x":1020,
            "y":1335,
            "w":894,
            "h":135
        }
    },
    "scenario_name_bg":{
        "path":"dialog/atlas4",
        "crop":{
            "x":0,
            "y":500,
            "w":200,
            "h":35
        }
    },
    "scenario_log_bg":{
        "path":"dialog/atlas4",
        "crop":{
            "x":34,
            "y":64,
            "w":30,
            "h":18
        }
    },
    "scenario_log_bg_hover":{
        "path":"dialog/atlas4",
        "crop":{
            "x":1,
            "y":64,
            "w":30,
            "h":18
        }
    },
    "scenario_log_bg_active":{
        "path":"dialog/atlas4",
        "crop":{
            "x":446,
            "y":308,
            "w":60,
            "h":36
        }
    },
    "scenario_auto_bg":{
        "path":"dialog/atlas4",
        "crop":{
            "x":698,
            "y":365,
            "w":30,
            "h":18
        }
    },
    "scenario_auto_bg_hover":{
        "path":"dialog/atlas4",
        "crop":{
            "x":646,
            "y":297,
            "w":30,
            "h":18
        }
    },
    "scenario_option_bg":{
        "path":"dialog/atlas4",
        "crop":{
            "x":129,
            "y":577,
            "w":45,
            "h":18
        }
    },
    "scenario_option_bg_hover":{
        "path":"dialog/atlas4",
        "crop":{
            "x":1458,
            "y":290,
            "w":45,
            "h":18
        }
    },
    "scenario_option_bg_active":{
        "path":"dialog/atlas4",
        "crop":{
            "x":1059,
            "y":578,
            "w":45,
            "h":18
        }
    },
    "scenario_minimize_bg":{
        "path":"dialog/atlas4",
        "crop":{
            "x":2027,
            "y":916,
            "w":18,
            "h":18
        }
    },
    "scenario_minimize_bg_hover":{
        "path":"dialog/atlas4",
        "crop":{
            "x":592,
            "y":46,
            "w":18,
            "h":18
        }
    },
    "scenario_minimize_bg_acrive":{
        "path":"dialog/atlas4",
        "crop":{
            "x":572,
            "y":46,
            "w":18,
            "h":18
        }
    },
    "scenario_skip_bg":{
        "path":"dialog/atlas4",
        "crop":{
            "x":1240,
            "y":277,
            "w":62,
            "h":18
        }
    },
    "scenario_skip_bg_hover":{
        "path":"dialog/atlas4",
        "crop":{
            "x":0,
            "y":576,
            "w":62,
            "h":18
        }
    },
    "scenario_skip_bg_active":{
        "path":"dialog/atlas4",
        "crop":{
            "x":65,
            "y":576,
            "w":62,
            "h":18
        }
    },
    "scenario_four_option_bg":{
        "path":"dialog/atlas3",
        "crop":{
            "x":1780,
            "y":1054,
            "w":240,
            "h":40
        }
    },
 };

 /**
  * @typedef {{
  *     path: string,
  *     src: number[],
  *     dst?: number[]
  * }} Widget
  */

/** @type {Object.<string, Widget>} */
const scenarioWidget = {
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
    "scenario-minimize":{
        "path":"dialog/atlas4",
        "src": [ 2027, 915, 18, 18 ],
        "dst": [ 939, 409 ]
    },
    "scenario-skip":{
        "path": "dialog/atlas4",
        "src": [ 1240, 277, 63, 18 ],
        "dst": [ 927, 39 ]
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
            this.#widgetDefinitions = mergeObject([ scenarioWidget ]);
        }
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

        throw makeError(`${widgetName} is not in the catalog`);
    }

    /** @type {Object} */
    #config = null;

    /** @type {Object.<string, Widget>} */
    #widgetDefinitions = null;
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
