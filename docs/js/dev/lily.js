'use strict'

import * as ImageLoader from '../valmir/nina.js';
const { Filesystem } = window.bgrsp;

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
 * @param {Rectangle} rect  a rectangle to be filled
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
 * @param {Rect} rect1 
 * @param {Rect} rect2 
 */
Layer.prototype.drawImage = function Layer_drawImage(texture, rect1, rect2) {
    if (rect2) {
        const src = rect1;
        const dst = rect2;
        this.context.drawImage(texture,
            src.getLeft(), src.getTop(), src.getWidth(), src.getHeight(),
            dst.getLeft(), dst.getTop(), dst.getWidth(), dst.getHeight());
    }
    else {
        const dst = rect1;
        if (dst.getWidth() < texture.width || dst.getHeight() < texture.height || (dst.getWidth() == texture.width && dst.getHeight() == texture.height)) {
            this.context.drawImage(texture,
                dst.getLeft(), dst.getTop(), dst.getWidth(), dst.getHeight());
        }
        else {
            /*
             * bgr seven patch
             */
            const src_height = texture.height >> 1;
            const src_bottom = texture.height - src_height;
            const dst_bottom = dst.getHeight() - src_height;

            const src_width = texture.width >> 1;
            const src_right = texture.width - src_width;
            const dst_right = dst.getWidth() - src_width;

            /*
             * left-top, left-bottom, right-top, right-bottom
             */
            this.context.drawImage(texture,
                0, 0, src_width, src_height,
                dst.getLeft(), dst.getTop(), src_width, src_height);

            this.context.drawImage(texture,
                0, src_bottom, src_width, src_height,
                dst.getLeft(), dst.getTop() + dst_bottom, src_width, src_height);

            this.context.drawImage(texture,
                src_right, 0, src_width, src_height,
                dst.getLeft() + dst_right, dst.getTop(), src_width, src_height);

            this.context.drawImage(texture,
                src_right, src_bottom, src_width, src_height,
                dst.getLeft() + dst_right, dst.getTop() + dst_bottom, src_width, src_height);


            /*
             * complement top-band, bottom-band
             */
            if (src_width < dst_right) {
                this.context.drawImage(texture,
                    src_width, 0, 1, src_height,
                    dst.getLeft() + src_width, dst.getTop(), dst_right - src_width, src_height);

                this.context.drawImage(texture,
                    src_width, src_bottom, 1, src_height,
                    dst.getLeft() + src_width, dst.getTop() + dst_bottom, dst_right - src_width, src_height);
            }

            /*
             * complement left-band, right-band
             */
            if (src_height < dst_bottom) {
                this.context.drawImage(texture,
                    0, src_height, src_width, 1,
                    dst.getLeft(), dst.getTop() + src_height, src_width, dst_bottom - src_height);

                this.context.drawImage(texture,
                    src_right, src_height, src_width, 1,
                    dst.getLeft() + dst_right, dst.getTop() + src_height, src_width, dst_bottom - src_height);
            }

            /*
             * complement center block
             */
            if (src_width < dst_right && src_height < dst_bottom) {
                this.context.drawImage(texture,
                    src_width, src_height, 1, 1,
                    dst.getLeft() + src_width, dst.getTop() + src_height, dst_right - src_width, dst_bottom - src_height);
            }

        }
    }
};

/**
 * draw text at a position
 * @param {string} text a text to be rendered
 * @param {Point} pos a point to render the text
 */
