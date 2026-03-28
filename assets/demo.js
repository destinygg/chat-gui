import $ from 'jquery';
import './chat/css/style.scss';
import Chat from './chat/js/chat';
import embedHtml from './views/embed.html';
import streamHtml from './views/stream.html';
import MockChatSource from './chat/js/MockChatSource';

/**
 * GET Params
 * t:      template [EMBED | STREAM]
 * f:      font scale on STREAM layout [1 ... 10]
 * live:   set to 1 to connect to real websocket (mock mode is default)
 * @type {Chat}
 */

const mock = new URLSearchParams(window.location.search).get('live') !== '1';

const chat = new Chat({
  url: 'wss://localhost:8282/chat',
  api: { base: 'https://localhost:8282' },
  cdn: { base: 'https://localhost:8282/cdn' },
  ...(mock ? { source: new MockChatSource() } : {}),
});

if (mock) {
  chat.control.on('MOCK', (parts) => {
    chat.source.send('MSG', { data: `/mock ${(parts || []).join(' ')}` });
  });
}

function connectOrMock() {
  if (mock) {
    chat.source.start();
  } else {
    chat.connect();
  }
}

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
      .then(() => connectOrMock());
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
      .then(() => connectOrMock());
    break;

  case 'EMBED':
  default:
    chat
      .withGui(embedHtml)
      .then(() => chat.loadEmotesAndFlairs())
      .then(() => connectOrMock());
    break;
}
