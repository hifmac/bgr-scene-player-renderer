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
    raiseError
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
 */

 /**
 * RegExp to test string able to be an operand
 */
const canBeOperand = /^([_a-zA-Z][_a-zA-Z0-9]*|[0-9+\-][0-9]*(\.[0-9]*)?)$/;

/**
 * RegExp to test symbol name
 */
const isSymbol = /^[_a-zA-Z][_a-zA-Z0-9]*$/;

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

function TokenStack() {
    this.stack = [[]];
}

/** @type {Token[][]} */
TokenStack.prototype.stack = null;

TokenStack.prototype.level = 0;

/**
 * push element into current stack level
 * @param {Token} token 
 */
TokenStack.prototype.push = function TokenStack_push(token) {
    this.stack[this.level].push(token);
};

/**
 * pop element on current stack level
 * @returns {Token} token
 */
TokenStack.prototype.pop = function TokenStack_pop() {
    if (this.stack[this.level].length == 0) {
        raiseError('No token to pop');
    }
    return this.stack[this.level].pop();
};

/**
 * peek element on current stack level
 * @param {number} offset level offset to peek
 * @returns {Token} token
 */
TokenStack.prototype.peek = function TokenStack_peek(offset=0) {
    if (this.level < offset) {
        raiseError('No token to peek');
    }
    return last(this.stack[this.level - offset]);
};

/**
 * elevate stack level
 */
TokenStack.prototype.elevate = function TokenStack_elevate() {
    this.stack.push([]);
    this.level += 1;
};

/**
 * fall stack level
 * @returns {Token[]} tokens
 */
TokenStack.prototype.fall = function TokenStack_fall() {
    if (this.level == 0) {
        raiseError('No stack level to fall');
    }
    const ret = this.stack.pop();
    this.level -= 1;
    return ret;
};

/**
 * get stack level
 * @returns {Token[]} tokens
 */
