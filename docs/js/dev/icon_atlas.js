'use strict';

import * as Application from '../blanc/lisette.js';
import * as ImageLoader from '../valmir/nina.js';

const state = (function() {
    /**
     * path to IconAtlas map
     * @type {Object}
     */
    let atlas_cache = {};

    /**
     * BGRSP setting json
     * @type {Object}
     */
    let setting = null;

    /**
     * icon path in the setting
     * @type {string}
     */
    let icon_path = null;

    Application.onLoad(function(config) {
        setting = config.icon;
        icon_path = config.data.texture.icon;
    });

    /**
     * IconAtlas for BGRSP
     * @param {string} path 
     */
    function IconAtlas(path) {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.path = path;
    
        if (this.path in setting) {
            this.setting = setting[this.path];
        }
        else {
            throw new Error('invalid icon path: ' + this.path);
        }
        this.image = ImageLoader.readAsImage(icon_path + '/' + this.path);
    
        const self = this;
        this.image.onload = function() {
            self.isLoaded = true;
            while (self.onLoad.length) {
                self.onLoad.shift()();
            }
        };
    
        atlas_cache[this.path] = this;
    }

    /**
     * @member canvas atlas canvas
     * @type {HTMLCanvasElement}
     */
    IconAtlas.prototype.canvas = null;

    /**
     * @member context rendering context
     * @type {CanvasRenderingContext2D}
     */
    IconAtlas.prototype.context = null;

    /**
     * @member path icon atlas path
     * @type {string}
     */
    IconAtlas.prototype.path = null;

    /**
     * @member setting atlas setting in JSON
     * @type {Object}
     */
    IconAtlas.prototype.setting = null;

    /**
     * @member image an image as the icon atlas
     * @type {HTMLImageElement}
     */
    IconAtlas.prototype.image = null;

    /**
     * @member isLoaded whether the image is already loaded
     * @type {boolean}
     */
    IconAtlas.prototype.isLoaded = false;
    
    /**
     * @member onLoad callback handlers called when the atlas is loaded
     * @type {Array<function(Object) : void>}
     */
    IconAtlas.prototype.onLoad = [];
    
    /**
     * get an image from the loaded atlas 
     * @param {number} left pixels from the left
     * @param {number} top pixels from the top
     * @returns {HTMLImageElement} the loaded image object
     */
    IconAtlas.prototype.getImage = function IconAtlas_getImage(left, top) {
        const img = new Image;
    
        const self = this;
        const callback = function() {
            if (self.path == 'atlas2') {
                console.log(self.path);
            }
    
            const dx = self.setting.offset_x;
            const dy = self.setting.offset_y;
            const iconSize = self.setting.size;
    
            self.canvas.width = iconSize;
            self.canvas.height = iconSize;
    
            self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
            self.context.drawImage(self.image,
                iconSize * left + dx, iconSize * top + dy, iconSize, iconSize,
                0, 0, self.canvas.width, self.canvas.height);
    
            img.src = self.canvas.toDataURL();
        };
    
        if (this.isLoaded) {
            callback();
        }
        else {
            this.onLoad.push(callback);
        }
    
        return img;
    };
    
    return {
        /**
         * get an icon atlas for a path
         * @param {string} path path to make and get the icon atlas
         * @returns {IconAtlas} tha IconAtlas for the path
         */
        getAtlas(path) {
            if (path in atlas_cache) {
                return atlas_cache[path];
            }
            else {
                return new IconAtlas(path);
            }
        }
    }
}());

/**
 * load an icon atlas and cut off an image from the atlas
 * @param {string} icon parameter to get the atlas
 * @returns {HTMLImageElement} tne image cut from the icon atlas 
 */
export function getImage(icon) {
    const icon_params = icon.split('#');
    if (icon_params.length == 3) {
        const path = icon_params[0];
        const top = (icon_params[1] | 0) - 1;
        const left = (icon_params[2] | 0) - 1;
        return state.getAtlas(path).getImage(left, top);
    }
    else {
        throw new Error('invalid icon parameter: ' + icon);
    }
}
