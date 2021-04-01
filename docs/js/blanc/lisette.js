/**
 * @file lisette.js
 * @description Lisette the utility method exporter
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict'

/**
 * @typedef {{
 *     json: {
 *         page: string[],
 *         dialog: string[],
 *         character: string[],
 *         layout: string[],
 *         directory: string[],
 *     },
 *     data: {
 *         texture: {
 *             dialog: string,
 *             character: string,
 *             icon: string,
 *         },
 *         audio: {
 *             bgm: string,
 *             voice: string,
 *         },
 *     }
 * }} Config
 * 
 * @typedef {{
 *     char_id: string,
 *     name: string,
 *     bg_pic: string,
 *     pos: string,
 *     face: string,
 *     erace: string,
 *     cut_out: string,
 *     next: string[],
 *     id: string,
 *     talk: string,
 *     bgm: string,
 *     voice: string,
 *     option: string[],
 * }} Dialog
 * 
 * @typedef {Object.<string, {
 *     id: number,
 *     name: string,
 *     texture: string,
 *     body_rect: number[],
 *     face_rect: Object.<string, number[]>,
 * }>} Character
 */
  
const configLoader = {
    /** @type {Config} */
    config: null,
    listenerList: [],

    /**
     * invoke listener or push listener into wait queue
     * @param {function(Config): void} listener an onload event listener
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
 * @typedef {{
 *     id: number,
 *     getBindingRect: () =>Promise<{
 *         x: number,
 *         y: number,
 *         w: number,
 *         h: number,
 *     }>,
 *     close: () => void
 * }} IPCWindow
 * 
 * @type {{
 *    requestPage: (string) => Promise<Object>,
 *    requestDialog: (string) => Promise<Object>,
 *    requestDirectory: (string) => Promise<Object>,
 *    requestPageList: () => Promise<string[]>,
 *    requestDialogList: () => Promise<string[]>
 *    createWindow: (string, any) => IPCWindow,
 *    searchCharacter: (string) => Promise<Object[]>,
 *    searchTalk: (string) => Promise<Object[]>,
 *    searchBGM: (string) => Promise<Object[]>,
 *    searchDialog: (string) => Promise<Object[]>
 * }}
 */
// @ts-ignore - defined in electron preload js
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
// @ts-ignore - defined in electron preload js
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
// @ts-ignore - defined in electron preload js
export const SETTINGS = BGRSP ? window.bgrsp.SETTINGS : null;

/**
 * get screen source id to get user media
 * @type {() => Promise<number>}
 */
// @ts-ignore - defined in electron preload js
export const getScreenSourceID  = BGRSP ? window.bgrsp.captureScreen : null

/**
 * zip 2 arguments into 1 array to iterate
 * @template T array element type
 * @param {T[]} a 
 * @param {T[]} b
 * @yields {T[]} 
 */
export function* zip(a, b) {
    const tuple = [ null, null ];
    for (let i = 0, length = Math.min(a.length, b.length); i < length; ++i) {
        tuple[0] = a[i], tuple[1] = b[i];
        yield tuple;
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
 * @param {function(Config) : void} listener listener to be called when application is loaded
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
        const id = promiseTimeout.registerHandler(() => rejectError('timeout', reject), timeout);
        executor((value) => {
            resolve(value);
            promiseTimeout.clearHandler(id);
        });
    });
}

/**
 * merge object array into 1 array
 * @param {Object[]} objs
 * @returns {Object}
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
 * make error and print stack trace log
 * @param {string} status
 * @returns {Error}
 */
export function makeError(status) {
    console.error(status);
    return (typeof status === 'string' ? new Error(status) : status);
}

/**
 * reject error with status
 * @param {string} status
 * @param {(Error) => void} reject
 */
export function rejectError(status, reject) {
    reject(makeError(status));
}

/**
 * @param {Error} exc reject status
 */
export function printStack(exc) {
    console.error(exc);
}

/**
 * sort character object
 * @param {{
 *     name: string
 * }[]} characters 
 */
export function sortCharacter(characters) {
    /**
     * get short unit name
     * @param {string} name 
     */
    const getName = (name) => {
        let pos = name.indexOf(']');
        if (pos == -1) {
            pos = name.indexOf('》');
        }
        return name.substring(pos + 1);
    };

    characters.sort((a, b) => {
        const nameA = getName(a.name);
        const nameB = getName(b.name);
        if (nameA < nameB) {
            return -1;
        }
        else if (nameB < nameA) {
            return 1;
        }
        else {
            if (a.name < b.name) {
                return 1;
            }
            else if (b.name < a.name) {
                return -1;
            }
            else {
                return 0;
            }
        }
    });
}

/**
 * 
 * @param {string} filename 
 * @param {string} url 
 * @param {string} type 
 * @returns {Promise<Event>}
 */
export function saveURLAsFile(filename, url, type) {
    const downLoadLink = document.createElement('a');
    downLoadLink.download = filename;
    downLoadLink.href = url;
    downLoadLink.dataset.downloadurl = [type, downLoadLink.download, downLoadLink.href].join(":");
    downLoadLink.click();
    return new Promise((resolve) => {
        downLoadLink.addEventListener('click', resolve);
    });
}

/**
 * make a promise for requestAnimationFrame
 */
export function onAnimationFrame() {
    return new Promise((resolve) => {
        requestAnimationFrame(resolve);
    });
}

/**
 * make a promise for setTimeout
 * @param {number} timeout 
 */
export function onTimeout(timeout) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
}

export const MOUSE_BUTTON_PRIMARY = 0;
export const MOUSE_BUTTON_WHEEL = 1;
export const MOUSE_BUTTON_SECONDARY = 2;
