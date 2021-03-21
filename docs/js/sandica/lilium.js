/**
 * @file lilium.js
 * @description Lilium the Best Girl and the Canvas Component Implementation for Chescarna view
 * @author hifmac(E32456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import { makeError } from '../blanc/lisette.js';
import * as Chescarna from '../demonia/chescarna.js';

/**
 * @class lilium event
 */
class LiliumEvent {
    /**
     * @constructor
     * @param {string} name 
     * @param {any} data 
     */
    constructor(name, data) {
        this.#name = name;
        this.#data = data;
    }

    get name() {
        return this.#name;
    }

    get data() {
        return this.#data;
    }

    /** @type {string} */
    #name = null;

    /** @type {any} */
    #data = null;
}

/**
 * @typedef {(LiliumEvent) => void} LiliumEventListener
 */

 /**
  * @class lilium component base
  */
class LiliumBase {
    /**
     * @constructor
     * @param {string} id 
     */
    constructor(id) {
        this.#id = id;
        this.#listeners = {};
    }

    /**
     * draw
     * @param {CanvasRenderingContext2D} context
     */
    draw(context) {
        throw makeError(`${this.type} doesn't implement draw method`);
    }

    /**
     * get attribute
     * @param {string} name 
     */
    getAttribute(name) {
        throw makeError(`${this.type} doesn't implement attribute getter`);
    }

    /**
     * set attibute
     * @param {string} name 
     * @param {any} value 
     */
    setAttribute(name, value) {
        throw makeError(`${this.type} doesn't implement attribute setter`);
    }

    /**
     * add event listener
     * @param {string} name 
     * @param {LiliumEventListener} listener 
     */
    addEventListener(name, listener) {
        if (name in this.#listeners) {
            this.#listeners[name].push(listener);
        }
        else {
            this.#listeners[name] = [ listener ];
        }
    }

    /**
     * invoke lilium event
     * @param {LiliumEvent} event 
     */
    dispatchEvent(event) {
        for (const listener of this.#listeners[event.name]) {
            listener(event);
        }
    }

    /**
     * append child
     * @param {LiliumBase} child 
     */
    appendChild(child) {
        throw makeError(`${this.type} doesn't support child`);
    }

    /**
     * remove child
     * @param {LiliumBase} child 
     */
    removeChild(child) {
        throw makeError(`${this.type} doesn't support child`);
    }

    /**
     * clear all children
     */
    clearChildren() {
        throw makeError(`${this.type} doesn't support child`);
    }

    get type() {
        return 'base';
    }

    get id() {
        return this.#id;
    }

    #id = null;

    /** @type {Object.<string, LiliumEventListener[]>} */
    #listeners = null;
}

class LiliumSprite extends LiliumBase {
    /**
     * @constructor
     * @param {string} id 
     */
    constructor(id) {
        super(id);
    }

    /**
     * draw
     * @param {CanvasRenderingContext2D} context
     */
    draw(context) {
        context.save();

        context.translate(this.#rect[0], this.#rect[1]);

        for (const child of this.#children) {
            child.draw(context);
        }

        context.restore();
    }

    /**
     * get attribute
     * @param {string} name 
     */
    getAttribute(name) {
        switch(name) {
        case "rect":
            return this.#rect;
        default:
            super.getAttribute(name);
            break;
        }
    }

    /**
     * set attibute
     * @param {string} name 
     * @param {any} value 
     */
    setAttribute(name, value) {
        switch(name) {
        case "rect":
            if (Array.isArray(value) && value.length == 4) {
                this.#rect = value;
            }
            else {
                throw makeError('rect should be 4 element array');
            }
            break;
        default:
            super.setAttribute(name, value);
            break;
        }
    }

    /**
     * append child
     * @param {LiliumBase} child 
     */
    appendChild(child) {
        this.#children.push(child);
    }

    /**
     * remove child
     * @param {LiliumBase} child 
     */
    removeChild(child) {
        this.#children = this.#children.filter((x) => x != child);
    }

    /**
     * clear all children
     */
    clearChildren() {
        this.#children =[];
    }

    get type() {
        return 'sprite';
    }

    /** @type {number[]} */
    #rect = [ 0, 0, 0, 0 ];

    /** @type {LiliumBase[]} */
    #children = null;
}

class LiliumFill extends LiliumBase {
     /**
     * @constructor
     * @param {string} id
     */
    constructor(id) {
        super(id);
    }

