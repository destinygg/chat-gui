import {fetch} from 'whatwg-fetch'
import $ from 'jquery'
import './chat/css/style.scss'
import Chat from './chat/js/chat'

/**
 * GET Params
 * u:   socket url
 * a:   api url
 * s:   cdn url
 * c:   cache key
 * t:   template [EMBED | STREAM]
 * f:   font scale on STREAM layout [1 ... 10]
 * @type {Chat}
 */

const chat = new Chat({
    url: Chat.reqParam('u') || `ws://localhost:9000`,
    api: {base: Chat.reqParam('a') || `http://localhost:8181`},
    cdn: {base: Chat.reqParam('s') || `http://localhost:8182`},
    cacheKey: Chat.reqParam('c') || (new Date()).getTime()
});

switch ((Chat.reqParam('t') || 'embed').toUpperCase()) {

    case 'EMBED':
        chat.withGui(require('./views/embed.html'))
            .then(() => chat.loadUserAndSettings())
            .then(() => chat.loadEmotesAndFlairs())
            .then(() => chat.loadHistory())
            .then(() => chat.loadWhispers())
            .then(() => chat.connect())
        break;

    case 'STREAM':
        $('body,html').css('background', 'transparent')
        chat.withGui(require('./views/stream.html'))
            .then(() => {
                chat.settings.set('fontscale', Chat.reqParam('f') || 1)
                chat.applySettings(false)
            })
            .then(() => chat.loadEmotesAndFlairs())
            .then(() => chat.loadHistory())
            .then(() => chat.connect())
        break;
}


// Keep the website session alive.
setInterval(() => fetch(`${chat.config.api.base}/ping`).catch(console.warn), 10*60*1000)


