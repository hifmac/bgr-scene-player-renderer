'use strict';

import { Filesystem, hasOwnProperties } from '../blanc/lisette.js';
import * as ImageLoader from '../valmir/nina.js';
import * as Chescarna from '../demonia/chescarna.js';

/**
 * point class for Lily engine
 * @param {number} x 
 * @param {number} y 
 */
export function Point(x, y) {
    this.x = x;
    this.y = y;
}

/** @member {number} x horizontal position */
Point.prototype.x = 0;

/** @member {number} x vertical position */
Point.prototype.y = 0;

/**
 * move the point with a offset relatively
 * @param {Point} offset a offset to move
 * @returns {Point} moved point
 */
Point.prototype.move = function Point_move(offset) {
    return (new Point(this.x + offset.x, this.y + offset.y));
};

/**
 * move X position
 * @param {number} x horizontal position offset
 * @returns {Point} moved point
 */
Point.prototype.moveX = function Point_moveX(x) {
    return (new Point(this.x + x, this.y));
};

/**
 * move Y position
 * @param {number} y vertical position offset 
 * @returns {Point} moved point
 */
Point.prototype.moveY = function Point_moveY(y) {
    return (new Point(this.x, this.y + y));
};

/**
 * @returns {Point} inverted point
 */
Point.prototype.invert = function Point_invert() {
    return new Point(-this.x, -this.y);
};

/**
 * @returns {Point} cloned point
 */
Point.prototype.clone = function Point_clone() {
    return new Point(this.x, this.y);
};

/**
 * @param {Rect} rect a rectangle including this point
 * @returns {boolean} whether this point is included by rect
 */
Point.prototype.isIncludedBy = function Point_isIncludedBy(rect) {
    return (rect.getLeft() <= this.x && this.x < rect.getRight()
        && rect.getTop() <= this.y && this.y < rect.getBottom());
};


/**
 * rectangle class for Lily engine
 * @param {{
 *     p1: number,
 *     p2: number,
 *     x: number,
 *     y: number,
 *     w: number,
 *     h: number, 
 *     x1: number,
 *     y1: number,
 *     x2: number,
 *     y2: number,
 * }} obj rectangle definition
 */
export function Rect(obj) {
    if (hasOwnProperties(obj, [ 'p1', 'p2' ])) {
        this.p1 = obj.p1.clone();
        this.p2 = obj.p2.clone();
    }
    else if (hasOwnProperties(obj, [ 'x', 'y', 'w', 'h' ])) {
        this.p1 = new Point(obj.x, obj.y);
        this.p2 = new Point(obj.x + obj.w, obj.y + obj.h);
    }
    else if (hasOwnProperties(obj, [ 'x1', 'y1', 'x2', 'y2' ])) {
        this.p1 = new Point(obj.x1, obj.y1);
        this.p2 = new Point(obj.x2, obj.y2);
    }
    else {
        throw new Error('Invalid parameter: ' + Object.keys(obj));
    }

    if (this.p2.x < this.p1.x) {
        const x = this.p2.x;
        this.p2.x = this.p1.x;
        this.p1.x = x;
    }

    if (this.p2.y < this.p1.y) {
        const y = this.p2.y;
        this.p2.y = this.p1.y;
        this.p1.y = y;
    }
}

/** @member {Point} p1 the point of Left Top */
Rect.prototype.p1 = null;

/** @member {Point} p2 the point of Right Bottom */
Rect.prototype.p2 = null;

/**
 * @returns {number} the top position
 */
Rect.prototype.getTop = function Rect_getTop() {
    return this.p1.y;
};

/**
 * @returns {number} the left position
 */
Rect.prototype.getLeft = function Rect_getLeft() {
    return this.p1.x;
};

/**
 * @returns {number} the bottom position
 */
Rect.prototype.getBottom = function Rect_getBottom() {
    return this.p2.y;
};

/**
 * @returns {number} the right position
 */
Rect.prototype.getRight = function Rect_getRight() {
    return this.p2.x;
};

/**
 * @returns {number} the rectangle width
 */
Rect.prototype.getWidth = function Rect_getWidth() {
    return this.p2.x - this.p1.x;
};

/**
 * @returns {number} the rectangle height
 */
Rect.prototype.getHeight = function Rect_getHeight() {
    return this.p2.y - this.p1.y;
};

/**
 * @return {Point} the point at Left Top
 */
Rect.prototype.getPointLT = function Rect_getPointLT() {
    return (this.p1);
};

/**
 * @return {Point} the point at Right Bottom
 */
