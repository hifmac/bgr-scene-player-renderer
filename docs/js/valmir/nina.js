/**
 * @file nina.js
 * @description Nina the image loader
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import { Filesystem, makeError, rejectError, saveURLAsFile } from '../blanc/lisette.js';
import * as Viola from './viola.js';

/**
 * @typedef {HTMLCanvasElement | HTMLImageElement | HTMLVideoElement} DrawableElement 
 */

/**
 * @typedef {{
 *     x: number,
 *     y: number,
 *     w: number,
 *     h: number,
 * }} Rect
 */

const PNG_HEADER =  [ 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A ];
const CACHE_QUOTA = 64 << 20;

/**
 * @class Data URL cache for Nina
 * @template T cached data type
 */
class Cache {
    constructor() {
        this.#cache = {};
    };

    /**
     * check whether the path is already cached
     * @param {string} path image path 
     * @returns {boolean} the path is cached
     */
    has(path) {
        return this.#cache[path] !== undefined;
    }

    /**
     * get cache for the image path
     * @param {string} path image path 
     * @returns {Promise<T>} data url
     */
    get(path) {
        return new Promise((resolve, reject) => {
            const cache = this.#cache[path];
            cache.gen = this.#sequence++;
            if (cache.data) {
                resolve(cache.data);
            }
            else {
                cache.queue.push({
                    resolve,
                    reject
                });
            }
        });
    }

    /**
     * load data
     * @param {string} path 
     * @param {Promise<{data: T, size: number}>} loader 
     * @returns {Promise<T>}
     */
    load(path, loader) {
        if (this.has(path)) {
            throw makeError(`${path} is already loaded`);
        }

        this.#cache[path] = {
            data: null,
            size: 0,
            gen: 0,
            queue: []
        };

        loader.then((loaded) => {
            if (CACHE_QUOTA < this.#usage) {
                for (const key of Object.keys(this.#cache)) {
                    this.#usage -= this.#cache[key].size;
                    delete this.#cache[key];
                    if (this.#usage <= CACHE_QUOTA) {
                        break;
                    }
                }
            }

            const cache = this.#cache[path];
            cache.data = loaded.data;
            cache.size = loaded.size;
            for (const promise of cache.queue) {
                promise.resolve(loaded.data);
            }
            cache.queue = null;

            this.#usage += loaded.size;
            console.log(`Cache quota: usage - ${this.#usage >> 20} MB / ${CACHE_QUOTA >> 20} MB`);
        }).catch((err) => {
            for (const promise of this.#cache[path].queue) {
                promise.reject(err);
            }
            delete this.#cache[path];
        });

        return this.get(path);
    }

    /**
     * @type {Object.<string, {
     *     gen: number,
     *     size: number,
     *     data: T,
     *     queue: {
     *         resolve: (data: T) => void,
     *         reject: (err: any) => void
     *     }[]
     * }>}
     */
    #cache = null;

    #usage = 0;

    #sequence = 0;
}

/**
 * @type {{
 *     url: Cache<string>
 *     image: Cache<DrawableElement>
 * }}
 */
const cache = {
    url: new Cache(),
    image: new Cache(),
};

/**
 * check the data could be png file
 * @param {Uint8Array} data file data 
 * @return {boolean} whether file data is PNG file
 */
const isPngFile = (data) => {
    return PNG_HEADER.length <= data.length
        && data[0] == PNG_HEADER[0]
        && data[1] == PNG_HEADER[1]
        && data[2] == PNG_HEADER[2]
        && data[3] == PNG_HEADER[3]
        && data[4] == PNG_HEADER[4]
        && data[5] == PNG_HEADER[5]
        && data[6] == PNG_HEADER[6]
        && data[7] == PNG_HEADER[7];
};

/**
 * 
 * @param {DrawableElement} img 
 * @param {Rect} rect 
 */
const imageToCanvas = (img, rect) => {
    const canvas = document.createElement('canvas');
    canvas.width = rect.w;
    canvas.height = rect.h;
    const context = canvas.getContext('2d');
    context.globalCompositeOperation = 'copy';
    context.drawImage(img,
        rect.x, rect.y, rect.w, rect.h,
        0, 0, rect.w, rect.h);
    return canvas;
};

/**
 * convert png data to data url string
 * @param {Uint8Array} data 
 * @returns {Promise<string>}
 */
