/**
 * @file chescarna.js
 * @description Chescarna the view constructor with Rudesia script
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import { makeError } from '../blanc/lisette.js';
import * as Rudesia from './rudesia.js';

 /**
  * Chescarna component
  * @abstract
  */
export class Component {
    /**
     * @constructor
     */
    constructor() {
    }
    
    /**
     * set context stack to component
     * @param {Object[]} context contest stack
     */
    setContext(context) {
        this.#context = [ ...context, this ];
    }

    /**
     * update this component
     */
    update() {
        this.#updater();
        for (let child of this.children) {
            child.update();
        }
    }

    /**
     * get element attribute
     * @param {string} name
     * @returns {Object}
     */
    getAttribute(name) {
        throw makeError('No getAttribute implementation');
    }
    
    /**
     * set value into element attribute
     * @param {string} name 
     * @param {Object} value 
     */
    setAttribute(name, value) {
        throw makeError('No setAttribute implementation');
    }
    
    /**
     * add event listener
     * @param {string} name 
     * @param {function(Event): void} listener 
     */
    addEventListener(name, listener) {
        throw makeError('No addEventListener implementation');
    }
    
    /**
     * append child component
     * @param {Component} component 
     */
    appendChild(component) {
        throw makeError('No appendChild implementation');
    }
    
    /**
     * remove child component
     * @param {Component} component 
     */
    removeChild(component) {
        throw makeError('No removeChild implementation');
    }
    
    /**
     * clear all children of this component
     */
    clearChild() {
        throw makeError('No clearChild implementation');
    }

