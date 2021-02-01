/**
 * @file chescarna.js
 * @description Chescarna the view constructor with Rudesia script
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import {
    makeError,
    zip
} from '../blanc/lisette.js';
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
 * @typedef {{
 *     iterator: any[],
 *     children: {
 *         condition: boolean,
 *         create: function(function(string): Component): Component
 *     }[]
 * }} Dependency
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
    };

    /**
     * build view
     * @param {Object[]} contextStack
     * @returns {Dependency}
     */
    buildInternnal(contextStack) {
        const dependencies = {
            /** @type {Object[]} */
            iterator: null,
            children: [],
        };

        if (this.#forEach) {
            const name = this.#forEach.itor;
            dependencies.iterator = this.#forEach.list(contextStack);
            for (let itor of dependencies.iterator) {
                const itorContext = [ {}, ...contextStack ];
                itorContext[0][name] = itor;
                dependencies.children.push({
                    condition: this.#condition(itorContext),
                    create: (createComponent) => this.createComponent(createComponent, itorContext)
                });
            }
        }
        else {
            dependencies.children.push({
                condition: this.#condition(contextStack),
                create: (createComponent) => this.createComponent(createComponent, contextStack)
            });
        }

        return dependencies;
    };

    /**
     * build view
     * @param {Object[]} contextStack
     * @returns {Dependency}
     */
    build(contextStack) {
        /** @type {Dependency} */
        const dependency = {
            iterator: null,
            children: [],
        };

        if (this.#forEach) {
            const name = this.#forEach.itor;
            dependency.iterator = this.#forEach.list(contextStack);
            for (let itor of dependency.iterator) {
                const itorContext = [ {}, ...contextStack ];
                itorContext[0][name] = itor;
                dependency.children.push({
                    condition: this.#condition(itorContext),
                    create: (createComponent) => this.createComponent(createComponent, itorContext)
                });
            }
        }
        else {
            dependency.children.push({
                condition: this.#condition(contextStack),
                create: (createComponent) => this.createComponent(createComponent, contextStack)
            });
        }

        return dependency;
    };

    /**
     * build view
     * @param {Object[]} contextStack
     * @param {(string) => Component} createComponent
     * @returns {Component}
     */
    buildComponent(contextStack, createComponent) {
        const dependencies = this.build(contextStack);
        if (dependencies.iterator !== null || dependencies.children.length !== 1) {
            throw makeError('the root of the template must not iterate');
        }
        return dependencies.children[0].create(createComponent);
    };

    /**
     * @param {function(string): Component} createComponent 
     * @param {Object[]} contextStack
     */
    createComponent(createComponent, contextStack) {
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

        /** @type {Dependency[]} */
        let dependencies = [];

        component.updater = () => {
            const newDependencies = Array.from(this.#children, (child) => child.build(contextStack));

            let updated = false;
            if (dependencies.length === newDependencies.length) {
                for (const dependency of zip(dependencies, newDependencies)) {
                    if ((dependency[0].iterator !== dependency[1].iterator)
                        || (dependency[0].children.length !== dependency[1].children.length)) {
                        updated = true;
                        break;
                    }

                    for (const child of zip(dependency[0].children, dependency[1].children)) {
                        if (child[0].condition !== child[1].condition) {
                            updated = true;
                            break;
                        }    
                    }

                    if (updated) {
                        break;
                    }
                }
            }
            else {
                updated = true;
            }

            dependencies = newDependencies;

            if (updated) {
                component.clearChild();
                for (const dependency of dependencies) {
                    for (const child of dependency.children) {
                        if (child.condition) {
                            component.appendChild(child.create(createComponent));
                        }
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
     *     list: function(Object[]): Object
     * }}
     */
    #forEach = null

    /** @type {function(Object[]): Object} */
    #condition = () => true;
}

/** @type {Set<() => void>} */
const PENDING_COMPONENTS = new Set();

/**
 * update all components recursively
 * @param {Component} component
 */
export function update(component) {
    if (component) {
        if (PENDING_COMPONENTS.size == 0) {
            requestAnimationFrame(() => {
                PENDING_COMPONENTS.forEach((p) => p());
                PENDING_COMPONENTS.clear();
            });
        }
    
        return new Promise((resolve) => {
            PENDING_COMPONENTS.add(() => {
                component.update();
                resolve();
            });
        });
    }
    return null;
}

export function cancelUpdate(component) {
    if (component) {
        PENDING_COMPONENTS.delete(component);
    }
}
