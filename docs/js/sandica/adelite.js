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
 * @extends {Chescarna.Component}
 * @param {HTMLElement} element
 */
class Component extends Chescarna.Component {
    /**
     * component constructor
     * @param {HTMLElement} element 
     * @param {Object.<string, HTMLElement>} elementDict 
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
        if (name === 'textContent'
            || name === 'value'
            || name === 'selectedIndex'
            || name === 'checked'
            || name === 'width'
            || name === 'height') {
            return this.#element[name];
        }
        else if (name === 'class') {
            return this.#element.classList;
        }
        else {
            return this.#element.getAttribute(name);
        }
    }
    
    /**
     * set value into element attribute
     * @param {string} name 
     * @param {Object} value 
     */
    setAttribute(name, value) {
        if (name === 'textContent'
            || name === 'value'
            || name === 'selectedIndex'
            || name === 'checked'
            || name === 'width'
            || name === 'height') {
            if (this.#element[name] !== value) {
                this.#element[name] = value;
            }
        }
        else if (name === 'class') {
            for (let cls of value.split(' ')) {
                this.#element.classList.add(cls);
            }
        }
        else {
            if (this.#element.getAttribute(name) !== value) {
                this.#element.setAttribute(name, value);
            }
        }
    }

    /**
     * add event listener
     * @param {string} name 
     * @param {function(Event): void} listener 
     */
    addEventListener(name, listener) {
        this.#element.addEventListener(name, listener);
    }
    
    /**
     * append child component
     * @param {Component} component 
     */
    appendChild(component) {
        this.#element.appendChild(component.#element);
        this.#children.push(component);
    }
    
    /**
     * remove child component
     * @param {Component} component 
     */
    removeChild(component) {
        this.#element.removeChild(component.#element);
        this.#children = this.#children.filter((x) => x != component);
        if (component.#element.id && component.#element.id in this.#elementDict) {
            if (this.#elementDict[component.#element.id] === component.#element) {
                delete this.#elementDict[component.#element.id];
            }
        }
    }
    
    /**
     * clear all children
     */
    clearChild() {
        for (const child of this.#children) {
            this.#element.removeChild(child.element);
            if (child.element.id && child.element.id in this.#elementDict) {
                if (this.#elementDict[child.element.id] === child.element) {
                    delete this.#elementDict[child.element.id];
                }
            }
        }
        this.#children = [];
    }

    get element() {
        return this.#element;
    }

    get children() {
        return this.#children;
    }

    /** @type {HTMLElement} */
    #element = null;

    /** @type {Object.<string, HTMLElement>} */
    #elementDict = null;

    /** @type {Component[]} */
    #children = null;    
}

/**
 * @class Adelite the HTML Component Implementation for Chescarna view
 */
export default class Adelite {
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
        const dependency = this.#view.build([ context, this.#elementDict ]);
        if (dependency.children.length != 1) {
            raiseError('Adelite root component must be 1');
        }
        this.#component = dependency.children[0].create((tagName) => this.createComponent(tagName));
        return Chescarna.update(this.#component);
    }

    /**
     * update this view
     */
    update() {
        return Chescarna.update(this.#component);
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
    createComponent(tagName) {
        return new Component(this.createElement(tagName), this.#elementDict);
    };

    getElementById(id) {
        return this.#elementDict[id];
    }

    /** @type {Chescarna.View} */
    #view = null;

    /** @type {Chescarna.Component} */
    #component = null;

    /** @type {Object} */
    #elementDict = null;    
}
