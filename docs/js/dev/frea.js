'use strict'

import * as Toolkit from './lily.js';

/**
 * @param {Toolkit.Renderer} renderer 
 * @param {Object} config 
 */
export function Stage(renderer, config) {
    this.renderer = renderer;
    this.config = config;
    this.talkHistory = [];
    this.characters = {};
    this.event_listeners = {};
    this.widgets = {};
}

/**
 * @member renderer toolkit renderer
 * @type {Toolkit.Renderer} 
 */
Stage.prototype.renderer = null;

/**
 * @member config config object
 * @type {Object}
 */
Stage.prototype.config = null;

/**
 * @member background background dialog name
 * @type {string}
 */
Stage.prototype.background = null;

/**
 * @member name a character name now focused
 * @type {string}
 */
Stage.prototype.name = '';

 /**
  * @member talk talk the character spoke
  * @type {string}
  */
Stage.prototype.talk = '';

/**
 * @member talkHistory talk history until now
 * @type {string[]}
 */
Stage.prototype.talkHistory = null;
Stage.prototype.option = '';

/**
 * @type {Object}
 */
Stage.prototype.characters = null;
Stage.prototype.biography = null;
Stage.prototype.bgm = null;
Stage.prototype.voice = null;
Stage.prototype.effect = null;
Stage.prototype.event_listeners = null;
Stage.prototype.widgets = null;

/**
 * start stage rendering
 * @param {Toolkit.Sprite} sprite root sprite to render
 * @param {Toolkit.AudioPlayer[]} audio audio player list to play
 */
Stage.prototype.start = function Stage_start(sprite, audio) {
    this.renderer.start(sprite, audio);
};

/**
 * stop stage rendering
 */
Stage.prototype.stop = function Stage_stop() {
    this.renderer.stop();
}

/**
 * set background dialog name and post background event
 * @param {string} background a background dialog name 
 */
Stage.prototype.setBackground = function Stage_setBackground(background) {
    if (this.background != background) {
        this.background = background;
        this.postEvent('background', background);
    }
};

/**
 * set character name name and post name event
 * @param {string} name a character name 
 */

Stage.prototype.setName = function Stage_setName(name) {
    if (this.name != name) {
        this.name = name;
        this.postEvent('name', name);
    }
};

/**
 * set character talk and post talk event
 * @param {string} talk a background dialog name 
 */
Stage.prototype.setTalk = function Stage_setTalk(talk) {
    if (this.talk != talk) {
        this.talk = talk;
        this.talkHistory.push(talk);
        this.postEvent('talk', talk);
        this.postEvent('talk_history', this.talkHistory);
    }
};

/**
 * set option string
 * @param {string} option an option string to select
 */
Stage.prototype.setOption = function Stage_setOption(option) {
    if (this.option != option) {
        this.option = option;
        this.postEvent('option', option);
    }
};

/**
 * set character string
 * @param {number} id character id to render
 * @param {string} face character face name 
 * @param {string} pos character position to render 
 */
Stage.prototype.setCharacter = function Stage_setCharacter(id, face, pos) {
    if (!(pos in this.characters)) {
        this.characters[pos] = {
            id: null,
            face: null,
            position: pos,
        };
    }

    if (this.characters[pos].id != id || this.characters[pos].face != face) {
        this.characters[pos].id = id;
        this.characters[pos].face = face;
        this.postEvent('character', this.characters[pos]);
    }
};

Stage.prototype.setBiography = function Stage_setBiography(biography) {
    if (this.biography != biography) {
        this.biography = biography;
        this.postEvent('biography', this.biography);
    }
};

Stage.prototype.eraseCharacter = function Stage_eraseCharacter(position) {
    for (var pos in this.characters) {
        this.characters[pos].id = null;
        this.characters[pos].face = null;
        this.postEvent('character', this.characters[pos]);
    }
};

Stage.prototype.setBgm = function Stage_setBgm(bgm) {
    if (this.bgm != bgm) {
        this.bgm = bgm;
        this.postEvent('bgm', bgm);
    }
};

Stage.prototype.setVoice = function Stage_setVoice(voice) {
    if (this.voice != voice) {
        this.voice = voice;
        this.postEvent('voice', voice);
    }
};

Stage.prototype.setEffect = function Stage_setEffect(effect) {
    if (this.effect != effect) {
        this.effect = effect;
        this.postEvent('effect', effect);
    }
};

Stage.prototype.addEventListener = function Stage_addEventListener(event, listener) {
    if (listener) {
        if (this.event_listeners[event]) {
            this.event_listeners[event].push(listener);
        }
        else {
            this.event_listeners[event] = [ listener ];
        }
    }
};

