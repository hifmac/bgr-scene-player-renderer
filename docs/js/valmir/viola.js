/**
 * @file viola.js
 * @description Viola the BC3(DXT5) texture loader
 * @author hifmac(E32456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import { raiseError } from "../blanc/lisette.js";

const DXT5_BLOCK_SIZE = 16;

function dataSizeToRect(size) {
    /*
     * guess texture size from file size
     */
    let width;
    let height;
    switch (size >> 10) {
    case 4096:
        width = 2048;
        height = 2048;
        break;
    case 2048:
        width = 2048;
        height = 1024;
        break;
    case 1024:
        width = 1024;
        height = 1024;
        break;
    default:
        console.error(`Incorrect DXT5 data size: ${size}`);
    case 512:
        width = 1024;
        height = 512;
        break;
    }
    return { width, height };
}

/**
 * read specific length bits from array
 * @param {Array} data 
 * @param {number} byteOffset - byte offset for data 
 * @param {number} num - alpha number
 */
function readAlpha(data, byteOffset, num) {
    const i = (byteOffset << 3) + num * 3;
    return ((data[i >> 3] >> (i & 0x07)) & 0x01)
        | (((data[(i + 1) >> 3] >> ((i + 1) & 0x07)) & 0x01) << 1)
        | (((data[(i + 2) >> 3] >> ((i + 2) & 0x07)) & 0x01) << 2);
}

/**
 * read alpha array from data
 * @param {Uint8Array} data 
 * @param {number} i 
 */
function readAlphas(data, i) {
    const a0 = data[i + 0];
    const a1 = data[i + 1];

    let alphaIndex;
    if (a0 <= a1) {
        alphaIndex = [
            a0,
            a1,    
            (a0 * 4 + a1    ) / 5,
            (a0 * 3 + a1 * 2) / 5,
            (a0 * 2 + a1 * 3) / 5,
            (a0     + a1 * 4) / 5,
            0,
            255
        ];
    }
    else {
        alphaIndex = [
            a0,
            a1,    
            (a0 * 6 + a1    ) / 7,
            (a0 * 5 + a1 * 2) / 7,
            (a0 * 4 + a1 * 3) / 7,
            (a0 * 3 + a1 * 4) / 7,
            (a0 * 2 + a1 * 5) / 7,
            (a0     + a1 * 6) / 7,
        ];
    }

    return [
        alphaIndex[readAlpha(data, i + 2,  0)],
        alphaIndex[readAlpha(data, i + 2,  1)],
        alphaIndex[readAlpha(data, i + 2,  2)],
        alphaIndex[readAlpha(data, i + 2,  3)],

        alphaIndex[readAlpha(data, i + 2,  4)],
        alphaIndex[readAlpha(data, i + 2,  5)],
        alphaIndex[readAlpha(data, i + 2,  6)],
        alphaIndex[readAlpha(data, i + 2,  7)],

        alphaIndex[readAlpha(data, i + 2,  8)],
        alphaIndex[readAlpha(data, i + 2,  9)],
        alphaIndex[readAlpha(data, i + 2, 10)],
        alphaIndex[readAlpha(data, i + 2, 11)],

        alphaIndex[readAlpha(data, i + 2, 12)],
        alphaIndex[readAlpha(data, i + 2, 13)],
        alphaIndex[readAlpha(data, i + 2, 14)],
        alphaIndex[readAlpha(data, i + 2, 15)],
    ];
}

/**
 * convert RGB565 to array
 * @param {number} a color a
 */
function rgb565ToArray(a) {
    return [
        (a >> 11) << 3,
        ((a >> 5) & 0x3f) << 2,
        (a & 0x1f) << 3,
    ];
}

/**
 * read color array from data
 * @param {Uint8Array} data 
 * @param {number} i 
 */
function readColors(data, i) {
    const c0 = rgb565ToArray((data[i + 9] << 8) | data[i + 8]);
    const c1 = rgb565ToArray((data[i + 11] << 8) | data[i + 10]);

    const colorIndex = [
        c0,
        c1,
        [ (c0[0] * 2 + c1[0]) / 3, (c0[1] * 2 + c1[1]) / 3, (c0[2] * 2 + c1[2]) / 3 ],
        [ (c0[0] + c1[0] * 2) / 3, (c0[1] + c1[1] * 2) / 3, (c0[2] + c1[2] * 2) / 3 ],
    ];

    return [
        colorIndex[(data[i + 12] >> 0) & 0x03],
        colorIndex[(data[i + 12] >> 2) & 0x03],
        colorIndex[(data[i + 12] >> 4) & 0x03],
        colorIndex[(data[i + 12] >> 6) & 0x03],

        colorIndex[(data[i + 13] >> 0) & 0x03],
        colorIndex[(data[i + 13] >> 2) & 0x03],
        colorIndex[(data[i + 13] >> 4) & 0x03],
        colorIndex[(data[i + 13] >> 6) & 0x03],

        colorIndex[(data[i + 14] >> 0) & 0x03],
        colorIndex[(data[i + 14] >> 2) & 0x03],
        colorIndex[(data[i + 14] >> 4) & 0x03],
        colorIndex[(data[i + 14] >> 6) & 0x03],

        colorIndex[(data[i + 15] >> 0) & 0x03],
        colorIndex[(data[i + 15] >> 2) & 0x03],
        colorIndex[(data[i + 15] >> 4) & 0x03],
        colorIndex[(data[i + 15] >> 6) & 0x03],
    ];
}