Rect.prototype.getPointRB = function Rect_getPointRB() {
    return (this.p2);
};

/**
 * 
 * @param {Point} offset 
 */
Rect.prototype.move = function Rect_move(offset) {
    return new Rect({ 
        p1: this.p1.move(offset),
        p2: this.p2.move(offset)
    });
};

/**
 * move the rectangle horizontally
 * @param {number} x horizontal offset
 * @returns {Rect} the moved rectangle 
 */
Rect.prototype.moveX = function Rect_moveX(x) {
    return new Rect({ 
        p1: this.p1.moveX(x),
        p2: this.p2.moveX(x)
    });
};

/**
 * move the rectangle verticaly
 * @param {number} x vertical offset
 * @returns {Rect} the moved rectangle 
 */
Rect.prototype.moveY = function Rect_moveY(y) {
    return new Rect({ 
        p1: this.p1.moveY(y),
        p2: this.p2.moveY(y)
    });
};

/**
 * clone this rectangle
 * @returns {Rect} the cloned rectangle
 */
Rect.prototype.clone = function Rect_clone() {
    return new Rect({ 
        p1: this.p1,
        p2: this.p2
    });
};

/**
 * Lily Layer constructor
 * @param {HTMLCanvasElement} canvas 
 */
export function Layer(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
}

/**
 * @member canvas a canvas for this layer
 * @type {HTMLCanvasElement}
 */
Layer.prototype.canvas = null;

/**  
 * @member context canvas context
 * @type {CanvasRenderingContext2D}
 */
Layer.prototype.context = null;

/**
 * fill rectable by a color
 * @param {number} color a rectangle color
 * @param {Rect} rect  a rectangle to be filled
 */
Layer.prototype.fillRect = function Layer_fillRect(color, rect) {
    this.context.fillStyle = color;
    this.context.fillRect(
        rect.getLeft(),
        rect.getTop(),
        rect.getWidth(),
        rect.getHeight());
};

/**
 * draw image to a region from a region in a texture
 * @param {Image} texture 
 * @param {Rect} rect
 * @param {boolean} scaleToFit
 */
Layer.prototype.drawImage = function Layer_drawImage(texture, rect, scaleToFit) {
    if (!scaleToFit || (rect.getWidth() == texture.width && rect.getHeight() == texture.height)) {
        this.context.drawImage(texture, rect.getLeft(), rect.getTop());
    }
    else if (rect.getWidth() < texture.width || rect.getHeight() < texture.height) {
        this.context.drawImage(texture,
            rect.getLeft(), rect.getTop(), rect.getWidth(), rect.getHeight());
    }
    else {
        /*
         * bgr seven patch
         */
        const src_height = texture.height >> 1;
        const src_bottom = texture.height - src_height;
        const dst_bottom = rect.getHeight() - src_height;

        const src_width = texture.width >> 1;
        const src_right = texture.width - src_width;
        const dst_right = rect.getWidth() - src_width;

        /*
         * left-top, left-bottom, right-top, right-bottom
         */
        this.context.drawImage(texture,
            0, 0, src_width, src_height,
            rect.getLeft(), rect.getTop(), src_width, src_height);

        this.context.drawImage(texture,
            0, src_bottom, src_width, src_height,
            rect.getLeft(), rect.getTop() + dst_bottom, src_width, src_height);

        this.context.drawImage(texture,
            src_right, 0, src_width, src_height,
            rect.getLeft() + dst_right, rect.getTop(), src_width, src_height);

        this.context.drawImage(texture,
            src_right, src_bottom, src_width, src_height,
            rect.getLeft() + dst_right, rect.getTop() + dst_bottom, src_width, src_height);


        /*
         * complement top-band, bottom-band
         */
        if (src_width < dst_right) {
            this.context.drawImage(texture,
                src_width, 0, 1, src_height,
                rect.getLeft() + src_width, rect.getTop(), dst_right - src_width, src_height);

            this.context.drawImage(texture,
                src_width, src_bottom, 1, src_height,
                rect.getLeft() + src_width, rect.getTop() + dst_bottom, dst_right - src_width, src_height);
        }

        /*
         * complement left-band, right-band
         */
        if (src_height < dst_bottom) {
            this.context.drawImage(texture,
                0, src_height, src_width, 1,
                rect.getLeft(), rect.getTop() + src_height, src_width, dst_bottom - src_height);

            this.context.drawImage(texture,
                src_right, src_height, src_width, 1,
                rect.getLeft() + dst_right, rect.getTop() + src_height, src_width, dst_bottom - src_height);
        }

        /*
         * complement center block
         */
        if (src_width < dst_right && src_height < dst_bottom) {
            this.context.drawImage(texture,
                src_width, src_height, 1, 1,
                rect.getLeft() + src_width, rect.getTop() + src_height, dst_right - src_width, dst_bottom - src_height);
        }
    }
};

