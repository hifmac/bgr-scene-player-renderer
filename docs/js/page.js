/**
 * @file page.js
 * @description Main page script loaded from page.html
 * @author hifmac(E328456 of the Frea server)
 * @copyright (c) 2021 hifmac
 * @license MIT-License
 */
'use strict';

import {
    onLoad,
    getURLParameter,
    BGRSP
} from './blanc/lisette.js';

/**
 * draw BGRSP page
 * @param {typeof import('./components/background.js').default} Background 
 * @param {typeof import('./components/scenario.js').default} Scenario 
 * @param {typeof import('./components/check.js').default} Check 
 * @param {typeof import('./components/search.js').default} Search 
 * @param {typeof import('./components/texture-preview.js').default} TexturePreview 
 * @param {typeof import('./components/character-editor.js').default} CharacterEditor 
 * @param {typeof import('./components/audio-test.js').default} AudioTest 
 * @param {Object} config
 */
function drawPage(
    Background,
    Scenario,
    Check,
    Search,
    TexturePreview,
    CharacterEditor,
    AudioTest,
    config) {

    const background = new Background('#background', config);
    background.show();

    let currentView = null;
    const scenario = new Scenario('#app', getURLParameter().v, config);
    const check = new Check('#app', config);
    const search = new Search('#app', config);
    const texturePreview = new TexturePreview('#app', config);
    const characterEditor = new CharacterEditor('#app', config);
    const audioTest = new AudioTest('#app', config);

    scenario.addViewChangeListener(function(view) {
        if (currentView) {
            currentView.destroy();
            currentView = null;
        }

        switch (view) {
        case 'Check':
            background.setDialog('/dialog/dialog2');
            currentView = check;
            document.title = 'ファイルチェック';
            break;
        case 'Search':
            background.setDialog('/dialog/dialog3');
            currentView = search;
            document.title = '検索';
            break;
        case 'Texture':
            background.setDialog('/dialog/dialog4');
            currentView = texturePreview;
            document.title = 'テクスチャプレビュー';
            break;
        case 'Character':
            background.setDialog('/dialog/dialog5');
            currentView = characterEditor;
            document.title = 'キャラクタエディタ';
            break;
        case 'Audio':
            background.setDialog('/dialog/dialog6');
            currentView = audioTest;
            document.title = '音声テスト';
            break;
        }

        if (currentView) {
            currentView.show();
        }
    });

    function backPage(e) {
        if (currentView === scenario) {
            scenario.back();
        }
        else {
            if (currentView) {
                currentView.destroy();
            }

            background.setDialog('/dialog/dialog1');
            scenario.show();
            currentView = scenario;
            document.title = 'シナリオページ';
        }
    }

    window.addEventListener('keydown', function(e) {
        if (e.key == 'Escape') {
            backPage();
        }
    });

    backPage();
}

/**
 * draw test page
 * @param {typeof import('./sandica/adelite.js').default} Adelite 
 */
function drawTestPage(Adelite) {
    const template = {
        "link": {
            "once:rel": "stylesheet",
            "once:href": "https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css",
            "once:integrity": "sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk",
            "once:crossorigin": "anonymous"
        },
        "div.container-fluid": {
            "div.border row p-2": {
                "div.col-2 inline": {
                    "once:textContent": "BGRSPテストページ"
                },
                "div.col-3 inline": {
                    "once:textContent": "v2.0.0"
                }
            }
        },
        "script#jquery": {
            "once:src": "https://code.jquery.com/jquery-3.5.1.slim.min.js",
            "once:integrity": "sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj",
            "once:crossorigin": "anonymous",
            "on:load": "{{ jqueryReady() }}"
        },
        "script#bootstrap": {
            "if": "{{ isJQueryReady }}",
            "once:src": "https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js",
            "once:integrity": "sha384-OgVRvuATP1z7JjHLkuOU7Xw704+h835Lr+6QL9UvYjZE3Ipu6Tp75j7Bh/kR0JKI",
            "once:crossorigin": "anonymous",
        },    
    };

    const adelite = new Adelite('#app', template);
    adelite.show({
        isJQueryReady: false,
        jqueryReady() {
            this.isJQueryReady = true;
            adelite.update();
        }
    });
    adelite.update();

    document.title = 'テストページ';
}

if (BGRSP) {
    Promise.all([
        import('./components/background.js'),
        import('./components/scenario.js'),
        import('./components/check.js'),
        import('./components/search.js'),
        import('./components/texture-preview.js'),
        import('./components/character-editor.js'),
        import('./components/audio-test.js'),
        new Promise((resolve) => onLoad((config) => resolve(config)))
    ]).then((modules) => drawPage(
        modules[0].default,
        modules[1].default,
        modules[2].default,
        modules[3].default,
        modules[4].default,
        modules[5].default,
        modules[6].default,
        modules[7]));
}
else {
    import('./sandica/adelite.js').then((module) => drawTestPage(module.default));
}
