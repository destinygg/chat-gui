/* global $ */

require('core-js/es6')
require('jquery')
require('moment')
require('normalize.css')
require('font-awesome/scss/font-awesome.scss')
require('./chat/js/notification')
require('./chat/css/style.scss')

const url = window.location.href;
const parameterByName = name => {
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results || !results[2]) return null;
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

const Chat = require('./chat/js/chat')['default']
const emotes = require('./emotes.json')
const argWs = parameterByName('u') || `ws://localhost:9000`
const argUrl = parameterByName('a') || `http://localhost:8181`

$.when(
    new Promise(res => $.getJSON(`${argUrl}/api/chat/me`).done(res).fail(() => res(null))),
    new Promise(res => $.getJSON(`${argUrl}/api/chat/history`).done(res).fail(() => res(null)))
).then((userAndSettings, history) =>
    new Chat()
        .withUserAndSettings(userAndSettings)
        .withEmotes(emotes)
        .withGui()
        .withHistory(history)
        .withWhispers()
        .connect(argWs)
)