/* global $ */

require('core-js/es6')
require('jquery')
require('moment')
require('normalize.css')
require('font-awesome/scss/font-awesome.scss')
require('./chat/js/notification')
require('./chat/css/style.scss')

const parameterByName = name => {
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(window.location.href);
    if (!results || !results[2]) return null;
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

const loadCss = function(url) {
    const link = document.createElement('link');
    link.href = url;
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.media = 'screen';
    document.getElementsByTagName('head')[0].appendChild(link);
    return link;
}

const Chat = require('./chat/js/chat')['default']
const argWs = parameterByName('u') || `ws://localhost:9000`
const argUrl = parameterByName('a') || `http://localhost:8181`
const argCdn = parameterByName('s') || `http://localhost:8182`
const cacheKey = parameterByName('c') || (new Date()).getTime()

$.when(
    new Promise(res => $.getJSON(`${argUrl}/api/chat/me`).done(res).fail(() => res(null))),
    new Promise(res => $.getJSON(`${argUrl}/api/chat/history`).done(res).fail(() => res(null))),
    new Promise(res => $.getJSON(`${argCdn}/flairs/flairs.json?_=${cacheKey}`).done(res).fail(() => res(null))),
    new Promise(res => $.getJSON(`${argCdn}/emotes/emotes.json?_=${cacheKey}`).done(res).fail(() => res(null))),
    new Promise(res => res(loadCss(`${argCdn}/flairs/flairs.css?_=${cacheKey}`))),
    new Promise(res => res(loadCss(`${argCdn}/emotes/emotes.css?_=${cacheKey}`))),
).then((settings, history, flairs, emotes) => {
    return new Chat()
        .withUserAndSettings(settings)
        .withEmotes(emotes)
        .withFlairs(flairs)
        .withGui()
        .withHistory(history)
        .withWhispers()
        .connect(argWs)
})