Stage.prototype.postEvent = function Stage_postEvent(event, arg) {
    for (var i in this.event_listeners[event]) {
        this.event_listeners[event][i](arg);
    }
};

Stage.prototype.addWidget = function Stage_addWidget(tag, widget) {
    if (tag in this.widgets) {
        this.widgets[tag].push(widget);
    }
    else {
        this.widgets[tag] = [ widget ];
    }
};

/**
 * call a widget method
 * @param {string} tag tag name
 * @param {string} method method name
 * @param {Object} arg argument
 */
Stage.prototype.callWidget = function Stage_callWidget(tag, method, arg) {
    const widgets = this.widgets[tag];
    for (let i in widgets) {
        widgets[i][method](arg);
    }
};

/**
 * get widget list by tag
 * @param {string} tag widget tag
 * @returns {Object[]} widgte list
 */
Stage.prototype.getWidget = function Stage_getWidget(tag) {
    return this.widgets[tag];
};

/**
 * make body rectrangle from body position array
 * @param {number[]} arr the body position array
 * @returns {Toolkit.Rect} body rect
 */
Stage.prototype.makeBodyRect = function makeBodyRect(arr) {
    if (Array.isArray(arr) && arr.length == 4) {
        return Toolkit.Rect({
            x: arr[0],
            y: arr[1],
            w: arr[2],
            h: arr[3]
        });
    }

    throw new Error('ERROR: unknown Body array object', arr);
};

/**
 * make face mapping rectangle from face position array
 * @param {number[]} arr the face position array
 */
Stage.prototype.makeFaceRect = function makeFaceRect(arr) {
    if (Array.isArray(arr) && arr.length == 6) {
        return {
            src: new Toolkit.Rect({
                x: arr[2],
                y: arr[3],
                w: arr[4],
                h: arr[5]
            }),
            dst: new Toolkit.Rect({
                x: arr[0],
                y: arr[1],
                w: arr[4],
                h: arr[5]
            })
        };
    }

    throw new Error('ERROR: unknown Face array object', arr);
};

/**
 * crop a texture
 * @param {*} tex texture to be cropped
 * @param {*} crop cropping region
 * @returns {HTMLImageElement} cropped image
 */
Stage.prototype.cropTexture = function cropTexture(tex, crop) {
    const layer = new Toolkit.Layer(document.createElement('canvas'));
    layer.setSize(crop.getWidth(), crop.getHeight());
    layer.drawImage(tex, crop, crop.move(crop.getPointLT().invert()));
    return layer.getImage();
};

/**
 * 
 * @param {Object} obj object to inherit
 * @param {Object} widget 
 */
Stage.prototype.inherit = function Finherit(obj, widget) {
    if (typeof obj === 'string' && obj.indexOf('.') == 0) {
        return widget[obj.substring(1)];
    }
    else if('class' in obj) {
        let inherited = Object.create(widget[obj.class]);
        for (let i in obj) {
            inherited[i] = obj[i];
        }
        return inherited;
    }
    else {
        return obj;
    }
};

export function Background(obj, widget, stage) {
    var sprite = stage.create('Sprite');
    var crop = stage.create('Rect', { x:0, y:448, w:1024, h:576 })

    stage.addEventListener('background', function(value) {
        imgOnLoad(stage.create('Texture', stage.config.data.texture.dialog + '/' + value), function(texture) {
            sprite.setTexture(stage.cropTexture(texture, crop));
        });
    });

    sprite.setRegion(stage.create('Rect', { x:0, y:0, w:1024, h:576 }));

    return sprite;
};

export function Name(obj, widget, stage) {
    if (checkProperties(obj, [ 'text', 'rect' ])) {
        obj.text = stage.inherit(obj.text, widget);

        var sprite = stage.create('Sprite');
        sprite.setRegion(stage.create('Rect', obj.rect));
        stage.addEventListener('name', function(value) {
            if (value) {
                obj.text.string = value;
                sprite.setText(
                    stage.create('Text', obj.text));
            }
            else {
                sprite.setText(null);
            }

        });

        return sprite;
    }

    throw new Error('ERROR: unknown object for Name', obj);
};

export function Talk(obj, widget, stage) {
    if (checkProperties(obj, [ 'text', 'rect' ])) {
        obj.text= stage.inherit(obj.text, widget);

        var sprite = stage.create('Sprite');
        sprite.setRegion(stage.create('Rect', obj.rect));
        stage.addEventListener('talk', function(value) {
            if (value) {
                obj.text.string = value;
                sprite.setText(
                    stage.create('Text', obj.text));
            }
            else {
                sprite.setText(null);
            }
        });

        return sprite;
    }

    throw new Error('ERROR: unknown object for Talk', obj);
};

export function TalkHistory(obj, widget, stage) {
};

export function Option(obj, widget, stage) {
};

