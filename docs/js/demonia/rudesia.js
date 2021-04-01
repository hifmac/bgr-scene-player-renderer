/**
 * @file rudesia.js
 * @description Rudesia the script compilier
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import {
    last,
    makeError,
    printStack
} from '../blanc/lisette.js';

/**
 * @typedef {{
 *     type: string,
 *     name?: string,
 *     value?: string,
 *     operator?: string,
 *     index?: Token[],
 *     args?: Token[][]
 * }} Token
 *
 * @typedef {{
 *     value: any,
 *     set: function(any): any
 * }} Variable
 */


 /**
 * RegExp to test string able to be an operand
 */
const canBeOperand = /^([&|^+\-*/%=!?<>]{1,2}|[_a-zA-Z][_a-zA-Z0-9]*|[0-9+\-][0-9]*(\.[0-9]*)?)$/;

/**
 * RegExp to test symbol name
 */
const isSymbol = /^([&|^+\-*/%=!?<>]{1,2}|[_a-zA-Z]([_a-zA-Z0-9])*)$/;

/**
 * RegExp to test integer
 */
const isInteger = /^[+\-]?[0-9]+$/;

/**
 * RegExp to test floating point
 */
const isFloat = /^[+\-]?[0-9]+\.[0-9]*$/;

/**
 * bind/on statement matcher pattern
 * @type {RegExp}
 */
const STATEMENT_MATHER = /^(.*?)({{.+?}})(.*?)$/;

const TOKEN_SYMBOL = 'symbol';
const TOKEN_STRING = 'string';
const TOKEN_INTEGER = 'integer';
const TOKEN_FLOAT = 'float';
const TOKEN_INDEX = 'index';
const TOKEN_ARRAY = 'array';
const TOKEN_CALL = 'call';
const TOKEN_OPERATOR = 'operator';

/**
 * built-in object for Chescarna component
 */
