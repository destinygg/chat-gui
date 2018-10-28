/* global $ */

require('core-js/es6')
require('jquery')
require('moment')
require('normalize.css')
require('font-awesome/scss/font-awesome.scss')
require('./chat/js/notification')
require('./chat/css/style.scss')
// require('./chat/css/onstream.scss') to test onscreen you need to uncomment this line :(

const parameterByName = name => {
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(window.location.href);
    if (!results || !results[2]) return null;
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

const Chat = require('./chat/js/chat')['default']
const argWs = parameterByName('u') || `ws://localhost:9000`
const argUrl = parameterByName('a') || `http://localhost:8181`
const argCdn = parameterByName('s') || `http://localhost:8182`
const cacheKey = parameterByName('c') || (new Date()).getTime()

const chat = new Chat().withGui().withSettings()
$.when(
        new Promise(res => $.getJSON(`${argUrl}/api/chat/me`).done(res).fail(() => res(null))),
        new Promise(res => $.getJSON(`${argUrl}/api/chat/history`).done(res).fail(() => res(null))),
        new Promise(res => $.getJSON(`${argCdn}/flairs/flairs.json?_=${cacheKey}`).done(res).fail(() => res(null))),
        new Promise(res => $.getJSON(`${argCdn}/emotes/emotes.json?_=${cacheKey}`).done(res).fail(() => res(null))),
        new Promise(res => res(Chat.loadCss(`${argCdn}/flairs/flairs.css?_=${cacheKey}`))),
        new Promise(res => res(Chat.loadCss(`${argCdn}/emotes/emotes.css?_=${cacheKey}`))),
    )
    .then((settings, history, flairs, emotes) =>
        chat.withUserAndSettings(settings)
            .withEmotes(emotes)
            .withFlairs(flairs)
            .withHistory(history)
    )
    .then(chat => chat.connect(argWs))
    .then(chat => chat.withWhispers())


