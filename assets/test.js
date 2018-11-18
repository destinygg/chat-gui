/* global $ */
import 'jquery'
import 'moment'
import 'normalize.css'
import './chat/js/notification'
import './chat/css/style.scss'
import Chat from './chat/js/chat'

const chat = new Chat({
    url: Chat.reqParam('u') || `ws://localhost:9000`,
    api: {base: Chat.reqParam('a') || `http://localhost:8181`},
    cdn: {base: Chat.reqParam('s') || `http://localhost:8182`},
    cacheKey: Chat.reqParam('c') || (new Date()).getTime()
}).withGui();

chat.setSettings()
    .then(() => {
        chat.settings.set('fontscale', Chat.reqParam('scale') || 1)
        chat.applySettings(false)
    })
    //.loadUserAndSettings()
    .then(() => chat.loadEmotesAndFlairs())
    .then(() => chat.loadHistory())
    //.then(() => chat.loadWhispers())
    .then(() => chat.connect())

// Keep the website session alive.
setInterval(() => fetch(`${chat.api.base}/ping`).catch(console.warn), 10*60*1000)