function pngDataToDataURL(data) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader() ;
        fileReader.addEventListener('load', () => {
            if (typeof fileReader.result === 'string') {
                resolve(fileReader.result);
            }
            else {
                reject(`${typeof fileReader.result} is unexpected result type`);
            }
        });
        fileReader.readAsDataURL( new Blob([ data ], { type: 'image/png' }) );
    });
}


/**
 * read a path as a data URL
 * @param {string} path file path to read
 * @returns {Promise<string>}
 */
export function readAsDataURL(path) {
    if (cache.url.has(path)) {
        return cache.url.get(path);
    }

    return cache.url.load(path, new Promise((resolve, reject) => {
        Filesystem.readFile(path).then((data) => {
            if (isPngFile(data)) {
                /*
                 * read PNG file and convert to Data URL to cache
                 */
                pngDataToDataURL(data).then((url) => {
                    resolve({ data: url, size: url.length });
                }).catch((err) => {
                    rejectError(err, reject);
                });
            }
            else {
                /*
                 * load as DXT5 by using Viola if not PNG
                 */
                try {
                    const url = Viola.loadAsDataURL(data);
                    resolve({ data: url, size: url.length });
                }
                catch (e) {
                    rejectError(e, reject);
                }
            }    
        }).catch((err) => {
            rejectError(err, reject)
        });
    }));
}

/**
 * read a path as a data URL
 * @param {string} path file path to read
 * @returns {Promise<DrawableElement>}
 */
export function readAsImage(path) {
    if (cache.image.has(path)) {
        return cache.image.get(path);
    }

    return cache.image.load(path, new Promise((resolve, reject) => {
        Filesystem.readFile(path).then((data) => {
            if (isPngFile(data)) {
                /*
                 * read PNG file and convert to Data URL to cache
                 */
                pngDataToDataURL(data).then((url) => {
                    const img = new Image();
                    img.src = url;
                    return new Promise((resolveImage) => {
                        img.addEventListener('load', () => {
                            resolveImage(img);
                        });
                    });        
                }).then((img) => {
                    resolve({ data: img, size: img.width * img.height * 4 });
                }).catch((err) => {
                    rejectError(err, reject);
                });
            }
            else {
                /*
                 * load as DXT5 by using Viola if not PNG
                 */
                try {
                    const img = Viola.loadAsCanvas(data);
                    resolve({
                        data: img,
                        size: img.width * img.height * 4
                    }); 
                }
                catch (e) {
                    rejectError(e, reject);
                }
            }
        }).catch((err) => {
            rejectError(err, reject);
        });
    }));
}

/**
 * read as image from clipboard data
 * @param {ClipboardEvent} event 
 * @returns {Promise<DrawableElement>}
 */
export function readAsImageFromClipboard(event) {
    return new Promise((resolve, reject) => {
        if (event.clipboardData.items.length) {
            const fr = new FileReader();
            fr.addEventListener('load', (e) => {
                if (typeof e.target.result === 'string') {
                    const img = new Image;
                    img.src = e.target.result;
                    img.addEventListener('load', () => resolve(img));
                }
                else {
                    rejectError(`Invalid result type: ${typeof e.target.result}`, reject);
                }
            });    
            fr.readAsDataURL(event.clipboardData.items[0].getAsFile());    
        }
        else {
            rejectError('No data in clipboard', reject);
        }
    });
}
    
/**
 * make mask image for character shadow
 * @param {DrawableElement} img file path to read
 * @returns {Promise<DrawableElement>}
 */
export function makeMaskImage(img) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const context = canvas.getContext('2d');
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, img.width, img.height);
        context.globalCompositeOperation = 'destination-in';
        context.drawImage(img, 0, 0);
        resolve(canvas);
    });
}

/**
 * convert image to data URL
 * @param {DrawableElement} img file path to read
 * @returns {string}
 */
export function toDataURL(img) {
    return imageToCanvas(img, {
        x: 0,
        y: 0,
        w: img.width,
        h: img.height        
    }).toDataURL();
}

/**
 * 
 * @param {DrawableElement} img file path to read
 * @param {Rect} rect
 * @returns {Promise<HTMLCanvasElement>}
 */
export function clipImage(img, rect) {
    return new Promise((resolve) => {
        resolve(imageToCanvas(img, rect));
    });
}

/**
 * @param {DrawableElement} image 
 * @param {Rect} rect 
 */
export function getImageData(image, rect) {
    if (image instanceof HTMLCanvasElement) {
        return image.getContext('2d')
            .getImageData(rect.x, rect.y, rect.w, rect.h);
    }
    else {
        return imageToCanvas(image, rect)
            .getContext('2d')
            .getImageData(0, 0, rect.w, rect.h);
    }
}

