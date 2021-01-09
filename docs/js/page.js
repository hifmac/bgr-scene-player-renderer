
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
    getURLParameter
} from './blanc/lisette.js';

import Background from './components/background.js';
import Scenario from './components/scenario.js';
import Check from './components/check.js';
import Search from './components/search.js';
import TexturePreview from './components/texture-preview.js';
import CharacterEditor from './components/character-editor.js';

onLoad(function (config) {
    const background = new Background('#background', config);
    background.show();

    let currentView = null;
    const scenario = new Scenario('#app', getURLParameter().v, config);
    const check = new Check('#app', config);
    const search = new Search('#app', config);
    const texturePreview = new TexturePreview('#app', config);
    const characterEditor = new CharacterEditor('#app', config);

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
});
