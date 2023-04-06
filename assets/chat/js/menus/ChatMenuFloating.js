import ChatMenu from './ChatMenu';

export default class ChatMenuFloating extends ChatMenu {
    constructor(ui, btn, chat, draggable = null) {
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
            this.draggable.on('mousedown', (e) => {
                e.preventDefault();
                this.mousedown = true;
                this.x1 = e.clientX;
                this.y1 = e.clientY;
            });
            // Moved the mouseup event listener to be registered directly on this.draggable.
            this.draggable.on('mouseup', (e) => {
                e.preventDefault();
                this.mousedown = false;
                this.draggable[0].style.cursor = 'grab';
            });
            // Removed the unnecessary mousemove event listener registration on this.chat.output.
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
        }
    }
}