export function Character(obj, widget, stage) {
    if (checkProperties(obj, [ 'rect', 'pos' ])) {
        var sprite = stage.create('Sprite');
        var region = stage.create('Rect', obj.rect);
        var layer = stage.create('Layer', document.createElement('canvas'));

        var texture = null;
        var shadow_texture = null;

        sprite.setRegion(region);

        var makeTexture = function(tex, body_rect, face_rect) {
            var offset = body_rect.getPointLT().invert();
            var body_rect_dst = body_rect.move(offset);
            face_rect.dst = face_rect.dst.move(offset)

            layer.setSize(body_rect_dst.getWidth(), body_rect_dst.getHeight());
            layer.drawImage(tex, body_rect, body_rect_dst);
            layer.drawImage(tex, face_rect.src, face_rect.dst);

            texture = layer.getImage();

            var blend_func = layer.setBlendFunc('source-atop');
            layer.fillRect('rgba(0, 0, 0, 0.5)', body_rect_dst);
            layer.setBlendFunc(blend_func);

            shadow_texture = layer.getImage();

            sprite.setTexture(texture);
            var r = body_rect_dst
                .moveX(region.getLeft() - face_rect.dst.getLeft() - (face_rect.dst.getWidth() >> 1))
                .moveY(region.getTop());
            sprite.setRegion(r);
        };

        stage.addEventListener('character', function(character) {
            if (character.position == obj.pos) {
                if (character.id) {
                    if (obj.characters) {
                        var found = false;
                        for (var i in obj.characters) {
                            if (obj.characters[i] == character.id) {
                                found = true;
                                break;
                            }
                        }

                        if (!found) {
                            character.id = obj.characters[character.id % obj.characters.length]
                        }
                    }

                    IPC.requestCharacter(character.id, function(data) {
                        imgOnLoad(stage.create('Texture', stage.config.data.texture.character + '/' + data.texture), function(texture) {
                            var body_rect = stage.makeBodyRect(data.body_rect);
                            var face_rect = stage.makeFaceRect(data.face_rect[character.face]);
                            makeTexture(texture, body_rect, face_rect);
                        });
                    });
                }
                else {
                    sprite.setTexture(null);
                    texture = null;
                    shadow_texture = null;
                }
            }
            else {
                if (shadow_texture) {
                    sprite.setTexture(shadow_texture);
                }
            }
        });

        return sprite;
    }

    throw new Error('ERROR: unknown object for Character', obj);
};

export function Biography(obj, widget, stage) {
    if (checkProperties(obj, [ 'rect', 'text' ])) {
        var sprite = stage.create('Sprite');

        sprite.setRegion(stage.create('Rect', obj.rect));

        stage.addEventListener('biography', function(value) {
            console.log(value);
            obj.text = stage.inherit(obj.text, widget);
            sprite.setText(stage.create('Text', {
                string: value,
                color: obj.text.color,
                font: obj.text.font,
                line_height: obj.text.line_height,
                wrap_width: obj.text.wrap_width
            }));
        });

        if ('clip' in obj) {
            sprite.setClip(obj.clip);
        }

        return sprite;
    }

    throw new Error('ERROR: unknown object for Biography', obj);
};

export function Sprite(obj, widget, stage) {
    if ('rect' in obj) {
        var sprite = stage.create('Sprite');

        sprite.setRegion(stage.create('Rect', obj.rect));

        if ('color' in obj) {
            sprite.setColor(obj.color);
        }

        if ('text' in obj) {
            obj.text = stage.inherit(obj.text, widget);
            sprite.setText(stage.create('Text', obj.text));
        }

        if ('image' in obj) {
            obj.image = stage.inherit(obj.image, widget);
            imgOnLoad(stage.create('Texture', stage.config.data.texture.dialog + '/' + obj.image.path), function(texture) {
                if ('crop' in obj.image) {
                    sprite.setTexture(stage.cropTexture(texture, stage.create('Rect', obj.image.crop)));
                }
                else{
                    sprite.setTexture(texture);
                }
            });
        }

        if ('hide' in obj && obj.hide) {
            sprite.hide();
        }

        if ('clip' in obj) {
            sprite.setClip(obj.clip);
        }

        if ('rotate' in obj) {
            sprite.setRotate(obj.rotate);
        }

        if ('scroll' in obj) {
            var ctx = {
                x: obj.rect.x,
                y: obj.rect.y
            };

            sprite.addEventListener('mousemove', function(event) {
                var x = Math.min(Math.max(obj.rect.x, ctx.x + event.offset.x), obj.rect.x + obj.scroll.w);
                var y = Math.min(Math.max(obj.rect.y, ctx.y + event.offset.y), obj.rect.y + obj.scroll.h);
                sprite.setRegion(stage.create('Rect', { x, y, w: obj.rect.w, h: obj.rect.h }));

                var point = stage.create('Point', (x - obj.rect.x) / (obj.scroll.w || 1), (y - obj.rect.y) / (obj.scroll.h || 1));
                sprite.postEvent({type: 'scroll', point});
            });

            sprite.addEventListener('mouseup', function(event) {
                ctx.x = Math.min(Math.max(obj.rect.x, ctx.x + event.offset.x), obj.rect.x + obj.scroll.w);
                ctx.y = Math.min(Math.max(obj.rect.y, ctx.y + event.offset.y), obj.rect.y + obj.scroll.h);
            });
        }

        return sprite;
    }

    throw new Error('ERROR: unknown object for Sprite');
};