    /**
     * 
     * @param {string} tag
     * @returns {{
     *     tag: string?,
     *     id: string?,
     *     name: string?,
     *     classes: string?,
     * }}
     */
    static parseTag(tag) {
        const ret = {
            tag: null,
            id: null,
            name: null,
            classes: null,
        };

        let start = 0;
        let type = 'tag';
        while (true) {
            const pos = tag.substring(start).search(/[$.#]/);
            if (pos === -1) {
                ret[type] = tag.substring(start);
                break;
            }

            if (pos !== 0) {
                ret[type] = tag.substring(start, start + pos);
            }

            switch (tag.charAt(start + pos)) {
            case '$':
                type = 'name';
                break;
            case '.':
                type = 'classes';
                break;
            case '#':
                type = 'id';
                break;
            default:
                throw new Error(`Unknown charater: ${tag} / ${tag.charAt(start + pos)}`);
            }

            start += pos + 1;
        }

        if (!ret.tag && !ret.id) {
            throw new Error(`No valid tag: ${tag}`);
        }

        return ret;
    }

    /**
     * @param {() => void} value
     */
    set updater(value) {
        this.#updater = value;
    }

    get children() {
        return [];
    }

    get context() {
        return this.#context;
    }

    /** @type {() => void} */
    #updater = () => {};

    /** @type {Object[]} */
    #context = [];
}

/**
 * @typedef {function(): Component[]} ComponentConstructor
 */

/**
 * @class Chescarna View
 */
export class View {
    /**
     * @param {string} tagName 
     * @param {Object.<string, (string|Object)>} template 
     */
    constructor(tagName, template) {
        this.#tagName = tagName;
        this.#children = [];
        this.#childTags = [];
        this.#bind = {};
        this.#on = {};
        this.#once = {};
        for (let childTag in template) {
            if (childTag.startsWith('once:')) {
                const event = childTag.substring(5);
                this.#once[event] = Rudesia.compile(template[childTag]);
            }
            else if (childTag.startsWith('bind:')) {
                const prop = childTag.substring(5);
                this.#bind[prop] = Rudesia.compile(template[childTag]);
            }
            else if (childTag.startsWith('on:')) {
                const event = childTag.substring(3);
                this.#on[event] = Rudesia.compile(template[childTag]);
            }
            else if (childTag.startsWith('forEach:')) {
                const itor = childTag.substring(8);
                this.#forEach = {
                    itor,
                    list: Rudesia.compile(template[childTag])
                };
            }
            else if (childTag === 'if') {
                this.#condition = Rudesia.compile(template.if);
            }
            else {
                this.#childTags.push(childTag);
                this.#children.push(new View(childTag, template[childTag]));
            }
        }
    }

    /**
     * build view
     * @param {Object[]} contextStack
     * @param {function(string): Component} createComponent
     * @returns {ComponentConstructor}
     */
    build(contextStack, createComponent) {
        if (this.#forEach) {
            const cache = {
                iterator: null,
                contexts: null,
                conditions: null,
                components: null,
            }

            return () => {
                const iterator = this.#forEach.list(contextStack);
                if (cache.iterator === iterator && cache.iterator.length === cache.conditions.length) {
                    for (const i in cache.conditions) { 
                        if (cache.conditions[i] !== this.#condition(cache.contexts[i])) {
                            cache.conditions = Array(cache.contexts, (ctx) => this.#condition(ctx));
                            cache.components = [];
                            for (const i in cache.contexts) { 
                                if (cache.conditions[i]) { 
                                    cache.components.push(this.createComponent(cache.contexts[i], createComponent));
                                }
                            }        
                            break;
                        }
                    }
                }
                else {
                    cache.iterator = iterator;
                    cache.contexts = [];
                    cache.conditions = [];
                    cache.components = [];
                    for (const itor of iterator) { 
                        const itorContext = [
                            {
                                [this.#forEach.itor]: itor
                            },
                            ...contextStack
                        ];
                        const cond = this.#condition(itorContext);
                        cache.contexts.push(itorContext);
                        cache.conditions.push(cond);
                        if (cond) { 
                            cache.components.push(this.createComponent(itorContext, createComponent));
                        }
                    }
                }

                return cache.components;
            };
        }
        else {
            const cache = {
                condition: null,
                components: null,
            };

            return () => {
                const cond = this.#condition(contextStack) ? true : false;
                if (cache.condition !== cond) {
                    if (cond) {
                        cache.condition = true;
                        cache.components = [ this.createComponent(contextStack, createComponent) ];
                    }
                    else {
                        cache.condition = false;
                        cache.components = [];
                    }
                }
                return cache.components;
            };
        }
    }

    /**
     * build view
     * @param {Object[]} contextStack
     * @param {(string) => Component} createComponent
     * @returns {Component}
     */
    buildComponent(contextStack, createComponent) {
        const components = this.build(contextStack, createComponent)();
        if (components.length !== 1) {
            throw makeError('the root of the template must not iterate');
        }
        return components[0];
    }

    /**
     * @param {Object[]} contextStack
     * @param {function(string): Component} createComponent 
     */
    createComponent(contextStack, createComponent) {
        const component = createComponent(this.#tagName);
        component.setContext(contextStack);

        for (const key in this.#on) {
            component.addEventListener(key, (event) => {
                this.#on[key]([ { event }, ...component.context ]);
            });
        }

        for (const key in this.#once) {
            component.setAttribute(key, this.#once[key](component.context));
        }

        const constructors = this.#children.length ? 
            Array.from(this.#children, (child) => child.build(contextStack, createComponent)) : null;

        component.updater = () => {
            if (constructors) {
                component.clearChild();
                for (const ctor of constructors) {
                    for (const child of ctor()) {
                        component.appendChild(child);
                    }
                }
            }

            for (let key in this.#bind) {
                component.setAttribute(key, this.#bind[key](component.context));
            }
        };

        return component;
    }

    /** @type {string} */
    #tagName = null;

    /** @type {View[]} */
    #children = null;

    /** @type {string[]} */
    #childTags = null;

    /** @type {Object} */
    #bind = null

    /** @type {Object} */
    #on = null

    /** @type {Object} */
    #once = null

    /**
     * @type {{
     *     itor: string,
     *     list: function(Object[]): Object[]
     * }}
     */
    #forEach = null

    /** @type {function(Object[]): Object} */
    #condition = () => true;
}

/** @type {Set<Component>} */
const PENDING_COMPONENTS = new Set();

/** @type {Array<(value: any) => void>} */
const PENDING_PROMISE = [];

function updateInternal() {
    PENDING_COMPONENTS.forEach((comp) => comp.update());
    PENDING_COMPONENTS.clear();

    while (PENDING_PROMISE.length) {
        PENDING_PROMISE.shift()();
    }
}

/**
 * update all components recursively
 * @param {Component} component
 */
export function update(component) {
    if (component) {
        if (PENDING_COMPONENTS.size == 0) {
            requestAnimationFrame(updateInternal);
        }
    
        return new Promise((resolve) => {
            PENDING_COMPONENTS.add(component);
            PENDING_PROMISE.push(resolve);
        });
    }
    return null;
}

export function cancelUpdate(component) {
    if (component) {
        PENDING_COMPONENTS.delete(component);
    }
}