Layer.prototype.drawText = function Layer_drawText(text, pos) {
    let x;
    let y;

    switch (text.halign) {
    default:
        text.halign = 'left';
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

    switch (text.valign) {
    default:
        text.valign = 'top';
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

    console.log(text, x, y);

    this.context.textAlign = text.halign;
    this.context.textBaseline = text.valign;
    this.context.font = text.font;
    for (let i in text.string) {
        this.context.fillStyle = 'rgb(0, 0, 0)';
        this.context.fillText(text.string[i], x - 1, y - 1);
        this.context.fillText(text.string[i], x - 1, y + 1);
        this.context.fillText(text.string[i], x + 1, y - 1);
        this.context.fillText(text.string[i], x + 1, y + 1);

        this.context.fillStyle = text.color;
        this.context.fillText(text.string[i], x, y);

        y += text.line_height | 0;
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
 * Lily Layer renderer
 * @param {HTMLCanvasElement} canvas
 */
export function Renderer(canvas) {
    this.screen = new Layer(canvas);
    this.screen.canvas.addEventListener('click', this.handleEvent.bind(this));
    this.screen.canvas.addEventListener('mousedown', this.handleEvent.bind(this));
    this.screen.canvas.addEventListener('mousemove', this.handleEvent.bind(this));
    this.screen.canvas.addEventListener('mouseup', this.handleEvent.bind(this));

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
 * @member sprite
 * @type {Sprite}
 */
Renderer.prototype.sprite = null;

/**
 * @member audio
 * @type {Array<AudioPlayer>}
 */
Renderer.prototype.audio = null;

/**
 * @member timer
 * @type {number}
 */
Renderer.prototype.timer = null;

/**
 * @member mouse_session
 * @type {MouseSession}
 */
Renderer.prototype.mouse_session = null;

/**
 * @returns {Object} constructor for Lily engine classes
 */
Renderer.prototype.getFactory = function Renderer_getFactory() {
    return {
        Layer,
        Rect,
        Point,
        Texture,
    };
};

/**
 * render current state
 */
Renderer.prototype.render = function Renderer_render() {
    if (this.sprite && this.sprite.isUpdated()) {
        this.sprite.draw(this.offscreen);
        const self = this;
        requestAnimationFrame(function() {
            self.screen.context.drawImage(self.offscreen.canvas, 0, 0)
        });
    }
};

/**
 * start this renderer
 * @param {Sprite} sprite 
 * @param {Array<AudioPlayer>} audio 
 */
Renderer.prototype.start = function Renderer_start(sprite, audio) {
    this.sprite = sprite;
    this.audio = audio;

    this.timer = setInterval(this.render.bind(this), 1.0 / 60);
    for (let i in this.audio) {
        audio[i].play();
    }
};

/**
 * stop this renderer
 */
Renderer.prototype.stop = function Renderer_stop() {
    for (let i in this.audio) {
        audio[i].pause();
    }
    clearInterval(this.timer);

    this.timer = null;
    this.audio = null;
    this.sprite = null;
},

/**
 * handle mouse event
 * @param {MouseEvent} event MouseEvent to be handled
 */
Renderer.prototype.handleEvent = function Renderer_handleEvent(event) {
    if (this.sprite) {
        switch (event.type) {
        case 'mousedown':
            this.mouse_session = new Lily.MouseSession(event);
            this.sprite.handleEvent(this.mouse_session, new Lily.Point(0, 0));
            this.mouse_session.postEvent(this.mouse_session.makeEvent(event));
            break;
        case 'mousemove':
            if (this.mouse_session) {
                this.mouse_session.postEvent(this.mouse_session.makeEvent(event));
            }
            break;
        case 'mouseup':
            if (this.mouse_session) {
                const click_event = this.mouse_session.makeEvent(event);
                click_event.type ='click';
                try {
                    this.mouse_session.postEvent(this.mouse_session.makeEvent(event));
                    this.mouse_session.postEvent(click_event);
                }
                catch (e) {
                    console.error(e);
                }
                this.mouse_session = null;
            }
            break;
        default:
            break;
        }
    }
};

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
 * @param {Object} obj rectangle definition
 */
export function Rect(obj) {
    if (checkProperties(obj, [ 'p1', 'p2' ])) {
        this.p1 = obj.p1.clone();
        this.p2 = obj.p2.clone();
    }
    else if (checkProperties(obj, [ 'x', 'y', 'w', 'h' ])) {
        this.p1 = new Lily.Point(obj.x, obj.y);
        this.p2 = new Lily.Point(obj.x + obj.w, obj.y + obj.h);
    }
    else if (checkProperties(obj, [ 'x1', 'y1', 'x2', 'y2' ])) {
        this.p1 = new Lily.Point(obj.x1, obj.y1);
        this.p2 = new Lily.Point(obj.x2, obj.y2);
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
 * text for Lily engine
 * @param {Object} props text properties
 */
export function Text(props) {
    this.string = [];
    this.color = props.color;
    this.font = props.font;
    this.line_height = props.line_height;
    this.halign = props.halign;
    this.valign = props.valign;
    this.wrap_width = props.wrap_width;
    this.setString(props.string);
}

/** @type {string} @member string text string */
Text.prototype.string = null;

/** @type {number} @member color text color */
Text.prototype.color = 'ffffff';

/** @type {string} @member font text font */
Text.prototype.font = '';

/** @type {number} @member line_height line height in pixel */
Text.prototype.line_height = 0;

/** @type {number} @member wrap_width line wrapping width */
Text.prototype.wrap_width = null;

/** @type {string} @member halingn text horizontal align */
Text.prototype.halign = null;

/** @type {string} @member valign text vertical align */
Text.prototype.valign = null;

/**
 * set text string
 * @param {string} str text string
 */
Text.prototype.setString = function Text_setString(str) {
    this.string = [];

    const strings = (str || '').split('\n');
    for (let i in strings) {
        let s = strings[i];
        if (this.wrap_width) {
            while (this.wrap_width < s.length) {
                this.string.push(s.substring(0, this.wrap_width))
                s = s.substring(this.wrap_width);
            }
        }
        this.string.push(s);
    }
};

/**
 * read an image from a path
 * @param {string} path a path to read image
 * @returns {HTMLImageElement} a read image 
 */
export function Texture(path) {
    return readImage(path);
}

/**
 * sprite for Lily engine
 */
export function Sprite() {
    this.children = [];
    this.event_listeners = {};
    this.region = makeOrigin();
}

/**
 * @member parent parent sprite
 * @type {Sprite}
 */
Sprite.prototype.parent = null;

/**
 * @member children list of children
 * @type {Sprite[]} 
 */
Sprite.prototype.children = null;

/**
 * @member crop cropping region
 * @type {Rect} 
 */
Sprite.prototype.crop = null;

/**
 * @member region region in a layer
 * @type {Rect} 
 */
Sprite.prototype.region = null;

/**
 * @member fill_color color to sprite region
 * @type {number}
 */
Sprite.prototype.fill_color = null;

/**
 * @member texture a texture to be rendered as sprite
 * @type {HTMLImageElement}
 */
Sprite.prototype.texture = null;

/**
 * @member text a text to be rendered as sprite
 * @type {Text}
 */
Sprite.prototype.text = null;

/**
 * @member isShown sprite visibility state
 * @type {boolean}
 */
Sprite.prototype.isShown = true;

/**
 * @member clip sprite clipping state
 * @type {boolean}
 */
Sprite.prototype.clip = false;

/**
 * @member offset sprite rendering offset
 * @type {Point}
 */
Sprite.prototype.offset = null;

/**
 * @member update sprite update state
 * @type {boolean}
 */
Sprite.prototype.update = false;

/**
 * @member event_listeners sprite event listener map
 * @type {Object}
 */
Sprite.prototype.event_listeners = null;

/**
 * @member composition_operation layer composition operation for this sprite
 * @type {string}
 */
Sprite.prototype.composition_operation = null;

/**
 * draw sprite at a position of a renderer
 * @param {Renderer} renderer a renderer to draw
 * @param {Point} pos - a point in the renderer
 */
Sprite.prototype.draw = function Sprite_draw(renderer, pos) {
    if (this.isShown) {
        let rect = this.region;
        if (pos) {
            rect = rect.move(pos);
        }

        if (this.rotate) {
            const x = rect.getLeft() + rect.getWidth() / 2.0;
            const y = rect.getTop() + rect.getHeight() / 2.0;
            const rad = Lily.angleToRadian(this.rotate);
            const new_point = new Lily.Point(
                Math.round(x * Math.cos(-rad) - y * Math.sin(-rad) - x, 0),
                Math.round(x * Math.sin(-rad) + y * Math.cos(-rad) - y, 0));
            renderer.context.save();
            renderer.rotate(rad);
            rect = rect.move(new_point);
        }
        if (this.clip) {
            renderer.context.save();
            renderer.clip(rect);
        }
        if (this.offset) {
            rect = rect.move(this.offset);
        }

        this.fillRect(renderer, rect);
        this.drawTexture(renderer, rect);
        this.drawText(renderer, rect);
        this.drawChildren(renderer, rect);
        this.update = false;

        if (this.clip) {
            renderer.context.restore();
        }
        if (this.rotate) {
            renderer.context.restore();
        }
    }
};

/**
 * @returns {boolean} whether this sprite is updated
 */
Sprite.prototype.isUpdated = function Sprite_isUpdated() {
    if (this.isShown) {
        let update = this.update;
        for (let i in this.children) {
            update = update || this.children[i].isUpdated();
        }
        return update;
    }

    return false;
};

/**
 * add a child sprite
 * @param {Sprite} child a child sprite to be added
 */
Sprite.prototype.addChild = function Sprite_addChild(child) {
    if (child && 'draw' in child) {
        this.children.push(child);
        child.setParent(this);
        this.update = true;
    }
};

/**
 * add sprite event handler for specific event type
 * @param {string} type sprite event type
 * @param {Function} listener sprite event listener
 */
Sprite.prototype.addEventListener = function Sprite_addEventListener(type, listener) {
    if (listener) {
        if (type in this.event_listeners) {
            this.event_listeners[type].push(listener);
        }
        else {
            this.event_listeners[type] = [ listener ];
        }
    }
};

/**
 * set parent sprite
 * @param {Sprite} parent a parent sprite to be set
 */
Sprite.prototype.setParent = function Sprite_setParent(parent) {
    if (this.parent != parent) {
        this.parent = parent;
        this.update = true;
    }
};

/**
 * set crop retion
 * @param {Rect} crop a cropping region
 */
Sprite.prototype.setCrop = function Sprite_setCrop(crop) {
    this.crop = crop;
    this.update = true;
},

/**
 * set sprite region
 * @param {Rect} region sprite region
 */
Sprite.prototype.setRegion = function Sprite_setRegion(region) {
    this.region = region;
    this.update = true;
};

/**
 * set sprite fill color
 * @param {number} color 
 */
Sprite.prototype.setColor = function Sprite_setColor(color) {
    if (this.fill_color != color) {
        this.fill_color = color;
        this.update = true;
    }
};

/**
 * set sprite texture
 * @param {Image} texture a sprite texture
 */
Sprite.prototype.setTexture = function Sprite_setTexture(new_texture) {
    if (this.texture != new_texture) {
        if (new_texture) {
            const self = this;
            imgOnLoad(new_texture, function() {
                self.texture = new_texture;
                self.update = true;
            });
        }
        else {
            this.texture = new_texture;
            this.update = true;
        }
    }
};

/**
 * set text sprite
 * @param {Text} text a text sprite
 */
Sprite.prototype.setText = function Sprite_setText(text) {
    this.text = text;
    this.update = true;
};

/**
 * set text string
 * @param {string} str a text string
 */
Sprite.prototype.setString = function Sprite_setString(str) {
    if (this.text) {
        this.text.setString(str);
    }
    this.update = true;
};

/**
 * set sprite clipping state
 * @param {boolean} clip clipping state
 */
Sprite.prototype.setClip = function Sprite_setClip(clip) {
    this.clip = clip;
    this.update = true;
};

/**
 * set rotation radian
 * @param {number} rotate rotation radian 
 */
Sprite.prototype.setRotate = function Sprite_setRotate(rotate) {
    this.rotate = rotate;
    this.update = true;
};

/**
 * translate the sprite position with a point
 * @param {Point} point a point to translate sprite position
 */
Sprite.prototype.translate = function Sprite_translate(point) {
    this.offset = point;
};

/**
 * scroll this sprite
 * @param {Point} point a point in a scroll region
 */
Sprite.prototype.scroll = function Sprite_scroll(point) {
    const size = this.getTreeSize(this.region.getPointLT().invert());
    this.translate(new Point(
        -point.x * Math.max(0, size.width - this.region.getWidth()),
        -point.y * Math.max(0, size.height - this.region.getHeight())));
};

/**
 * calculate and get whole size of the sprite and its children
 * @param {Point} origin a point origin
 * @returns {Object} sprite tree size
 */
Sprite.prototype.getTreeSize = function Sprite_getTreeSize(origin) {
    let size = {
        width: origin.x + this.region.getRight(),
        height: origin.y + this.region.getBottom(),
    };

    if (this.children.length) {
        const pos = this.region.move(origin).getPointLT();
        for (let i in this.children) {
            if (this.children[i].isShown) {
                const child_size = this.children[i].getTreeSize(pos);
                size.width = Math.max(size.width, child_size.width);
                size.height = Math.max(size.height, child_size.height);
            }
        }
    }

    return size;
};

/**
 * handle mouse event
 * @param {Object} event an event to be handled
 * @param {Point} origin an origin point of the event
 * @returns {boolean} whether the event is handled
 */
Sprite.prototype.handleEvent = function Sprite_handleEvent(event, origin) {
    let handled = false;

    const hit_region = this.region.move(origin);
    if (this.isShown && event.origin.isIncludedBy(hit_region)) {
        origin = hit_region.getPointLT();
        if (this.offset) {
            origin = origin.move(this.offset);
        }

        for (let i = this.children.length - 1; !handled && 0 <= i; --i) {
            handled = this.children[i].handleEvent(event, origin);
        }

        if (!handled && Object.keys(this.event_listeners).length) {
            let self = this;
            for (let type in this.event_listeners) {
                event.addEventListener(type, function(session_event) {
                    self.postEvent(session_event);
                });
            }
            handled = true;
        }
    }

    return handled;
};

/**
 * post mouse event to event listeners
 * @param {Object} event mouse event 
 */
Sprite.prototype.postEvent = function Sprite_postEvent(event) {
    if (event.type in this.event_listeners) {
        for (let i in this.event_listeners[event.type]) {
            this.event_listeners[event.type][i](event);
        }
        return true;
    }

    return false;
};

/**
 * fill a rectangle on a renderer by fill color
 * @param {Renderer} renderer - renderer to fill
 * @param {Rect} rect - rect to be filled
 */
Sprite.prototype.fillRect = function prite_fillRect(renderer, rect) {
    if (this.fill_color) {
        renderer.fillRect(this.fill_color, rect);
    }
};

/**
 * draw texture into a rectangle on a renderer
 * @param {Renderer} renderer 
 * @param {Rect} rect 
 */
Sprite.prototype.drawTexture = function Sprite_drawTexture(renderer, rect) {
    if (this.texture && this.texture.src && this.texture.complete) {
        if (this.crop) {
            renderer.drawImage(this.texture, this.crop, rect);
        }
        else {
            renderer.drawImage(this.texture, rect);
        }
    }
};

/**
 * draw text into a rectangle on a renderer
 * @param {Renderer} renderer 
 * @param {Rect} rect 
 */
Sprite.prototype.drawText = function Sprite_drawText(renderer, rect) {
    if (this.text) {
        renderer.drawText(this.text, rect);
    }
};

/**
 * draw sprite children into a rectangle on a renderer
 * @param {Renderer} renderer 
 * @param {Rect} rect 
 */
Sprite.prototype.drawChildren = function Sprite_drawChildren(renderer, rect) {
    if (this.children.length) {
        let pos = rect.getPointLT();
        for (let i in this.children) {
            this.children[i].draw(renderer, pos);
        }
    }
};

/**
 * set sprite state to show
 */
Sprite.prototype.show = function Sprite_show() {
    if (!this.isShown) {
        this.isShown = true;
        this.update = true;
    }
};

/**
 * set sprite state to hide
 */
Sprite.prototype.hide = function Sprite_hide() {
    if (this.isShown) {
        this.isShown = false;
        this.update = true;
    }
};

/**
 * audio player class for Lily engine
 */
export function AudioPlayer() {
}

/**
 * @member path current media path
 * @type {string}
 */
AudioPlayer.prototype.path = null;

/**
 * @member media audio media
 * @type {Audio}
 */
AudioPlayer.prototype.media = null;

/**
 * @member volume audio volue
 * @type {number}
 */
AudioPlayer.prototype.volume = 1;

/**
 * @member loop whether audio play is loop
 * @type {boolean}
 */
AudioPlayer.prototype.loop = false;

/**
 * @member isPlaying whether current media is playing now 
 * @type {boolean}
 */
AudioPlayer.prototype.isPlaying = false;

/**
 * load audio media from path
 * @param {string} filename 
 */
AudioPlayer.prototype.load = function Audio_load(filename) {
    if (this.path != filename) {
        const self = this;
        Filesystem.readFile(filename, function(data) {
            const media = new Audio();
            media.src = window.URL.createObjectURL(new Blob([ data ], { type: 'audio/mpeg' }));
            media.volume = self.volume;
            media.loop = self.loop;

            self.unload();
            self.path = filename;
            self.media = media;

            if (self.isPlaying) {
                self.media.play();
            }
        });
    }
};

/**
 * unload current audio media
 */
AudioPlayer.prototype.unload = function Audio_unload() {
    if (this.media) {
        this.media.pause();
        window.URL.revokeObjectURL(this.media.src);
        this.media = null;
    }
};

/**
 * starts to play audio
 */
AudioPlayer.prototype.play = function Audio_play() {
    if (!this.isPlaying) {
        this.isPlaying = true;
        if  (this.media) {
            this.media.play();
        }
    }
};

/**
 * stop audio
 */
AudioPlayer.prototype.pause = function Audio_pause() {
    if (this.isPlaying) {
        this.isPlaying = false;
        if  (this.media) {
            this.media.pause();
        }
    }
},

/**
 * set audio play loop
 * @param {boolean} loop whether audio play is loop
 */
AudioPlayer.prototype.setLoop = function Audio_setLoop(loop) {
    this.loop = loop;
    if (this.media) {
        this.media.loop = loop;
    }
};

/**
 * set audio volume
 * @param {number} volume audio volume
 */
AudioPlayer.prototype.setVolume = function Audio_setVolume(volume) {
    this.volume = volume;
    if (this.media) {
        this.media.volume = volume;
    }
};

/**
 * @class Lily MouseSession class
 * @param {MouseEvent} event 
 */
export function MouseSession(event) {
    this.origin = new Point(event.offsetX, event.offsetY);
    this.listeners = {};
}

/** @member {Point} origin a point the session started */
MouseSession.prototype.origin = null,

/** @member {Object} listeners mouse session event listeners */
MouseSession.prototype.listeners = null,

/**
 * add event lister for mouse session event
 * @param {string} type 
 * @param {Function} listener 
 */
MouseSession.prototype.addEventListener = function MouseSession_addEventListener(type, listener) {
    if (listener) {
        if (type in this.listeners) {
            this.listeners[type].push(listener);
        }
        else {
            this.listeners[type] = [ listener ];
        }
    }
};

/**
 * post a mouse session event and invoke associated handlers
 * @param {Object} event a mouse session event
 */
MouseSession.prototype.postEvent = function MouseSession_postEvent(event) {
    if (event.type in this.listeners) {
        for (let i in this.listeners[event.type]) {
            this.listeners[event.type][i](event);
        }
    }
};

/**
 * make mouse session event from MouseEvent
 * @param {MouseEvent} event a source event to make a mouse session event
 * @returns {Object} mouse session event
 */
MouseSession.prototype.makeEvent = function MouseSession_makeEvent(event) {
    return {
        type: event.type,
        point: new Lily.Point(event.offsetX, event.offsetY),
        offset: new Lily.Point(event.offsetX - this.origin.x, event.offsetY - this.origin.y),
        origin: this.origin.clone()
    };
};

/**
 * make an origin rectangle
 * @returns {Rect} an origin rectanble
 */
export function makeOrigin() {
    return new Rect({
        p1: new Point(0, 0),
        p2: new Point(0, 0)
    });
}

/**
 * read and cache image from path
 * @param {string} path a path to read image
 * @returns {HTMLImageElement} a read image
 */
export function readImage(path) {
        if (!(path in readImage.cache)) {
            readImage.cache[path] = ImageLoader.readAsImage(path);
        }
        return readImage.cache[path];
}

/**
 * @property {Object} image cache map
 */
readImage.cache = {};

/**
 * convert an angle to radian
 * @param {number} angle an angle to be converted to a radion
 */
export function angleToRadian(angle) {
    return angle / 180.0 * Math.PI;
}