export function Audio(type, obj, stage) {
    var audio = stage.create('Audio');

    audio.setLoop(stage.config.audio[type].loop);
    audio.setVolume(stage.config.audio[type].volume);

    stage.addEventListener(type, function(filename) {
        if (filename) {
            audio.load(stage.config.data.audio[type] + '/' + filename);
        }
    });

    return audio;
}

/*****************************
 ***  Frea.SpriteContent   ***
 *****************************/
/**
 * @param {Object} obj 
 * @param {Object} widget 
 * @param {Stage} stage 
 */
export function SpriteContent(obj, widget, stage) {
    if ('rect' in obj) {
        this.rect = stage.create('Rect', obj.rect);
    }

    if ('color' in obj) {
        this.color = obj.color;
    }

    if ('text' in obj) {
        this.text = stage.create('Text', stage.inherit(obj.text, widget));
    }

    if ('image' in obj) {
        this.image = stage.inherit(obj.image, widget);
        this.texture = stage.create('Texture', stage.config.data.texture.dialog + '/' + image.path);
    }

    if ('rotate' in obj) {
        this.rotate = obj.rotate;
    }
}

SpriteContent.prototype.region = null;
SpriteContent.prototype.color = null;
SpriteContent.prototype.text = null;
SpriteContent.prototype.image = null;
SpriteContent.prototype.texture = null;
SpriteContent.prototype.rotate = null;

/**
* @param {Sprite} sprite 
*/
SpriteContent.prototype.apply = function SpriteContent_apply(sprite) {
    if (this.region) {
        sprite.setRegion(this.region);
    }

    if (this.color) {
        sprite.setColor(this.color);
    }

    if (this.text) {
        sprite.setText(this.text);
    }

    if (this.texture) {
        imgOnLoad(this.texture, function(texture) {
            if ('crop' in obj.image) {
                sprite.setTexture(stage.cropTexture(texture, stage.create('Rect', obj.image.crop)));
            }
            else{
                sprite.setTexture(texture);
            }
        });
    }

    if (this.rotate) {
        sprite.setRotate(this.rotate);
    }
};

/**
 * frea parser
 * @param {Stage} stage 
 */
export function Parser(stage) {
    this.stage = stage;
}

/**
 * stage to contain parsed widgets
 * @type {Stage}
 */
Parser.prototype.stage = null;

Parser.TYPES = {
    background: Background,
    name: Name,
    talk: Talk,
    talk_history: TalkHistory,
    option: Option,
    character: Character,
    biography: Biography,
    sprite: Sprite,
};

/**
 * 
 * @param {Object} obj 
 * @param {Object} widget
 * @returns {Toolkit.Sprite} the parsed sprite
 */
Parser.prototype.parse = function Parser_parse(obj, widget) {
    if (obj.type in Parser.TYPES) {
        /** @type {Toolkit.Sprite} */
        var sprite = Parser.TYPES[obj.type](obj, widget, this.stage);

        for (var i in obj.children) {
            sprite.addChild(this.parse(obj.children[i], widget));
        }

        if ('action' in obj) {
            var self = this;
            for (var e in obj.action) {
                sprite.addEventListener(e, function(event) {
                    var cmds = Array.isArray(obj.action[e]) ? obj.action[e] : [ obj.action[e] ];
                    for (var i in cmds) {
                        var command = cmds[i].split('.');
                        self.stage.callWidget(command[0], command[1], event.point, sprite);
                    }
                });
            }
        }

        if ('tag' in obj) {
            this.stage.addWidget(obj.tag, sprite);
        }

        return sprite;
    }

    throw new Error('ERROR: unknown object type(' + obj.type +')');
};

/**
 * 
 * @param {Object} obj
 * @return {Object} parsed audio
 */
Parser.prototype.parseAudio = function Parser_parseAudio(obj) {
    var channels = {};

    for (var key in obj) {
        channels[key] = new Audio(key, obj[key], this.stage);
    }

    return channels;
};
