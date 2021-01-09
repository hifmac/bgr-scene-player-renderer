/**
 * @file chescarna.js
 * @description Chescarna the view constructor with Rudesia script
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import {
    raiseError,
    zip
} from '../blanc/lisette.js';
import * as Rudesia from './rudesia.js';

 /**
  * Chescarna component
  * @abstract
  */
export function Component() {
    this.children = [];
}

/**
 * built-in object for Chescarna component
 */
Component.BUILTIN_OBJECT = {
    'true': true,
    'false': false,
    'null': null,
    'undefined': undefined,
    'Array': Array,
    'Object': Object,
    'parseInt': parseInt,
    'parseFloat': parseFloat,
    'JSON': JSON,
    'Map': Map,
    'Set': Set,
    'Math': Math,
    'Date': Date,
    'NaN': NaN,
    'URL': URL,
    'Infinity': Infinity,

    /**
     * add two values
     * @param {any} a left hand side value
     * @param {any} b right hand side value
     * @returns {any} addition result
     */
    add(a, b) {
        return a + b;
    },

    /**
     * subtract two values
     * @param {any} a left hand side value
     * @param {any} b right hand side value
     * @returns {any} subtract result
     */
    sub(a, b) {
        return a - b;
    },

    /**
     * multiple two values
     * @param {any} a left hand side value
     * @param {any} b right hand side value
     * @returns {any} multiple result
     */
    mul(a, b) {
        return a * b;
    },

    /**
     * divide two values
     * @param {any} a left hand side value
     * @param {any} b right hand side value
     * @returns {any} division result
     */
    div(a, b) {
        return a / b;
    },


    /**
     * mod two values
     * @param {any} a left hand side value
     * @param {any} b right hand side value
     * @returns {any} modular result
     */
    mod(a, b) {
        return a % b;
    },

    /**
     * new operator
     * @template T type to construct
     * @param {new (...Object) => T} ctor constructor
     * @param {any[]} args constructor arguments
     * @returns {T} constructed object
     */
    new(ctor, args) {
        return new ctor(...args);
    }
};

/** @type {Component[]} */
Component.prototype.children = null;

/** @type {Object[]} */
Component.prototype.context = {};

/**
 * set context stack to component
 * @param {Object[]} context contest stack
 */
Component.prototype.setContext = function Component_setContext(context) {
    this.context = [ ...context, this, Component.BUILTIN_OBJECT ];
};

/**
 * update this component
 * this method should be replaced in Chescarna.View.build
 */
Component.prototype.update = function Component_defaultUpdate() {
};

/**
 * update component tree recursively
 */
Component.prototype.updateRecursive = function Component_updateRecursive() {
    this.update();
    for (let child of this.children) {
        child.updateRecursive();
    }
};

/**
 * set component updater
 * @param {function(): void} updater 
 */
Component.prototype.setUpdater = function Component_setUpdater(updater) {
    this.update = updater;
};

/**
 * get element attribute
 * @param {string} name
 * @returns {Object}
 */
Component.prototype.getAttribute = function Component_setAttribute(name) {
    raiseError('No getAttribute implementation');
};

/**
 * set value into element attribute
 * @param {string} name 
 * @param {Object} value 
 */
Component.prototype.setAttribute = function Component_setAttribute(name, value) {
    raiseError('No setAttribute implementation');
};

/**
 * add event listener
 * @param {string} name 
 * @param {function(Event): void} listener 
 */
Component.prototype.addEventListener = function Component_addEventListener(name, listener) {
    raiseError('No addEventListener implementation');
};

/**
 * append child component
 * @param {Component} component 
 */
Component.prototype.appendChild = function Component_appendChild(component) {
    raiseError('No appendChild implementation');
};

/**
 * remove child component
 * @param {Component} component 
 */
Component.prototype.removeChild = function Component_removeChild(component) {
    raiseError('No removeChild implementation');
};

/**
 * clear all children of this component
 */
Component.prototype.clearChild = function Component_clearChild() {
    raiseError('No clearChild implementation');
};

/**
 * addtional components
 */
const PRECOMPILED_VIEWS = {};

/**
 * @param {string} name 
 * @param {View} view
 */
export function registerView(name, view) {
    if (name in PRECOMPILED_VIEWS) {
        throw new Error(`${name} is already registered`);
    }

    PRECOMPILED_VIEWS[name] = view;
};