TokenStack.prototype.get = function TokenStack_get(level) {
    if (this.level < level) {
        raiseError('No stack level to get');
    }
    return this.stack[level];
};

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
        raiseError(`Unknown token: ${token}`);
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
    for (let char of string) {
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
    for (let token of stringToToken(string)) {
        switch (token.type) {
        case TOKEN_STRING:
        case TOKEN_SYMBOL:
        case TOKEN_INTEGER:
        case TOKEN_FLOAT:
            if (hasEffectiveOperand) {
                raiseError(`Duplicated operand definition: ${token.name}/${token.value}`);
            }

            stack.push(token);
            hasEffectiveOperand = true;
            break;

        case TOKEN_OPERATOR:
            switch (token.operator) {
            case '.':
                if (!hasEffectiveOperand) {
                    raiseError('No operand to reference');                
                }
                hasEffectiveOperand = false;
                break;

            case ',':
                if (stack.peek(1).type !== TOKEN_CALL && stack.peek(1).type !== TOKEN_ARRAY) {
                    raiseError(`Invalid function call stacking with ${stack.peek(1).type}`);
                }
                if (!hasEffectiveOperand) {
                    raiseError('Unexpected comma operator for no operand');
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
                        raiseError(`No index value to refer`);
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
                    raiseError(`Invalid array index stacking with ${stack.peek(1).type}`);
                }
                hasEffectiveOperand = true;
                break;

            case '(':
                if (!hasEffectiveOperand) {
                    raiseError(`No operand to call function`);
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
                    raiseError(`Invalid function call stacking with ${stack.peek(1).type}`);
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
                raiseError(`Unknown operator: ${token.operator}`);
            }
            break;

        default:
            raiseError(`Unknown token type: ${token.type}`);
        }
    }

    if (0 < stack.level) {
        raiseError(`${stack.level} blacket or parenthesis are missing`);
    }

    return stack.get(0);
}

/**
 * compile Chescarna tokens
 * @param {Token[]} tokens
 * @returns {function(Object[]): Object} resolver function
 */
 function compileTokens(tokens) {
    /** @type {function(Object[]): Object[]} */
    let resolver = null;

    for (const token of tokens) {
        switch (token.type) {
        case TOKEN_SYMBOL:
            if (resolver) {
                const currentResolver = resolver;
                resolver = function(contextStack) {
                    const stack = currentResolver(contextStack);
                    stack.push(last(stack)[token.name]);
                    return stack;
                };
            }
            else {
                resolver = function(contextStack) {
                    for (let context of contextStack) {
                        if (token.name in context) {
                            return [
                                context,
                                context[token.name],
                            ];
                        }
                    }
                    return [ undefined ];
                };
            }
            break;
        case TOKEN_INTEGER: {
            const intValue = parseInt(token.value);
            if (resolver) {
                const currentResolver = resolver;
                resolver = function(contextStack) {
                    const stack = currentResolver(contextStack);
                    stack.push(last(stack)[intValue]);
                    return stack;
                };
            }
            else {
                resolver = () => [ intValue ];
            }
        }   break;
        case TOKEN_FLOAT: {
            const floatValue = parseFloat(token.value);
            if (resolver) {
                const currentResolver = resolver;
                resolver = function(contextStack) {
                    const stack = currentResolver(contextStack);
                    stack.push(last(stack)[floatValue]);
                    return stack;
                };
            }
            else {
                resolver = () => [ floatValue ];
            }
        }   break;
        case TOKEN_STRING:
            if (resolver) {
                const currentResolver = resolver;
                resolver = function(contextStack) {
                    const stack = currentResolver(contextStack);
                    stack.push(last(stack)[token.value]);
                    return stack;
                };
            }
            else {
                resolver = () => [ token.value ];
            }
            break;
        case TOKEN_INDEX: {
            const currentResolver = resolver;
            const indexResolver = compileTokens(token.index);
            resolver = function(contextStack) {
                const stack = currentResolver(contextStack);
                stack.push(last(stack)[indexResolver(contextStack)]);
                return stack;
            };
        }   break;
        case TOKEN_ARRAY: {
            const elementResolvers = Array.from(token.args, (x) => compileTokens(x));
            resolver = (contextStack) => [ Array.from(elementResolvers, (x) => x(contextStack)) ];
        }   break;
        case TOKEN_CALL: {
            const currentResolver = resolver;
            const argumentResolvers = Array.from(token.args, (x) => compileTokens(x));
            resolver = function(contextStack) {
                const stack = currentResolver(contextStack);
                const thisArg = last(stack, 1);
                const func = last(stack);
                stack.push(func.apply(thisArg, Array.from(argumentResolvers, (x) => x(contextStack))));
                return stack;
            };
        }   break;
        default:
            raiseError(`Invalid token type: ${token.type}`);
        }
    }

    if (resolver === null) {
        raiseError(`Unexpected token array: ${JSON.stringify(tokens)}`);
    }

    return function (contextStack) {
        return last(resolver(contextStack));
    }
}

/**
 * compile Chescarna script string
 * @param {string} string 
 * @returns {function(Object[]): Object} 
 */
export function compile(string) {
    if (typeof string === 'string') {
        /** @type {(function(Object[]): Object)[]} */
        const compiled = [];

        while (true) {
            const found = string.match(STATEMENT_MATHER);

            if (found === null) {
                const value = string;
                compiled.push(() => {
                    return value;
                });
                break;
            }

            if (found[1].length) {
                const value = found[1];
                compiled.push(() => {
                    return value;
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
            return compiled[0];
        }
        else if (2 <= compiled.length) {
            return (contextStack) => {
                let ret = compiled[0](contextStack);
                for (let i = 1; i < compiled.length; ++i) {
                    ret += compiled[i](contextStack);
                }
                return ret;
            };
        }
    }

    return function() {
        return string;
    };
}
