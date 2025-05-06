import { Controller } from '@hotwired/stimulus';
import tippy, { roundArrow } from 'tippy.js';

tippy.setDefaultProps({ delay: [500, 0] });

export default class extends Controller {
  static values = {
    content: String,
  };

  connect() {
    tippy(this.element, {
      arrow: roundArrow,
      duration: 0,
      maxWidth: 250,
      hideOnClick: false,
      theme: 'dgg',
      content: this.contentValue,
    });
  }
}
