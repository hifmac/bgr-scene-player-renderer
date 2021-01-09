/**
 * @file adelite.js
 * @description Adelite the HTML Component Implementation for Chescarna view
 * @author hifmac(E32456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import { raiseError } from '../blanc/lisette.js';
import * as Chescarna from '../demonia/chescarna.js';

/**
 * @class Adelite HTML Component
 * @extends Chescarna.Component
 * @param {HTMLElement} element
 */
function Component(element, elementDict) {
    this.super.call(this);
    this.element = element;
    this.elementDict = elementDict;
    if (this.element.id) {
        elementDict[this.element.id] = this.element;
    }
}

Component.prototype = new Chescarna.Component();

/** super class */
Component.prototype.super = Chescarna.Component;

/** @type {HTMLElement} */
Component.prototype.element = null;

/**
 * get element attribute
 * @param {string} name
 * @returns {Object}
 */
Component.prototype.getAttribute = function Component_setAttribute(name) {
    if (name === 'textContent'
        || name === 'value'
        || name === 'selectedIndex'
        || name === 'checked'
        || name === 'width'
        || name === 'height') {
        return this.element[name];
    }
    else if (name === 'class') {
        return this.element.classList;
    }
    else {
        return this.element.getAttribute(name);
    }
};

/**
 * set value into element attribute
 * @param {string} name 
 * @param {Object} value 
 */
Component.prototype.setAttribute = function Component_setAttribute(name, value) {
    if (name === 'textContent'
        || name === 'value'
        || name === 'selectedIndex'
        || name === 'checked'
        || name === 'width'
        || name === 'height') {
        if (this.element[name] !== value) {
            this.element[name] = value;
        }
    }
    else if (name === 'class') {
        for (let cls of value.split(' ')) {
            this.element.classList.add(cls);
        }
    }
    else {
        if (this.element.getAttribute(name) !== value) {
            this.element.setAttribute(name, value);
        }
    }
};

/**
 * add event listener
 * @param {string} name 
 * @param {function(Event): void} listener 
 */
Component.prototype.addEventListener = function Component_addEventListener(name, listener) {
    this.element.addEventListener(name, listener);
};

/**
 * append child component
 * @param {Component} component 
 */
Component.prototype.appendChild = function Component_appendChild(component) {
    this.element.appendChild(component.element);
    this.children.push(component);
};

/**
 * remove child component
 * @param {Component} component 
 */
Component.prototype.removeChild = function Component_removeChild(component) {
    this.element.removeChild(component.element);
    this.children = this.children.filter((x) => x != component);
    if (component.element.id && component.element.id in this.elementDict) {
        if (this.elementDict[component.element.id] === component.element) {
            delete this.elementDict[component.element.id];
        }
    }
};

/**
 * clear all children
 */
Component.prototype.clearChild = function Component_clearChild() {
    for (const child of this.children) {
        this.element.removeChild(child.element);
        if (child.element.id && child.element.id in this.elementDict) {
            if (this.elementDict[child.element.id] === child.element) {
                delete this.elementDict[child.element.id];
            }
        }
    }
    this.children = [];
};

/**
 * 
 * @param {string} id 
 * @param {Object} template 
 */
export default function Adelite(id, template) {
    this.view = new Chescarna.View(id, template);
}

/** @type {Chescarna.View} */
Adelite.prototype.view = null;

/** @type {Chescarna.Component[]} */
Adelite.prototype.components = null;

/** @type {Object} */
Adelite.prototype.elementDict = null;

/**
 * show this view
 * @param {Object} context 
 */
Adelite.prototype.show = function Adelite_show(context) {
    this.elementDict = {};
    const dependency = this.view.build([ context, this.elementDict ]);
    if (dependency.children.length != 1) {
        raiseError('Adelite root component must be 1');
    }
    this.components = Array.from(dependency.children, (d) => d.create((tagName) => this.createComponent(tagName)));
    Chescarna.update(this.components);
}

/**
 * update this view
 */
Adelite.prototype.update = function Adelite_update() {
    Chescarna.update(this.components);
}

/**
 * destroy this view
 */
Adelite.prototype.destroy = function Adelite_destroy() {
    Chescarna.cancelUpdate(this.components);
    this.components = null;
    this.elementDict = null;
}

Adelite.prototype.createElement = function Adelite_createElement(tagName) {
    let element;

    switch (tagName.indexOf('#')) {
    case 0:
        element = document.getElementById(tagName.substring(1));
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        break;
    case -1:
        if (tagName.indexOf('.') !== -1) {
            const tag = tagName.split('.');
            element = document.createElement(tag[0]);
            for (const cls of tag[1].split(' ')) {
                element.classList.add(cls);
            }
        }
        else {
            element = document.createElement(tagName);
        }
        break;
    default:
        const tag = tagName.split('#');
        element = document.createElement(tag[0]);
        element.id = tag[1]; 
        break;
    }

    return element;
}

/**
 * create HTML element component
 * @param {string} tagName 
 * @returns {Component}
 */
Adelite.prototype.createComponent = function createComponent(tagName) {
    return new Component(this.createElement(tagName), this.elementDict);
};

Adelite.prototype.getElementById = function getElementById(id) {
    return this.elementDict[id];
}