const trueCondition = () => true;

/**
 * Chescarna View
 * @param {string} tagName 
 * @param {Object.<string, (string|Object)>} template 
 */
export function View(tagName, template) {
    this.tagName = tagName;
    this.template = template;
    this.children = [];
    this.childTags = [];
    this.bind = {};
    this.on = {};
    this.once = {};
    for (let childTag in template) {
        if (childTag.startsWith('once:')) {
            const event = childTag.substring(5);
            this.once[event] = Rudesia.compile(template[childTag]);
        }
        else if (childTag.startsWith('bind:')) {
            const prop = childTag.substring(5);
            this.bind[prop] = Rudesia.compile(template[childTag]);
        }
        else if (childTag.startsWith('on:')) {
            const event = childTag.substring(3);
            this.on[event] = Rudesia.compile(template[childTag]);
        }
        else if (childTag.startsWith('forEach:')) {
            const itor = childTag.substring(8);
            this.forEach = {
                itor,
                list: Rudesia.compile(template[childTag])
            };
        }
        else if (childTag === 'if') {
            this.condition = Rudesia.compile(template.if);
        }
        else {
            this.childTags.push(childTag);
            if (childTag in PRECOMPILED_VIEWS) {
                this.children.push(PRECOMPILED_VIEWS[childTag]);
            }
            else {
                this.children.push(new View(childTag, template[childTag]));
            }
        }
    }
};

/** @type {string} */
View.prototype.tagName = null;

/** @type {View[]} */
View.prototype.children = null;

/** @type {string[]} */
View.prototype.childTags = null;

/** @type {Object} */
View.prototype.bind = null

/** @type {Object} */
View.prototype.on = null

/** @type {Object} */
View.prototype.once = null

/**
 * @type {{
 *     itor: string,
 *     list: function(Object[]): Object
 * }}
 */
View.prototype.forEach = null

/** @type {function(Object[]): Object} */
View.prototype.condition = trueCondition;

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
 * build view
 * @param {Object[]} contextStack
 * @returns {Dependency}
 */
View.prototype.build = function View_build(contextStack) {
    const dependencies = {
        /** @type {Object[]} */
        iterator: null,
        children: [],
    };

    if (this.forEach) {
        const name = this.forEach.itor;
        dependencies.iterator = this.forEach.list(contextStack);
        for (let itor of dependencies.iterator) {
            const itorContext = [ {}, ...contextStack ];
            itorContext[0][name] = itor;
            dependencies.children.push({
                condition: this.condition(itorContext),
                create: (createComponent) => this.createComponent(createComponent, itorContext)
            });
        }
    }
    else {
        dependencies.children.push({
            condition: this.condition(contextStack),
            create: (createComponent) => this.createComponent(createComponent, contextStack)
        });
    }

    return dependencies;
};

/**
 * @param {function(string): Component} createComponent 
 * @param {Object[]} contextStack
 */
View.prototype.createComponent = function View_createComponent(createComponent, contextStack) {
    const component = createComponent(this.tagName);
    component.setContext(contextStack);

    for (const key in this.on) {
        component.addEventListener(key, (event) => {
            this.on[key]([ { event }, ...component.context ]);
        });
    }

    for (let key in this.once) {
        component.setAttribute(key, this.once[key](component.context));
    }

    /** @type {Dependency[]} */
    let dependencies = [];

    component.setUpdater(() => {
        const newDependencies = Array.from(this.children, (child) => child.build(contextStack));

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

        for (let key in this.bind) {
            component.setAttribute(key, this.bind[key](component.context));
        }
    });

    return component;
}

/** @type {Set<Component>} */
const PENDING_COMPONENTS = new Set();

/**
 * update all components recursively
 * @param {Component[]} components
 */
export function update(components) {
    if (components) {
        if (PENDING_COMPONENTS.size == 0) {
            requestAnimationFrame(function() {
                PENDING_COMPONENTS.forEach((comp) => comp.updateRecursive());
                PENDING_COMPONENTS.clear();
            });
        }
    
        for (let component of components) {
            PENDING_COMPONENTS.add(component);
        }
    }
}

export function cancelUpdate(components) {
    if (components) {
        for (let component of components) {
            PENDING_COMPONENTS.delete(component);
        }
    }
}
