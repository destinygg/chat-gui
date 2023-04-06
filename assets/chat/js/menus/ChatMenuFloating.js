import ChatMenu from './ChatMenu';

export default class ChatMenuFloating extends ChatMenu {
  constructor(ui, btn, chat, draggable = false) {
    super(ui, btn, chat);
    this.ui = ui;
    this.btn = btn;
    this.chat = chat;

    this.mousedown = false;
    this.x1 = 0;
    this.x2 = 0;
    this.y1 = 0;
    this.y2 = 0;

    if (draggable) {
      this.draggable = this.ui.find(draggable);
      this.draggable[0].style.cursor = 'grab';
      this.draggable.on('mouseup', (e) => {
        e.preventDefault();
        this.mousedown = false;
      });
      this.draggable.on('mousedown', (e) => {
        e.preventDefault();
        this.mousedown = true;
        this.x1 = e.clientX;
        this.y1 = e.clientY;
      });
      this.chat.output.on('mousemove', (e) => {
        this.drag(e);
      });
      this.ui.on('mousemove', (e) => {
        this.drag(e);
      });
    }
  }

  drag(e) {
    if (this.mousedown) {
      this.x2 = this.x1 - e.clientX;
      this.y2 = this.y1 - e.clientY;
      this.x1 = e.clientX;
      this.y1 = e.clientY;

      this.draggable[0].style.cursor = 'grabbing';
      this.ui[0].style.left = `${this.ui[0].offsetLeft - this.x2}px`;
      this.ui[0].style.top = `${this.ui[0].offsetTop - this.y2}px`;
    } else {
      this.draggable[0].style.cursor = 'grab';
    }
  }

  position(e) {
    this.mousedown = false;
    const rect = this.chat.output[0].getBoundingClientRect();
    // calculating floating window location (if it doesn't fit on screen, adjusting it a bit so it does)
    const x =
      this.ui.width() + e.clientX > rect.width
        ? e.clientX - rect.left + (rect.width - (this.ui.width() + e.clientX))
        : e.clientX - rect.left;
    const y =
      this.ui.height() + e.clientY > rect.height
        ? e.clientY -
          rect.top +
          (rect.height - (this.ui.height() + e.clientY)) -
          12
        : e.clientY - rect.top - 12;

    this.ui[0].style.left = `${x}px`;
    this.ui[0].style.top = `${y}px`;
  }
}