    /**
     * draw
     * @param {CanvasRenderingContext2D} context
     */
    draw(context) {
        if (this.#rect) {
            context.fillStyle = this.#color;
            context.fillRect(this.#rect[0], this.#rect[1], this.#rect[2], this.#rect[3]);
        }
    }

    /**
     * get attribute
     * @param {string} name 
     */
    getAttribute(name) {
        switch(name) {
        case "color":
            return this.#color;
        case "rect":
            return (this.#rect || []);
        default:
            super.getAttribute(name);
            break;
        }
    }

    /**
     * set attibute
     * @param {string} name 
     * @param {any} value 
     */
    setAttribute(name, value) {
        switch(name) {
        case "color":
            this.#color = value;
            break;
        case "rect":
            if (Array.isArray(value) && value.length === 4) {
                this.#rect = value;
            }
            break;
        default:
            super.setAttribute(name, value);
            break;
        }
    }

    get type() {
        return 'fill';
    }

    /** @type {string} */
    #color = 'rgb(0, 0, 0)';

    /** @type {number[]} */
    #rect = null;
}

class LiliumImage extends LiliumBase {
    /**
     * @constructor
     * @param {string} id
     */
    constructor(id) {
        super(id);
    }

    /**
     * draw
     * @param {CanvasRenderingContext2D} context
     */
    draw(context) {
        if (this.#src) {
            if (this.#flip) {
                context.save();
                context.setTransform(-1, 0, 0, 1, 0, 0);
            }

            if (this.#dstRect) {
                if (this.#srcRect) {
                    context.drawImage(this.#src,
                        this.#srcRect[0], this.#srcRect[1], this.#srcRect[2], this.#srcRect[3],
                        this.#dstRect[0], this.#dstRect[1], this.#dstRect[2], this.#dstRect[3]);
                }
                else if (this.#dstRect.length == 2) {
                    context.drawImage(this.#src,
                        this.#dstRect[0], this.#dstRect[1]);
                }
                else {
                    context.drawImage(this.#src,
                        this.#dstRect[0], this.#dstRect[1], this.#dstRect[2], this.#dstRect[3]);
                }
            }
            else {
                context.drawImage(this.#src, 0, 0);
            }

            if (this.#flip) {
                context.restore();
            }
        }
    }

    /**
     * get attribute
     * @param {string} name 
     */
    getAttribute(name) {
        switch(name) {
        case 'src':
            return this.#src;
        case 'rect':
            return (this.#srcRect || []).concat(this.#dstRect || []);
        case 'flip':
            return this.#flip;
        default:
            super.getAttribute(name);
            break;
        }
    }

    /**
     * set attibute
     * @param {string} name 
     * @param {any} value 
     */
    setAttribute(name, value) {
        switch(name) {
        case 'src':
            this.#src = value;
            break;
        case 'rect':
            if (Array.isArray(value)) {
                if (value.length === 2 || value.length === 4) {
                    this.#srcRect = null;
                    this.#dstRect = value.slice();
                }
                else if (value.length === 8) {
                    this.#srcRect = value.slice(0, 4);
                    this.#dstRect = value.slice(4, 8);
                }
                else {
                    throw makeError(`Invalid array length: ${value.length}`);
                }
            }
            break;
        case 'flip':
            this.#flip = value;
            break;
        default:
            super.setAttribute(name, value);
            break;
        }
    }

    get type() {
        return 'image';
    }

    /** @type {HTMLImageElement | HTMLCanvasElement} */
    #src = null;

    /** @type {number[]} */
    #srcRect = null;

    /** @type {number[]} */
    #dstRect = null;

    /** @type {boolean} */
    #flip = false;
}

class LiliumText extends LiliumBase {
    /**
     * @constructor
     * @param {string} id
     */
    constructor(id) {
        super(id);
    }

    fillText(context, s, x, y) {
        if (this.#border) {
            context.fillStyle = 'rgb(0, 0, 0)';
            context.fillText(s, x + 1, y - 1);
            context.fillText(s, x + 1, y + 1);
            context.fillText(s, x + 1, y - 1);
            context.fillText(s, x + 1, y + 1);
        }

        context.fillStyle = this.#color;
        context.fillText(s, x, y);
    }

    /**
     * draw
     * @param {CanvasRenderingContext2D} context
     */
    draw(context) {
        const x = this.#leftTop[0];
        let y = this.#leftTop[1];
 
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.font = this.#font;
        console.log(context.font);
        for (const s of this.#textContent.split('\n')) {
            if (this.#wrapWidth) {
                for (let i = 0; i < s.length; i += this.#wrapWidth) {
                    this.fillText(context, s.substring(i, i + this.#wrapWidth), x, y);
                    y += this.#lineHeight | 0;    
                }
            }
            else {
                this.fillText(context, s, x, y);
                y += this.#lineHeight | 0;
            }
        }
    }

    /**
     * get attribute
     * @param {string} name 
     */
    getAttribute(name) {
        switch(name) {
        case 'textContent':
            return this.#textContent;
        case 'font':
            return this.#font;
        case 'color':
            return this.#color;
        case 'lineHeight':
            return this.#lineHeight;
        case 'wrapWidth':
            return this.#wrapWidth;
        case 'leftTop':
            return this.#leftTop;
        case 'border':
            return this.#border;
        default:
            super.getAttribute(name);
            break;
        }
    }

    /**
     * set attibute
     * @param {string} name 
     * @param {any} value 
     */
    setAttribute(name, value) {
        switch(name) {
        case 'textContent':
            this.#textContent = value;
            break;
        case 'font':
            console.log(value);
            this.#font = value;
            break;
        case 'color':
            this.#color = value;
            break;
        case 'lineHeight':
            this.#lineHeight = value;
            break;
        case 'wrapWidth':
            this.#wrapWidth = value;
            break;
        case 'leftTop':
            if (Array.isArray(value) && value.length === 2) {
                this.#leftTop = value;
            }
            else {
                throw makeError(`Invalid array length: ${value.length}`);
            }
            break;
        case 'border':
            this.#border = value;
            break;
        default:
            super.setAttribute(name, value);
            break;
        }
    }

    get type() {
        return 'text';
    }

    /** @type {string} */
    #textContent = null;

    /** @type {string} */
    #font = null;

    /** @type {string} */
    #color = null;

    /** @type {number} */
    #lineHeight = 0;

    /** @type {number} */
    #wrapWidth = 0;

    /** @type {number[]} */
    #leftTop = [ 0, 0 ];

    /** @type {boolean} */
    #border = false;
}

/**
 * @class Lilium Canvas Component
 * @extends {Chescarna.Component}
 * @param {HTMLElement} element
 */
class Component extends Chescarna.Component {
    /**
     * component constructor
     * @param {LiliumBase} element 
     * @param {Object.<string, LiliumBase>} elementDict 
     */
    constructor(element, elementDict) {
        super();
        this.#children = [];
        this.#element = element;
        this.#elementDict = elementDict;
        if (this.#element.id) {
            elementDict[this.#element.id] = this.#element;
        }
    }

    /**
     * get element attribute
     * @param {string} name
     * @returns {Object}
     */
    getAttribute(name) {
        return this.#element.getAttribute(name);
    }
    
    /**
     * set value into element attribute
     * @param {string} name 
     * @param {Object} value 
     */
    setAttribute(name, value) {
        this.#element.setAttribute(name, value);
    }
    
    /**
     * add event listener
     * @param {string} name 
     * @param {LiliumEventListener} listener 
     */
    addEventListener(name, listener) {
        this.#element.addEventListener(name, listener);
    }
    
    /**
     * append child component
     * @param {Component} component 
     */
    appendChild(component) {
        this.#element.appendChild(component.element);
        this.#children.push(component);
    }
    
    /**
     * remove child component
     * @param {Component} component 
     */
    removeChild(component) {
        this.#element.removeChild(component.element);
        this.#children = this.#children.filter((x) => x != component);
        if (component.element.id && component.element.id in this.#elementDict) {
            if (this.#elementDict[component.element.id] === component.element) {
                delete this.#elementDict[component.element.id];
            }
        }
    }
    
    /**
     * clear all children
     */
    clearChild() {
        for (const child of this.#children) {
            if (child.element.id && child.element.id in this.#elementDict) {
                if (this.#elementDict[child.element.id] === child.element) {
                    delete this.#elementDict[child.element.id];
                }
            }
        }
        this.#element.clearChildren();
        this.#children = [];
    }

    get element() {
        return this.#element;
    }

    get children() {
        return this.#children;
    }

    /** @type {LiliumBase} */
    #element = null;

    /** @type {Object.<string, LiliumBase>} */
    #elementDict = null;

    /** @type {Component[]} */
    #children = null;
}

/**
 * @class Lilium the Best Girl
 */
export default class Lilium {
    /**
     * @constructor
     * @param {string} id 
     * @param {Object} template 
     */
    constructor(id, template) {
        this.#view = new Chescarna.View(id, template);
    }

    /**
     * show this view
     * @param {Object} context 
     */
    show(context) {
        this.#elementDict = {};
        const component = this.#view.buildComponent(
            [ context, this.#elementDict ],
            (tagName) => this.createComponent(tagName));

        if (component instanceof Component) {
            this.#component = component;
            return Chescarna.update(this.#component);
        }

        throw makeError(`${typeof component} is invalid component type`);
    }

    render() {
        this.#component.element.draw(this.#context);            
    }

    /**
     * update this view
     */
    update() {
        return Chescarna.update(this.#component).then(() => this.render());
    }

    /**
     * destroy this view
     */
    destroy() {
        Chescarna.cancelUpdate(this.#component);
        this.#component = null;
        this.#elementDict = null;
    }

    createElement(tagName) {
        const parsed = Component.parseTag(tagName);
        if (parsed.tag) {
            switch (parsed.tag) {
            case 'image':
                return new LiliumImage(parsed.id);
            case 'sprite':
                return new LiliumSprite(parsed.id);
            case 'fill':
                return new LiliumFill(parsed.id);
            case 'text': 
                return new LiliumText(parsed.id);
            default:
                throw makeError(`${tagName} is not effective tag for Lilium`);
            }       
        }
        else {
            //@ts-ignore assign HTMLElement to HTMLCanvasElement
            this.#canvas = document.getElementById(parsed.id);
            this.#context = this.#canvas.getContext('2d');
            return new LiliumSprite(parsed.id);
        }
    }

    /**
     * create HTML element component
     * @param {string} tagName 
     * @returns {Component}
     */
    createComponent(tagName) {
        return new Component(this.createElement(tagName), this.#elementDict);
    };

    getElementById(id) {
        return this.#elementDict[id];
    }

    /** @type {Chescarna.View} */
    #view = null;

    /** @type {Component} */
    #component = null;

    /** @type {Object} */
    #elementDict = null;    

    /** @type {HTMLCanvasElement} */
    #canvas = null;

    /** @type {CanvasRenderingContext2D} */
    #context = null;
}
