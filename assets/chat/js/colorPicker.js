import { COLORS } from './formatters/BBCodeFormatter';
import { insertTag } from './formatToolbar';

const STYLE_ID = 'color-picker-styles';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#chat-color-picker-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cp-window {
  background: #c0c0c0;
  padding: 3px;
  box-shadow: inset -1px -1px 0 #0c0c0c, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808088, inset 2px 2px 0 #c0c0c0;
  min-width: 220px;
}
.cp-toolbar {
  background: linear-gradient(90deg, #0000a2, #126fc2);
  color: #ffffff;
  font-family: 'MSSansSerif', sans-serif;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 3px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  user-select: none;
}
.cp-toolbar-title {
  flex: 1;
}
.cp-close-btn {
  width: 16px;
  height: 14px;
  background-color: #bbc3c4;
  border: none;
  box-shadow: inset -1px -1px 0 #0c0c0c, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808088, inset 2px 2px 0 #bbc3c4;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  outline: 0;
  image-rendering: pixelated;
  background-image: url('data:image/gif;base64,R0lGODlhDQALAJEAAAAAAP///////wAAACH5BAEAAAIALAAAAAANAAsAAAIUlI+pKwDoVGxvucmwvblqo33MqBQAOw==');
  background-repeat: no-repeat;
  background-position: 1px 1px;
}
.cp-close-btn:active {
  box-shadow: inset 1px 1px 0 #0c0c0c, inset -1px -1px 0 #ffffff, inset 2px 2px 0 #808088, inset -2px -2px 0 #bbc3c4;
  background-position: 2px 2px;
}
.cp-body {
  padding: 8px;
}
.cp-group {
  border: 1px solid #ffffff;
  outline: 1px solid #808088;
  position: relative;
  padding: 12px 8px 8px 8px;
  margin-top: 8px;
}
.cp-group-title {
  position: absolute;
  top: -7px;
  left: 8px;
  background: #c0c0c0;
  padding: 0 4px;
  font-family: 'MSSansSerif', sans-serif;
  font-size: 11px;
  color: #0c0c0c;
}
.cp-grid {
  display: grid;
  grid-template-columns: repeat(8, 19px);
  grid-template-rows: repeat(6, 19px);
  gap: 2px;
}
.cp-swatch {
  width: 19px;
  height: 19px;
  border: none;
  cursor: pointer;
  padding: 0;
  box-sizing: border-box;
  outline: none;
}
.cp-swatch.selected {
  outline: 1px dotted #000000;
  outline-offset: 1px;
}
.cp-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 10px;
}
.cp-btn {
  min-width: 60px;
  height: 23px;
  background: #c0c0c0;
  border: none;
  box-shadow: inset -1px -1px 0 #0c0c0c, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808088, inset 2px 2px 0 #c0c0c0;
  cursor: pointer;
  font-family: 'MSSansSerif', sans-serif;
  font-size: 11px;
  color: #0c0c0c;
  padding: 0 8px;
}
.cp-btn:active {
  box-shadow: inset 1px 1px 0 #0c0c0c, inset -1px -1px 0 #ffffff, inset 2px 2px 0 #808088, inset -2px -2px 0 #c0c0c0;
}
`;
  document.head.appendChild(style);
}

let selectedIndex = 0;
let currentMode = 'color';
let currentTextarea = null;

function buildPicker(overlay) {
  overlay.innerHTML = '';

  const win = document.createElement('div');
  win.className = 'cp-window';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'cp-toolbar';
  const title = document.createElement('span');
  title.className = 'cp-toolbar-title';
  title.textContent = 'Color';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'cp-close-btn';
  closeBtn.textContent = '';
  closeBtn.addEventListener('click', () => hide());
  toolbar.appendChild(title);
  toolbar.appendChild(closeBtn);
  win.appendChild(toolbar);

  // Body
  const body = document.createElement('div');
  body.className = 'cp-body';

  // Group box
  const group = document.createElement('div');
  group.className = 'cp-group';
  const groupTitle = document.createElement('span');
  groupTitle.className = 'cp-group-title';
  groupTitle.textContent = 'Basic Colors';
  group.appendChild(groupTitle);

  // Grid
  const grid = document.createElement('div');
  grid.className = 'cp-grid';

  COLORS.forEach((color, i) => {
    const swatch = document.createElement('button');
    swatch.className = 'cp-swatch';
    if (i === selectedIndex) {
      swatch.classList.add('selected');
    }
    swatch.style.backgroundColor = color;
    swatch.title = color;
    swatch.addEventListener('click', () => {
      grid
        .querySelectorAll('.cp-swatch')
        .forEach((s) => s.classList.remove('selected'));
      swatch.classList.add('selected');
      selectedIndex = i;
    });
    grid.appendChild(swatch);
  });

  group.appendChild(grid);
  body.appendChild(group);

  // Buttons
  const buttons = document.createElement('div');
  buttons.className = 'cp-buttons';

  const okBtn = document.createElement('button');
  okBtn.className = 'cp-btn';
  okBtn.textContent = 'OK';
  okBtn.addEventListener('click', () => {
    const num = selectedIndex + 1;
    if (currentMode === 'color') {
      insertTag(currentTextarea, `[c${num}]`, `[/c${num}]`);
    } else {
      insertTag(currentTextarea, `[bg${num}]`, `[/bg${num}]`);
    }
    hide();
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'cp-btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => hide());

  buttons.appendChild(okBtn);
  buttons.appendChild(cancelBtn);
  body.appendChild(buttons);

  win.appendChild(body);
  overlay.appendChild(win);
}

function hide() {
  const overlay = document.getElementById('chat-color-picker-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

export function show(mode, textarea) {
  injectStyles();
  currentMode = mode;
  currentTextarea = textarea;
  selectedIndex = 0;
  const overlay = document.getElementById('chat-color-picker-overlay');
  if (!overlay) {
    return;
  }
  buildPicker(overlay);
  overlay.style.display = 'flex';
}