const BUILTIN_OBJECT = {
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
    '+': function(a, b) {
        return a + b;
    },

    /**
     * subtract two values
     * @param {any} a left hand side value
     * @param {any} b right hand side value
     * @returns {any} subtract result
     */
    '-': function(a, b) {
        return a - b;
    },

    /**
     * multiple two values
     * @param {any} a left hand side value
     * @param {any} b right hand side value
     * @returns {any} multiple result
     */
    '*': function(a, b) {
        return a * b;
    },

    /**
     * divide two values
     * @param {any} a left hand side value
     * @param {any} b right hand side value
     * @returns {any} division result
     */
    '/': function(a, b) {
        return a / b;
    },

    /**
     * mod two values
     * @param {any} a left hand side value
     * @param {any} b right hand side value
     * @returns {any} modular result
     */
    '%': function(a, b) {
        return a % b;
    },

    '||': function(a, b) {
        return a || b;
    },

    '&&': function(a, b) {
        return a && b;
    },

    '//': function(a, b) {
        return a / b | 0;
    },

    '|': function(a, b) {
        return a || b;
    },

    '&': function(a, b) {
        return a && b;
    },

    '^': function(a, b) {
        return a ^ b;
    },

    '<': function(a, b) {
        return a < b;
    },

    '>': function(a, b) {
        return a > b;
    },

    '<<': function(a, b) {
        return a << b;
    },

    '>>': function(a, b) {
        return a >> b;
    },

    '?': function(a, b, c) {
        return a ? b : c;
    },

    '!': function(value) {
        return !value;
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

const ASSIGNMENT_OPERATOR = {
    /**
    * assignment operator
    * @param {Variable[]} variables 
    */
    '=': function(variables) {
        if (variables.length != 2) {
            throw makeError(`Invalid argument length for 2 operator: ${variables.length}`);
        }
        return variables[0].set(variables[1].value);
    },

    /**
    * addition assignment operator
    * @param {Variable[]} variables 
    */
    '+=': function(variables) {
        if (variables.length != 2) {
            throw makeError(`Invalid argument length for 2 operator: ${variables.length}`);
        }
        return variables[0].set(variables[0].value + variables[1].value);
    },

    /**
    * substruct assignment operator
    * @param {Variable[]} variables 
    */
    '-=': function(variables) {
        if (variables.length != 2) {
            throw makeError(`Invalid argument length for 2 operator: ${variables.length}`);
        }
        return variables[0].set(variables[0].value - variables[1].value);
    },

    /**
     * Multiple assignment operator
     * @param {Variable[]} variables 
     */
    '*=': function(variables) {
        if (variables.length != 2) {
            throw makeError(`Invalid argument length for 2 operator: ${variables.length}`);
        }
        return variables[0].set(variables[0].value / variables[1].value);
    },

    /**
     * Division assignment operator
     * @param {Variable[]} variables 
     */
    '/=': function(variables) {
        if (variables.length != 2) {
            throw makeError(`Invalid argument length for 2 operator: ${variables.length}`);
        }
        return variables[0].set(variables[0].value / variables[1].value);
    },

    /**
     * Modular assignment operator
     * @param {Variable[]} variables 
     */
    '%=': function(variables) {
        if (variables.length != 2) {
            throw makeError(`Invalid argument length for 2 operator: ${variables.length}`);
        }
        return variables[0].set(variables[0].value % variables[1].value);
    },

    /**
     * bit or assignment operator
     * @param {Variable[]} variables 
     */
    '|=': function(variables) {
        if (variables.length != 2) {
            throw makeError(`Invalid argument length for 2 operator: ${variables.length}`);
        }
        return variables[0].set(variables[0].value | variables[1].value);
    },

    /**
     * bit and assignment operator
     * @param {Variable[]} variables 
     */
    '&=': function(variables) {
        if (variables.length != 2) {
            throw makeError(`Invalid argument length for 2 operator: ${variables.length}`);
        }
        return variables[0].set(variables[0].value & variables[1].value);
    },

    /**
     * increment operator
     * @param {Variable[]} variables 
     */
    '++': function(variables) {
        if (variables.length != 1) {
            throw makeError(`Invalid argument length for 1 operator: ${variables.length}`);
        }
        return variables[0].set(variables[0].value + 1);
    },

    /**
     * decrement operator
     * @param {Variable[]} variables 
     */
    '--': function(variables) {
        if (variables.length != 1) {
            throw makeError(`Invalid argument length for 1 operator: ${variables.length}`);
        }
        return variables[0].set(variables[0].value + 1);
    },
};

/**
 * @class multi level token stack
 */
class TokenStack {
    constructor() {
        this.#stack = [[]];
    }

    /**
     * push element into current stack level
     * @param {Token} token 
     */
    push(token) {
        this.#stack[this.#level].push(token);
    };

    /**
     * pop element on current stack level
     * @returns {Token} token
     */
    pop() {
        if (this.#stack[this.#level].length == 0) {
            throw makeError('No token to pop');
        }
        return this.#stack[this.#level].pop();
    };

    /**
     * peek element on current stack level
     * @param {number} offset level offset to peek
     * @returns {Token} token
     */
    peek(offset=0) {
        if (this.#level < offset) {
            throw makeError('No token to peek');
        }
        return last(this.#stack[this.#level - offset]);
    };

    /**
     * elevate stack level
     */
    elevate() {
        this.#stack.push([]);
        this.#level += 1;
    };

    /**
     * fall stack level
     * @returns {Token[]} tokens
     */
    fall() {
        if (this.#level == 0) {
            throw makeError('No stack level to fall');
        }
        const ret = this.#stack.pop();
        this.#level -= 1;
        return ret;
    };

    /**
     * get stack level
     * @returns {Token[]} tokens
     */
    get(level) {
        if (this.#level < level) {
            throw makeError('No stack level to get');
        }
        return this.#stack[level];
    };

    get level() {
        return this.#level;
    }

    /** @type {Token[][]} */
    #stack = null;

    #level = 0;    
}

/**
 * make Token from string
 * @param {string} token
 * @returns {Token}
 */
function makeToken(token) {
    if (isFloat.test(token)) {
        return {
            type: TOKEN_FLOAT,
            value: token
        };
    }
    else if (isInteger.test(token)) {
        return {
            type: TOKEN_INTEGER,
            value: token
        };
    }
    else if (isSymbol.test(token)) {
        return {
            type: TOKEN_SYMBOL,
            name: token
        };
    }
    else {
        throw makeError(`Unknown token: ${token}`);
    }
}

/**
 * split string to Token
 * @param {string} string
 * @returns {Token[]} tokens
 */
function stringToToken(string) {
    const tokens = [];
    let token = '';
    let stringSequence = false;
    for (const char of string) {
        if (stringSequence) {
            if (char === '\'') {
                tokens.push({
                    type: TOKEN_STRING,
                    value: token
                });
                token = '';
                stringSequence = false;
            }
            else {
                token += char;
            }
        }
        else if (canBeOperand.test(token + char)) {
            token += char;
        }
        else {
            if (token.length) {
                tokens.push(makeToken(token));
                token = '';
            }

            switch (char) {
            case ' ':
            case '\t':
                break;
            case '[':
            case ']':
            case '(':
            case ')':
            case '.':
            case ',':
                tokens.push({
                    type: TOKEN_OPERATOR,
                    operator: char
                });
                break;
            case '\'':
                stringSequence = true;
                break;
            default:
                break;
            }
        }
    }

    if (token.length) {
        tokens.push(makeToken(token));
    }

    return tokens;
}

/**
 * parse token string to Tokens
 * @param {string} string 
 * @returns {Token[]}
 */
function parse(string) {
    const stack = new TokenStack();

    let hasEffectiveOperand = false;
    for (const token of stringToToken(string)) {
        switch (token.type) {
        case TOKEN_STRING:
        case TOKEN_SYMBOL:
        case TOKEN_INTEGER:
        case TOKEN_FLOAT:
            if (hasEffectiveOperand) {
                throw makeError(`Duplicated operand definition: ${token.name}/${token.value}`);
            }

            stack.push(token);
            hasEffectiveOperand = true;
            break;

        case TOKEN_OPERATOR:
            switch (token.operator) {
            case '.':
                if (!hasEffectiveOperand) {
                    throw makeError('No operand to reference');                
                }
                hasEffectiveOperand = false;
                break;

            case ',':
                if (stack.peek(1).type !== TOKEN_CALL && stack.peek(1).type !== TOKEN_ARRAY) {
                    throw makeError(`Invalid function call stacking with ${stack.peek(1).type}`);
                }
                if (!hasEffectiveOperand) {
                    throw makeError('Unexpected comma operator for no operand');
                }
                hasEffectiveOperand = false;

                stack.peek(1).args.push(stack.fall());
                stack.elevate();
                break;

            case '[':
                if (hasEffectiveOperand) {
                    hasEffectiveOperand = false;
                    stack.push({
                        type: TOKEN_INDEX,
                        index: null,
                    });
                }
                else {
                    stack.push({
                        type: TOKEN_ARRAY,
                        args: [],
                    });
                }
                stack.elevate();
                break;

            case ']':
                switch (stack.peek(1).type) {
                case TOKEN_INDEX:
                    if (stack.peek() == null) {
                        throw makeError(`No index value to refer`);
                    }
                    stack.peek(1).index = stack.fall();
                    break;
                case TOKEN_ARRAY:
                    if (stack.peek()) {
                        stack.peek(1).args.push(stack.fall());
                    }
                    else { 
                        stack.fall();
                    }
                    break;
                default:
                    throw makeError(`Invalid array index stacking with ${stack.peek(1).type}`);
                }
                hasEffectiveOperand = true;
                break;

            case '(':
                if (!hasEffectiveOperand) {
                    throw makeError(`No operand to call function`);
                }
                hasEffectiveOperand = false;

                stack.push({
                    type: TOKEN_CALL,
                    args: [],
                });
                stack.elevate();
                break;

            case ')':
                if (stack.peek(1).type !== TOKEN_CALL) {
                    throw makeError(`Invalid function call stacking with ${stack.peek(1).type}`);
                }

                if (stack.peek()) {
                    stack.peek(1).args.push(stack.fall());
                }
                else { 
                    stack.fall();
                }
                hasEffectiveOperand = true;
                break;

            default:
                throw makeError(`Unknown operator: ${token.operator}`);
            }
            break;

        default:
            throw makeError(`Unknown token type: ${token.type}`);
        }
    }

    if (0 < stack.level) {
        throw makeError(`${stack.level} blacket or parenthesis are missing`);
    }

    return stack.get(0);
}

/**
 * compile Chescarna tokens
 * @param {Token[]} tokens token list
 * @returns {function(any[]): Variable} resolver function
 */
 function compileTokens(tokens) {
    /**
     * @type {function(any[]): {
     *     stack: any[],
     *     set: function(any): any
     * }}
     */
    let resolver = null;

    const lastToken = last(tokens);
    for (const token of tokens) {
        switch (token.type) {
        case TOKEN_SYMBOL:
            if (resolver) {
                const currentResolver = resolver;
                resolver = (contextStack) => {
                    const state = currentResolver(contextStack);
                    state.stack.push(last(state.stack)[token.name]);
                    if (token === lastToken) {
                        const context = last(state.stack, 1);
                        state.set = (value) => {
                            return (context[token.name] = value);
                        }
                    }
                    return state;
                };
            }
            else {
                resolver = (contextStack) => {
                    for (const context of contextStack) {
                        if (token.name in context) {
                            const state = {
                                stack: [
                                    context,
                                    context[token.name],
                                ],
                                set: null
                            };
                            if (token === lastToken) {
                                state.set = (value) => {
                                    return (context[token.name] = value);
                                }
                            }
                            return state;
                        }
                    }

                    for (const context of [ ASSIGNMENT_OPERATOR, BUILTIN_OBJECT ]) {
                        if (token.name in context) {
                            const state = {
                                stack: [
                                    context,
                                    context[token.name]
                                ],
                                set: null
                            };
                            if (token === lastToken) {
                                state.set = (value) => {
                                    return (context[token.name] = value);
                                }
                            }
                            return state;
                        }
                    }

                    throw makeError(`${token.name} is undefined`);
                };
            }
            break;

        case TOKEN_INTEGER: {
            const intValue = parseInt(token.value);
            if (resolver) {
                const currentResolver = resolver;
                resolver = (contextStack) => {
                    const state = currentResolver(contextStack);
                    state.stack.push(last(state.stack)[intValue]);
                    return state;
                };
            }
            else {
                resolver = () => {
                    return {
                        stack: [ intValue ],
                        set: null
                    };
                };
            }
        }   break;

        case TOKEN_FLOAT: {
            const floatValue = parseFloat(token.value);
            if (resolver) {
                const currentResolver = resolver;
                resolver = (contextStack) => {
                    const state = currentResolver(contextStack);
                    state.stack.push(last(state.stack)[floatValue]);
                    return state;
                };
            }
            else {
                resolver = () => {
                    return {
                        stack: [ floatValue ],
                        set: null,
                    };
                };
            }
        }   break;

        case TOKEN_STRING:
            if (resolver) {
                const currentResolver = resolver;
                resolver = (contextStack) => {
                    const state = currentResolver(contextStack);
                    state.stack.push(last(state.stack)[token.value]);
                    return state;
                };
            }
            else {
                resolver = () => {
                    return {
                        stack: [ token.value ],
                        set: null
                    };
                };
            }
            break;

        case TOKEN_INDEX: {
            const currentResolver = resolver;
            const indexResolver = compileTokens(token.index);
            resolver = (contextStack) => {
                const state = currentResolver(contextStack);
                state.stack.push(last(state.stack)[indexResolver(contextStack).value]);
                return state;
            };
        }   break;

        case TOKEN_ARRAY:
            if (resolver === null) {
                const elementResolvers = Array.from(token.args, (x) => compileTokens(x));
                resolver = (contextStack) => {
                    return {
                        stack: [ Array.from(elementResolvers, (x) => x(contextStack).value) ],
                        set: null
                    };
                };
            }
            else {
                throw makeError(`Invalid array token position: ${token.args}`);
            }
            break;

        case TOKEN_CALL: {
            const currentResolver = resolver;
            const argumentResolvers = Array.from(token.args, (x) => compileTokens(x));
            resolver = (contextStack) => {
                const state = currentResolver(contextStack);
                const thisArg = last(state.stack, 1);
                const func = last(state.stack);
                if (thisArg === ASSIGNMENT_OPERATOR) {
                    state.stack.push(
                        func.apply(
                            thisArg,
                            [ Array.from(argumentResolvers, (x) => x(contextStack)) ]));
                }
                else {
                    state.stack.push(
                        func.apply(
                            thisArg,
                            Array.from(argumentResolvers, (x) => x(contextStack).value)));
                }
                return state;
            };
        }   break;

        default:
            throw makeError(`Invalid token type: ${token.type}`);
        }
    }

    if (resolver === null) {
        throw makeError(`Unexpected token array: ${JSON.stringify(tokens)}`);
    }

    return (contextStack) => {
        const state = resolver(contextStack);
        return {
            value: last(state.stack),
            set: state.set
        };
    };
}

/**
 * compile Chescarna script string
 * @param {string} string 
 * @returns {function(Object[]): Object} 
 */
export function compile(string) {
    if (typeof string === 'string') {
        /** @type {(function(Object[]): Variable)[]} */
        const compiled = [];

        while (true) {
            const found = string.match(STATEMENT_MATHER);

            if (found === null) {
                const value = string;
                compiled.push(() => {
                    return {
                        value,
                        set: null
                    };
                });
                break;
            }

            if (found[1].length) {
                const value = found[1];
                compiled.push(() => {
                    return {
                        value,
                        set: null
                    };
                });
            }

            if (found[2].length) {
                compiled.push(compileTokens(parse(found[2])));
            }

            if (found[3].length) { 
                string = found[3];
                continue;
            }

            break;
        }

        if (compiled.length == 1) {
            return (contextStack) => {
                return compiled[0](contextStack).value;
            };
        }
        else if (2 <= compiled.length) {
            return (contextStack) => {
                let ret = compiled[0](contextStack).value;
                for (let i = 1; i < compiled.length; ++i) {
                    ret += compiled[i](contextStack).value;
                }
                return ret;
            };
        }
    }

    return function() {
        return string;
    };
}
