import * as Lily from './lily.js';
import * as Frea from './frea.js';
import * as Application from '../blanc/lisette.js';

const { Filesystem, IPC } = window.bgrsp;

function makeStage(canvas, config, layout, widget, audio) {
    var lily_renderer = new Lily.Renderer(canvas);
    var frea_stage = new Frea.Stage(lily_renderer, config);
    var frea_parser = new Frea.Parser(frea_stage, widget);
    frea_stage.start(frea_parser.parse(layout, widget), frea_parser.parseAudio(audio));
    return frea_stage;
}

function CircularIndex(index, arr) {
    this.index = index;
    this.array = arr;
}


CircularIndex.prototype.index = null;
CircularIndex.prototype.array = null;
 
CircularIndex.prototype.get = function CircularIndex_get() {
    return this.index;
};

CircularIndex.prototype.inc = function CircularIndex_inc() {
    this.index = (this.index + 1) % this.array.length;
    return this.index;
};

CircularIndex.prototype.dec = function CircularIndex_dec() {
    this.index = (this.index || this.array.length) - 1;
    return this.index;
};

function createDirectory(obj) {
    if (Application.hasOwnProperties(obj, [ 'config', 'character', 'directory', 'layout', 'page' ])) {
        var config = obj.config;
        var character = obj.character;
        var directory = obj.directory;
        var layout = obj.layout;
        var page = obj.page;

        var faces = Object.keys(character.face_rect);
        var voices = Object.keys(directory.voice);
        var pages = [];

        var face_index = new CircularIndex(0, faces);
        var voice_index = new CircularIndex(0, voices);

        var frea_stage = makeStage(document.getElementById('directory_canvas'), config, layout.directory, layout.widget, config.audio);

        var makePlayVoiceListener = function(voicename) {
            return function() {
                frea_stage.setVoice(null);
                frea_stage.setVoice(directory.voice[voicename]);
            };
        };

        var makePlayFavoriteListener = function(subpage) {
            return function() {
                IPC.requestPage(subpage, function(data) {
                    if ('dialog' in data) {
                        IPC.loadDialog(data['dialog'] + '&title=' + data['title']);
                    }
                });
            };
        };

        var voicedir = config.data.audio.voice + '/';
        Filesystem.readDirent(voicedir + character.id, function(dirents) {
            var files = [];
            var found = false;

            dirents.forEach(function(dirent) {
                if (dirent.isFile()) {
                    files.push(dirent.name);
                }
            });

            for (var i = 0; !found && i < files.length; ++i) {
                found = Object.values(directory.voice).indexOf(character.id + '/' + files[i]) != -1;
            }

            if (files.length && !found) {
                var log = '以下のファイルを移動しました\n';
                files.sort();

                for (var i = 0, j = 0; i < files.length && j < voices.length; ++i) {
                    log += character.id + '/' + files[i] + ' -> ' + directory.voice[voices[j]] + '\n';
                    Filesystem.rename(
                        voicedir + character.id + '/' + files[i],
                        voicedir + directory.voice[voices[j]]);

                    while(++j < voices.length && directory.voice[voices[j]] == null);
                }

                alert(log);
            }
        });

        document.title = character.name;

        frea_stage.setName(character.name);
        frea_stage.setBiography(directory.biography);

        frea_stage.setCharacter(character.id, faces[face_index.get()], '左側');
        frea_stage.callWidget('face_name', 'setString', '表情' + faces[face_index.get()].substring(0, 2));

        frea_stage.callWidget('voice_name', 'setString', voices[voice_index.get()]);

        for (var num_button = 0, num_voice = 0; num_button < voices.length; ++num_button) {
            var widgets = frea_stage.getWidget('directory_voice_button_' + num_button);
            if (num_voice < voices.length && directory.voice[voices[num_voice]]) {
                for (var w in widgets) {
                    widgets[w].setString(voices[num_voice]);
                    widgets[w].addEventListener('click', makePlayVoiceListener(voices[num_voice]));
                }

                while(++num_voice < voices.length && directory.voice[voices[num_voice]] == null);
            }
            else {
                for (var w in widgets) {
                    widgets[w].hide();
                }
            }
        }

        for (var i in page.subpages) {
            if (page.subpages[i].indexOf('favorite') == 0) {
                pages.push(page.subpages[i]);
            }
        }
        pages.sort();

        for (var num_favorite = 0; num_favorite < pages.length; ++num_favorite) {
            var widgets = frea_stage.getWidget('directory_favorite_button_' + num_favorite);
            for (var w in widgets) {
                widgets[w].addEventListener('click', makePlayFavoriteListener(pages[num_favorite]));
            }
        }

        frea_stage.addWidget('stage', {
            'back': function() {
                IPC.backHtml();
            },
            'nextFace': function() {
                frea_stage.setCharacter(character.id, faces[face_index.inc()], '左側');
                frea_stage.callWidget('face_name', 'setString', '表情' + faces[face_index.get()].substring(0, 2));
            },
            'prevFace': function() {
                face_index.dec();
                frea_stage.setCharacter(character.id, faces[face_index.dec()], '左側');
                frea_stage.callWidget('face_name', 'setString', '表情' + faces[face_index.get()].substring(0, 2));
            },
            'nextVoice': function() {
                while(directory.voice[voices[voice_index.inc()]] == null);
                frea_stage.callWidget('voice_name', 'setString', voices[voice_index.get()]);
            },
            'prevVoice': function() {
                while(directory.voice[voices[voice_index.dec()]] == null);
                frea_stage.callWidget('voice_name', 'setString', voices[voice_index.get()]);
            },
            'playVoice': function() {
                frea_stage.setVoice(null);
                frea_stage.setVoice(directory.voice[voices[voice_index.get()]]);
            }
        });
    }
}

Application.onLoad(function(config) {
    var param = Application.getURLParameter();
    var obj = { config };

    IPC.requestCharacter(param['v'], function(data) {
        obj.character = data;
        createDirectory(obj);
    });

    IPC.requestDirectory(param['v'], function(data) {
        obj.directory = data;
        createDirectory(obj);
    });

    IPC.requestLayout(null, function(layout) {
        obj.layout = layout;
        createDirectory(obj);
    });

    IPC.requestPage('character' + param['v'], function(data) {
        obj.page = data;
        createDirectory(obj);
    });
});
