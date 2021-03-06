/**
 * @file adelite.js
 * @description Adelite the HTML Component Implementation for Chescarna view
 * @author hifmac(E32456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

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
            this.#element.classList.remove(...this.#element.classList);
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
        if (component.element.id) {
            this.#elementDict[component.element.id] = component.element;
        }
        this.#element.appendChild(component.element);
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
        this.#component = this.#view.buildComponent(
            [ context, this.#elementDict ],
            (tagName) => this.createComponent(tagName));
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

        const parsed = Component.parseTag(tagName);
        if (parsed.tag) {
            element = document.createElement(parsed.tag);
            if (parsed.id) {
                element.id = parsed.id;
            }
        }
        else {
            element = document.getElementById(parsed.id);
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        }

        if (parsed.name) {
            element.setAttribute('name', parsed.name);
        }

        if (parsed.classes) {
            for (const cls of parsed.classes.split(' ')) {
                element.classList.add(cls);
            }
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