/**
 * draw text at a position
 * @param {string} text a text to be rendered
 * @param {{
 *     textAlign: string,
 *     textBaseline: string,
 *     textBorderStyle: string,
 *     textFillStyle: string,
 *     textFont: string,
 *     textLineHeight: number,
 * }} attr
 * @param {Rect} pos a point to render the text
 */
Layer.prototype.drawText = function Layer_drawText(text, attr, pos) {
    let x = pos.getLeft();
    let y = pos.getTop();

    if (attr.textAlign) {
        switch (attr.textAlign) {
        default:
            attr.textAlign = 'left';
        case 'left':
            x = pos.getLeft();
            break;

        case 'center':
            x = pos.getLeft() + (pos.getWidth() >> 1);
            break;

        case 'right':
            x = pos.getRight();
            break;
        }
        this.context.textAlign = attr.textAlign;
    }

    if (attr.textBaseline) {
        switch (attr.textBaseline) {
        default:
            attr.textBaseline = 'top';
        case 'top':
            y = pos.getTop();
            break;

        case 'middle':
            y = pos.getTop() + (pos.getHeight() >> 1);
            break;

        case 'bottom':
            y = pos.getBottom();
            break;
        }
        this.context.textBaseline = attr.textBaseline;
    }

    if (attr.textFont) {
        this.context.font = attr.textFont;
    }

    for (let line of text) {
        if (attr.textBorderStyle) {
            this.context.fillStyle = 'rgb(0, 0, 0)';
            this.context.fillText(text[i], x - 1, y - 1);
            this.context.fillText(text[i], x - 1, y + 1);
            this.context.fillText(text[i], x + 1, y - 1);
            this.context.fillText(text[i], x + 1, y + 1);
        }

        if (attr.textFillStyle) {
            this.context.fillStyle = attr.textFillStyle;
        }
        this.context.fillText(line, x, y);

        if (attr.textLineHeight) {
            y += attr.textLineHeight | 0;
        }
    }
};

/**
 * clip layer rendering region by a rectangle
 * @param {Rect} rect a rectangle to clip
 */
Layer.prototype.clip = function Layer_clip(rect) {
    const lt = rect.getPointLT();
    const rb = rect.getPointRB();

    this.context.beginPath();
    this.context.moveTo(lt.x, lt.y);
    this.context.lineTo(lt.x, rb.y);
    this.context.lineTo(rb.x, rb.y);
    this.context.lineTo(rb.x, lt.y);
    this.context.lineTo(lt.x, lt.y);
    this.context.closePath();
    this.context.clip();
};

/**
 * rotate layer context
 * @param {number} radian 
 */
Layer.prototype.rotate = function Layer_rotate(radian) {
    this.context.rotate(radian);
};

/**
 * translate rendering position
 * @param {Point} point a point to translate
 */
Layer.prototype.translate = function Layer_translate(point) {
    this.context.translate(point.x, point.y);
};

/**
 * set composite operation blend function
 * @param {string} blend_func blend function
 * @returns {string} old blend function
 */
Layer.prototype.setBlendFunc = function Layer_setBlendFunc(blend_func) {
    if (blend_func) {
        const gco = this.context.globalCompositeOperation;
        this.context.globalCompositeOperation = blend_func;
        return gco;
    }

    return null;
};

/**
 * set layer size
 * @param {number} w 
 * @param {number} h 
 */
Layer.prototype.setSize = function Layer_setSize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
};

/**
 * get image from current layer canvas
 * @returns {Image} image converted from canvas memory
 */
Layer.prototype.getImage = function Layer_getImage() {
    const img = new Image();
    img.src = this.canvas.toDataURL();
    return img;
};

/**
 * Lilium sprite
 * @param {Renderer} renderer 
 */
function Sprite(renderer) {
    this.renderer = renderer;
    this.children = [];
    this.listeners = {};
    this.attributes = {};
}

/** @type {Renderer} */
Sprite.prototype.renderer = null;

/** @type {Sprite[]} */
Sprite.prototype.children = null;

/** @type {Object} */
Sprite.prototype.listeners = null;

/** @type {Object} */
Sprite.prototype.attributes = null;

/** @type {boolean} */
Sprite.prototype.isUpdated = false;

