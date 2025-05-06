import { Controller } from '@hotwired/stimulus';
import moment from 'moment';

const UPDATE_INTERVAL = 1000;

export default class extends Controller {
  static values = {
    timestamp: Number,
  };

  /** @type moment.Moment */
  momentTimestamp;

  updateInterval;

  connect() {
    this.momentTimestamp = moment.unix(this.timestampValue);

    setInterval(() => {
      this.updateRelativeText();
    }, UPDATE_INTERVAL);
  }

  disconnect() {
    clearInterval(this.updateInterval);
  }

  updateRelativeText() {
    const now = moment();

    this.element.textContent = moment
      .duration(-now.diff(this.momentTimestamp))
      .humanize(true);
  }
}
