/**
 * @file nina.js
 * @description Nina the image loader
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import { Filesystem } from '../blanc/lisette.js';
import Viola from './viola.js';

const PNG_HEADER =  [ 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A ];
const CACHE_QUOTA = 64 << 20;

/**
 * check the data could be png file
 * @param {ArrayBuffer} data file data 
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
 * Data URL cache for Nina
 */
function Cache() {
    this.cache = {};
};

/**
 * @type {Object.<string, string>}
 */
Cache.prototype.cache = null;

Cache.prototype.usage = 0;

/**
 * check whether the path is already cached
 * @param {string} path image path 
 * @returns {boolean} the path is cached
 */
Cache.prototype.isCached = function Cache_isCached(path) {
    return this.cache[path] !== undefined;
}

/**
 * get cache for the image path
 * @param {string} path image path 
 * @returns {string} data url
 */
Cache.prototype.get = function Cache_get(path) {
    return this.cache[path];
}

/**
 * register image  data URL for the path
 * @param {string} path image path to register 
 * @param {string} data image data url
 */
Cache.prototype.register = function Cache_register(path, data) {
    for (const key of Object.keys(this.cache)) {
        if (this.usage <= CACHE_QUOTA) {
            break;
        }

        this.usage -= this.cache[key].length;
        delete this.cache[key];
    }

    this.cache[path] = data;
    this.usage += data.length;

    console.log(`path ${path} is cached: ${this.usage >> 20} / ${CACHE_QUOTA >> 20} MB`);
}

/**
 * Nina the image loader
 */
function Nina() {
    this.cache = new Cache();
};

/** @type {Cache} */
Nina.prototype.cache = null;

/**
 * read a path as a data URL
 * @param {string} path file path to read
 */
Nina.prototype.readAsDataURL = async function Nina_readAsDataURL(path) {
    if (this.cache.isCached(path)) {
        return this.cache.get(path);
    }

    const data = await Filesystem.readFile(path);
    if (isPngFile(data)) {
        /*
         * read PNG file and convert to Data URL to cache
         */
        return await new Promise((resolve) => {
            const fileReader = new FileReader() ;
            fileReader.addEventListener('load', () => {
                this.cache.register(path, fileReader.result);
                resolve(fileReader.result);
            });
            fileReader.readAsDataURL( new Blob([ data ], { type: 'image/png' }) );
        });
    }
    else {
        /*
         * load as DXT5 by using Viola if not PNG
         */
        this.cache.register(path, Viola.load(data));
        return this.cache.get(path);
    }
};

export default new Nina();
