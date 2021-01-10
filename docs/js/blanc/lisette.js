/**
 * @file lisette.js
 * @description Lisette the utility method exporter
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict'

const configLoader = {
    config: null,
    listenerList: [],

    /**
     * invoke listener or push listener into wait queue
     * @param {function(Object): void} listener an onload event listener
     */
    invoke(listener) {
        if (this.config) {
            listener(this.config);
        }
        else if (Filesystem) {
            this.listenerList.push(listener);

            console.log(SETTINGS.CONFIG_JSON);
            Promise.all([
                Filesystem.readJsonFile(SETTINGS.CONFIG_JSON),
                makeTimeoutPromise((resolve) => { 
                    if (document.readyState === 'complete') {
                        resolve();
                    }
                    else {
                        window.onload = resolve;
                    }
                })
            ]).then((values) => {
                this.config = values[0];
                for (const listener of this.listenerList) {
                    listener(this.config);
                }
                this.listenerList = [];
            })
            .catch(printStack);
        }
        else {
            console.error('bgrsp is not exported...');
        }
    }
};


const promiseTimeout = {
    timeId: null,
    id: 0,

    /** @type {Object.<string, { timeout: number, handler: function(): void }>} */
    handlers: {},

    /**
     * invoke timeout handler 
     */
    invokeHandlers() {
        const now = Date.now();
        for (const id of Object.keys(this.handlers).sort()) {
            if (now < this.handlers[id].timeout) {
                break;
            }
            this.handlers[id].handler();
            delete this.handlers[id];
        }
    
        if (this.handlers.length) {
            this.timeId = setTimeout(() => this.invokeHandlers(), Math.min(100, this.handlers[0].timeout - now));
        }
        else {
            this.timeId = null;
        }
    },

    /**
     * register timeout handler
     * @param {function(): void} handler 
     * @param {number} timeout 
     * @returns {number} timer id
     */
    registerHandler(handler, timeout) {
        if (this.timeId === null) {
            this.timeId = setTimeout(() => this.invokeHandlers(), timeout);
        }

        const id = this.Id++;
        this.handlers[id] = {
            handler,
            timeout: Date.now() + timeout
        };

        return id;
    },

    /**
     * clear timeout handler
     * @param {number} id 
     */
    clearHandler(id) {
        if (id in this.handlers) {
            delete this.handlers[id];
        }
    }
};

/**
 * current environment is in BGRSP
 */
export const BGRSP = 'bgrsp' in window;

/**
 * IPC for intellisense
 * @type {{
 *    requestPage: (string) => Promise<Object>,
 *    requestDialog: (string) => Promise<Object>,
 *    requestDirectory: (string) => Promise<Object>,
 *    requestPageList: () => Promise<string[]>,
 *    requestDialogList: () => Promise<string[]>
 *    loadHtml: (string) => void,
 *    searchCharacter: (string) => Promise<Object[]>,
 *    searchTalk: (string) => Promise<Object[]>,
 *    searchBGM: (string) => Promise<Object[]>,
 *    searchDialog: (string) => Promise<Object[]>
 * }}
 */
//@ts-ignore
export const IPC = BGRSP ? window.bgrsp.IPC : null;

/**
 * Filesystem for intellisense
 * @type {{
 *     readDirectory: (string) => Promise<string[]>,
 *     readFile: (string) => Promise<Uint8Array>,
 *     statFile: (string) => Promise<string>,
 *     readJsonFile: (string) => Promise<Object>,
 *     getWindowURL: (string) => Promise<string>,
 * }}
 */
//@ts-ignore
export const Filesystem = BGRSP ? window.bgrsp.Filesystem : null;

/**
 * Settings for intellisense
 * @type {{
 *     REMOTE: boolean,
 *     DEBUG: boolean,
 *     TIMEOUT: number,
 *     CONFIG_JSON: string,
 * }}
 */
//@ts-ignore
export const SETTINGS = BGRSP ? window.bgrsp.SETTINGS : null;

/**
 * zip 2 arguments into 1 array to iterate
 * @template T array element type
 * @param {T[]} a 
 * @param {T[]} b
 * @yields {T[]} 
 */
export function* zip(a, b) {
    for (let i = 0, length = Math.min(a.length, b.length); i < length; ++i) {
        yield [ a[i], b[i] ];
    }
};

/**
 * generate number in the range
 * @param {number} start 
 * @param {number} end 
 * @param {number} step 
 */
export function* range(start, end, step) {
    if (end === undefined) {
        end = start;
        start = 0
    } 

    if (step === undefined) {
        step = 1;
    }

    for (let i = start; i !== end; i += step) {
        yield i;
    }
}

/**
 * set a listner called when the application is loaded
 * @param {function(Object) : void} listener listener to be called when application is loaded
 */
export function onLoad(listener) {
    configLoader.invoke(listener);
}

/**
 * get URL parameters from a specific URL
 * use current locatoin href if no URL is specified
 * @param {(string|null)} url an url to parse url parameters
 * @returns {Object} URL parameters in the URL
 */
export function getURLParameter(url=null) {
    if (url == null) {
        url = window.location.href;
    }

    let params = url.split('?');
    if (params.length <= 1) {
        return [];
    }
    params = params[1].split('&');

    let ret = {};
    for (let key in params) {
        const param = params[key].split('=');
        ret[param[0]] = decodeURIComponent(param[1].replace('+', ' '));
    }
    return ret;
}

/**
 * check whether all properties are defined in an object
 * @param {Object} obj an object  to be checked
 * @param {Array<string> | string} props a list of property names to check
 * @returns {boolean} whether @argument props are defined in the obj
 */
export function hasOwnProperties(obj, props) {
    if (Array.isArray(props)) {
        for (let prop of props) {
            if (obj[prop] === undefined) {
                return false;
            }
        }
        return true;
    }
    return obj[props] !== undefined;
}

/**
 * @template T array element type
 * @param {T[]} arr array to get last element
 * @param {number} index index from tail
 * @returns {T} last element
 */
export function last(arr, index=0) {
    if (typeof arr.length !== undefined && index + 1 <= arr.length) {
        return arr[arr.length - 1 - index];
    }
    return null;
}

/**
 * @template T
 * @param {function(function(T): void): void} executor 
 * @param {number} timeout timeout for promise
 * @returns {Promise<T>}
 */
export function makeTimeoutPromise(executor, timeout=1000) {
    return new Promise((resolve, reject) => {
        const id = promiseTimeout.registerHandler(() => raiseError('timeout', reject), timeout);
        executor((value) => {
            resolve(value);
            promiseTimeout.clearHandler(id);
        });
    });
}

/**
 * merge object array into 1 array
 * @param {Object.<string, Object>[]} objs 
 */
export function mergeObject(objs) {
    const merged = {};
    for (const obj of objs) {
        for (const key in obj) {
            merged[key] = obj[key];
        }
    }
    return merged;
}

/**
 * 
 * @param {string} status
 * @param {(Error) => void} reject
 */
export function raiseError(status, reject=undefined) {
    const err = new Error(status);
    console.error(err);
    if (typeof reject !== undefined) {
        reject(err);
    }
    else {
        throw err;
    }
}

/**
 * @param {Error} exc reject status
 */
export function printStack(exc) {
    console.log(exc);
}

export const MOUSE_BUTTON_PRIMARY = 0;
export const MOUSE_BUTTON_WHEEL = 1;
export const MOUSE_BUTTON_SECONDARY = 2;