Sprite.prototype.setAttribute = function Sprite_setAttribute(name, value) {
    if (this.attributes[name] !== value) {
        this.isUpdated = true;
        this.attributes[name] = value;
    }
};

Sprite.prototype.getArrtibute = function Sprite_getArrtibute(name) {
    return this.attributes[name];
};

/**
 * add component event listner
 * @param {string} event 
 * @param {function(Event): void} listener 
 */
Sprite.prototype.addEventListener = function Sprite_addEventListener(event, listener) {
    if (event in this.listeners) {
        this.listeners[event].push(listner);
    }
    else {
        this.listeners[event] = [ listener ];
    }
};

/**
 * append child
 * @param {Chescarna.Component} component 
 */
Sprite.prototype.appendChild = function Sprite_appendChild(component) {
    this.children.push(component.impl);
};

/**
 * remove child
 * @param {Chescarna.Component} component 
 */
Sprite.prototype.removeChild = function Sprite_removeChild(component) {
    this.children = this.children.filter((x) => x !== component.impl);
};

/**
 * draw sprite into layer
 * @param {Layer} layer 
 */
Sprite.prototype.draw = function Sprite_draw(layer, pos) {
    layer = layer || this.renderer.offscreen;
    if (this.attributes.show || !('show' in this.attributes)) {
        layer.context.save();

        /** @type {Rect} */
        let rect = this.attributes.rect || new Rect({ x: 0, y: 0, w: 0, h: 0 });

        if (pos) {
            rect = rect.move(pos);
        }

        if (this.attributes.rotate) {
            const x = rect.getLeft() + rect.getWidth() / 2.0;
            const y = rect.getTop() + rect.getHeight() / 2.0;
            const rad = Lily.angleToRadian(this.rotate);
            const new_point = new Point(
                Math.round(x * Math.cos(-rad) - y * Math.sin(-rad) - x, 0),
                Math.round(x * Math.sin(-rad) + y * Math.cos(-rad) - y, 0));
            layer.context.rotate(rad);
            rect = rect.move(new_point);
        }

        if (this.attributes.offset) {
            rect = rect.move(this.attributes.offset);
        }

        if (this.attributes.clip) {
            layer.clip(rect);
        }

        if (this.attributes.rectFillStyle) {
            layer.fillRect(this.attributes.rectFillStyle, rect);
        }

        if (this.attributes.image) {
            layer.drawImage(this.attributes.image, rect, this.attributes.imageScaleToFit);
        }

        if (this.attributes.textContent) {
            layer.drawText(this.attributes.textContent, this.attributes, rect);
        }

        for (let child of this.children) {
            child.draw(layer, rect.getPointLT());
        }

        layer.context.restore();
    }
};

Sprite.prototype.isTreeUpdated = function Sprite_isTreeUpdated() {
    if (this.isUpdated) {
        return true;
    }

    for (let child of this.children) {
        if (child.isTreeUpdated()) {
            return true;
        }
    }

    return false;
}

/**
 * Lily Layer renderer
 * @param {HTMLCanvasElement} canvas
 */
export function Renderer(canvas) {
    this.screen = new Layer(canvas);
    this.offscreen = new Layer(document.createElement('canvas'));
    this.offscreen.setSize(this.screen.canvas.width, this.screen.canvas.height);
}

/**
 * @member screen
 * @type {Layer}
 */
Renderer.prototype.screen = null;

/**
 * @member offscreen
 * @type {Layer}
 */
Renderer.prototype.offscreen = null;

/**
 * render current state
 * @param {Chescarna.Component[]} component
 */
Renderer.prototype.render = function Renderer_render(component) {
    if (this.screen.canvas.width * this.screen.canvas.height) {
        this.offscreen.setSize(this.screen.canvas.width, this.screen.canvas.height);

        const self = this;
        requestAnimationFrame(function() {
            component.forEach(function(comp) {
                comp.updateRecursive();
            });
            component.forEach(function(comp) {
                comp.impl.draw();
            });
            self.screen.context.drawImage(self.offscreen.canvas, 0, 0)
        });
    }
};

/**
 * build Chescarna view
 * @param {Chescarna.View} view
 * @param {Object[]} context
 */
Renderer.prototype.buildView = function Renderer_buildView(view, context) {
    return view.build((tagName) => this.createComponent(tagName), [ { renderer: this }, ...context ]);
};

Renderer.prototype.createComponent = function Renderer_createComponent(tagName) {
    return new Chescarna.Component(new Sprite(this));
};

Renderer.prototype.setSize = function Renderer_setSize(width, height) {
    this.screen.setSize(width, height);
    this.offscreen.setSize(width, height);
};