/**
 * Viola the DXT5 texture loader
 */
function Viola() {
    console.log('Viola!');
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
}

/** @type {HTMLCanvasElement} */
Viola.prototype.canvas = null;

/** @type {CanvasRenderingContext2D} */
Viola.prototype.ctx = null;

/**
 * make data url from DXT5 formatted Uint8Array
 * @param {Uint8Array} data
 * @returns {string} data url
 * @note DXT5 texture block format  
 * 1 block represens 4x4 pixel box  
 *   
 * abbreviations:  
 *     ai: alpha index value  
 *     ci: color index value  
 *   
 * bit       7   6   5   4   3   2   1   0  
 *         +-------------------------------+  
 * byte  0 |            alpha 0            |  
 *         +-------------------------------+  
 * byte  1 |            alpha 1            |  
 *         +-------+-----------+-----------+  
 * byte  2 |-i  2  |   ai  1   |   ai  0   |  
 *         +---+---+-------+---+-------+---+  
 * byte  3 |-5 |   ai  4   |   ai  3   | a-|  
 *         +---+-------+---+-------+---+---+  
 * byte  4 |   ai  7   |   ai  6   |   ai -|  
 *         +-------+---+-------+---+-------+  
 * byte  5 |-i 10  |   ai  9   |   ai  8   |  
 *         +---+---+-----------+-------+---+  
 * byte  6 |-13|   ai 12   |   ai 11   | a-|  
 *         +---+-------+---+-------+---+---+  
 * byte  7 |   ai 15   |   ai 14   |   ai -|  
 *         +-----------+-----------+-------+  
 * byte  8 |-green     |    color0 blue    |  
 *         +-------------------------------+  
 * byte  9 |    color0 red      |   color0-|  
 *         +-------------------------------+  
 * byte 10 |-green     |    color1 blue    |  
 *         +-------------------------------+  
 * byte 11 |    color1 red      |   color1-|  
 *         +-------------------------------+  
 * byte 12 | ci  3 | ci  2 | ci  1 | ci  0 |  
 *         +-------------------------------+  
 * byte 13 | ci  7 | ci  6 | ci  5 | ci  4 |  
 *         +-------------------------------+  
 * byte 14 | ci 11 | ci 10 | ci  9 | ci  8 |  
 *         +-------------------------------+  
 * byte 15 | ci 15 | ci 14 | ci 13 | ci 12 |  
 *         +-------------------------------+
 */
Viola.prototype.load = function Viola_load(data) {
    if (data.length & 0x0f) {
        raiseError(`Invalid data length: ${data.length}, DXT5 byte size should be aligned to 16x` );
    }

    const { width, height } = dataSizeToRect(data.length);

    /*
     * reserve clamped array for width * rgba * height
     */
    const lineBytes = width << 2;
    const imageArray = new Uint8ClampedArray(lineBytes * height);

    /*
     * iterate for each block(16 bytes) 
     */
    for (let i = data.length, blockNumber = i / DXT5_BLOCK_SIZE; i; --blockNumber) {
        /*
         * read alpha and color array
         */
        i -= DXT5_BLOCK_SIZE;
        const alpha = readAlphas(data, i);
        const color = readColors(data, i);

        /**
         * set data for each line
         */
        const left = ((blockNumber << 2) % width) << 2;
        const line = ((blockNumber << 2) / width | 0) << 2;
        for (let l = 4; l--; ) {
            let bytes = (height - 1 - line - l) * lineBytes + left;
            let pi = (l << 2);

            imageArray[bytes++] = color[pi][0];
            imageArray[bytes++] = color[pi][1];
            imageArray[bytes++] = color[pi][2]; 
            imageArray[bytes++] = alpha[pi++];

            imageArray[bytes++] = color[pi][0];
            imageArray[bytes++] = color[pi][1];
            imageArray[bytes++] = color[pi][2]; 
            imageArray[bytes++] = alpha[pi++];

            imageArray[bytes++] = color[pi][0];
            imageArray[bytes++] = color[pi][1];
            imageArray[bytes++] = color[pi][2]; 
            imageArray[bytes++] = alpha[pi++];

            imageArray[bytes++] = color[pi][0];
            imageArray[bytes++] = color[pi][1];
            imageArray[bytes++] = color[pi][2]; 
            imageArray[bytes] = alpha[pi];
        }
    }

    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.putImageData(new ImageData(imageArray, width, height), 0, 0);
    return this.canvas.toDataURL();
};

export default new Viola();