export class LumaData {
    /**
     * @constructor
     * @param {ImageData | Int16Array} imageData 
     * @param {number[]|*} alpha
     * @param {number|*} width
     * @param {number|*} height
     */
    constructor(imageData, alpha, width, height) {
        if (imageData instanceof ImageData) {
            this.data = new Int16Array(imageData.width * imageData.height);
            this.alpha = new Array(this.data.length);
            this.width = imageData.width;
            this.height = imageData.height;
            for (let i = 0; i < imageData.data.length; i += 4) {
                const alpha = imageData.data[i + 3] / 255;
                const luma = imageData.data[i] * 0.2126 * alpha
                    + imageData.data[i + 1] * 0.7152 * alpha
                    + imageData.data[i + 2] * 0.0722 * alpha;
                this.data[i >> 2] = luma | 0;
                this.alpha[i >> 2] = alpha;
            }
        }
        else if (imageData instanceof Int16Array) {
            this.data = imageData;
            this.alpha = alpha;
            this.width = width;
            this.height = height;
        }
        else {
            throw makeError(`${typeof imageData} is not supported`);
        }
    }

    /**
     * make a part of image from self
     * @param {number} x 
     * @param {number} y 
     * @param {number} w 
     * @param {number} h 
     * @returns {LumaData}
     */
    subimage(x, y, w, h) {
        if (y < 0) {
            h += y;
            y = 0;
        }

        if (x < 0) {
            w += x;
            x = 0;
        }

        const data = new Int16Array(w * h);
        const alpha = new Array(w * h);
        for (let dy = 0, sy = y; dy < h; ++dy, ++sy) {
            if (0 <= sy && sy < this.height) {
                let dx = w * dy;
                let sx = this.width * sy + x;
                for (let i = w; i--; ++dx, ++sx) {
                    data[dx] = this.data[sx];
                    alpha[dx] = this.alpha[sx];
                }
            }
        }
        return new LumaData(data, alpha, w, h);
    }

    /**
     * blend this and image
     * @param {LumaData} image 
     */
    blend(image, dx, dy) {
        const data = this.data.slice();
        const alpha = this.alpha.slice();

        let src = 0;
        let dst = 0;
        if (dy < 0) {
            src -= image.width * dy;
        }
        else {
            dst += this.width * dy;
        }

        if (dx < 0) {
            src -= dx;
        }
        else {
            dst += dx;
        }

        const actualWidth = Math.min(this.width, image.width + dx) - Math.max(0, dx);
        const actualHeight = Math.min(this.height, image.height + dy) - Math.max(0, dy);
        console.log(this.width, this.height, image.width, image.height, actualWidth, actualHeight);
        for (let y = 0; y < actualHeight; ++y) {
            for (let x = 0; x < actualWidth; ++x) {
                data[dst] = this.data[dst] * (1 - image.alpha[src] * image.alpha[src]) + image.data[src] * image.alpha[src] * image.alpha[src];
                alpha[dst] = this.alpha[dst] * (1 - image.alpha[src] * image.alpha[src]) + image.alpha[src] * image.alpha[src];
                ++dst, ++src;
            }
            src += image.width - actualWidth;
            dst += this.width - actualWidth;
        }

        return new LumaData(data, alpha, this.width, this.height);
    }

    save(filename) {
        const imageData = this.getImageData();
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const context = canvas.getContext('2d');
        context.putImageData(imageData, 0, 0);
        saveURLAsFile(filename, canvas.toDataURL(), 'image/png');
    }

    getImageData() {
        const imageData = new ImageData(this.width, this.height);
        for (let i = 0; i < this.data.byteLength; ++i) {
            const offset = i << 2;
            if (this.data[i] !== -1) {
                imageData.data[offset    ] = this.data[i];
                imageData.data[offset + 1] = this.data[i];
                imageData.data[offset + 2] = this.data[i];
                imageData.data[offset + 3] = this.alpha[i] * 255 | 0;
            }
        }
        return imageData;
    }

    toCanvas() {
        const imageData = this.getImageData();
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const context = canvas.getContext('2d');
        context.putImageData(imageData, 0, 0);
        return canvas;
    }

    /** @type {Int16Array} */
    data = null;

    /** @type {Array<number>} */
    alpha = null;

    width = 0;
    height = 0;
}
