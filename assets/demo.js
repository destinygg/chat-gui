import $ from 'jquery';
import './chat/css/style.scss';
import Chat from './chat/js/chat';
import embedHtml from './views/embed.html';
import streamHtml from './views/stream.html';

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
  api: { base: Chat.reqParam('a') || `http://localhost:8181` },
  cdn: { base: Chat.reqParam('s') || `http://localhost:8182` },
  cacheKey: Chat.reqParam('c') || new Date().getTime(),
});

const html = $('body,html');

switch ((Chat.reqParam('t') || 'embed').toUpperCase()) {
  case 'STREAM':
    html.css('background', 'transparent');
    chat
      .withGui(streamHtml)
      .then(() => {
        chat.settings.set('fontscale', Chat.reqParam('f') || 1);
        chat.applySettings(false);
      })
      .then(() => chat.loadEmotesAndFlairs())
      .then(() => chat.loadHistory())
      .then(() => chat.connect());
    break;

  case 'VOTE':
    html.css('background', 'transparent');
    chat
      .withGui(
        `
                <div id="chat" class="chat votechat">
                    <div id="chat-vote-frame"></div>
                    <div id="chat-output-frame" style="display: none;"></div>
                </div>
            `
      )
      .then(() => chat.connect());
    break;

  case 'EMBED':
  default:
    chat
      .withGui(embedHtml)
      .then(() => chat.loadUserAndSettings())
      .then(() => chat.loadEmotesAndFlairs())
      .then(() => chat.loadHistory())
      .then(() => chat.loadWhispers())
      .then(() => chat.connect());
    break;
}
