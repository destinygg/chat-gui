import $ from 'jquery';
import './chat/css/style.scss';
import Chat from './chat/js/chat';
import embedHtml from './views/embed.html';
import streamHtml from './views/stream.html';

/**
 * GET Params
 * t:   template [EMBED | STREAM]
 * f:   font scale on STREAM layout [1 ... 10]
 * @type {Chat}
 */

const chat = new Chat({
  url: 'wss://localhost:8282/chat',
  api: { base: 'https://localhost:8282' },
  cdn: { base: 'https://localhost:8282/cdn' },
});

const html = $('body,html');

switch ((chat.reqParam('t') || 'embed').toUpperCase()) {
  case 'STREAM':
    html.css('background', 'transparent');
    chat
      .withGui(streamHtml)
      .then(() => {
        chat.settings.set('fontscale', chat.reqParam('f') || 1);
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
            `,
      )
      .then(() => chat.connect());
    break;

  case 'EMBED':
  default:
    chat
      .withGui(embedHtml)
      .then(() => chat.loadEmotesAndFlairs())
      .then(() => chat.loadHistory())
      .then(() => chat.connect());
    break;
}
