function makeStage(canvas, config, sprite, widget, audio) {
    var lily_renderer = new Lily.Renderer(canvas);
    var frea_stage = new Frea.Stage(lily_renderer, config);
    var frea_parser = new Frea.Parser(frea_stage);
    frea_stage.start(frea_parser.parse(sprite, widget), frea_parser.parseAudio(audio));
    return frea_stage;
}

function setFFTimer(frea_stage) {
    var ff = null;

    window.addEventListener('keydown', function(e) {
        if (e.key == 'Control' && !ff) {
            ff = setInterval(function() {
                frea_stage.callWidget('stage', 'next');
            }, 100);
        }
    });

    window.addEventListener('keyup', function(e) {
        if (e.key == 'Control' && ff) {
            clearInterval(ff);
            ff = null;
        }
    });
}

Application.onLoad(function(config) {
    var param = getURLParameter();
    var next_dialog = [ param['v'] ];
    document.title = param['title'];

    IPC.requestLayout(null, function(layout) {
        console.log(layout);
        var frea_stage = makeStage(document.getElementById('dialog_canvas'), config, layout.scenario, layout.widget, config.audio);
        var dialog_timeout = null;

        var receiveDialog = function(data) {
            if ('bg_pic' in data) {
                frea_stage.setBackground(data['bg_pic']);
            }

            if (data['erase'] == '雙方') {
                frea_stage.eraseCharacter();
            }

            if ('pos' in data) {
                frea_stage.setCharacter(data['char_id'], data['face'], data['pos']);
            }

            if (!('pos' in data) || !('char_id' in data)) {
                frea_stage.setEffect(data['effect']);
            }

            if ('bgm' in data) {
                frea_stage.setBgm(data['bgm']);
            }

            if ('voice' in data) {
                frea_stage.setVoice(data['voice']);
            }

            frea_stage.setName(data['name']);
            frea_stage.setTalk(data['talk']);
            frea_stage.setOption(data['option']);

            next_dialog = data['next'];
            if (dialog_timeout) {
                clearTimeout(dialog_timeout);
                dialog_timeout = null;
            }
        };

        frea_stage.addWidget('stage', {
            'next': function (e) {
                if (!dialog_timeout) {
                    if (next_dialog && (e | 0) < next_dialog.length) {
                        IPC.requestDialog(next_dialog[e | 0], receiveDialog);
                        dialog_timeout = setTimeout(function () {
                            IPC.backHtml();
                        }, 1000);
                    }
                    else {
                        IPC.backHtml();
                    }
                }
            },
            'back': function() {
                IPC.backHtml();
            }
        });

        frea_stage.callWidget('stage', 'next');

        setFFTimer(frea_stage);
    });
});
