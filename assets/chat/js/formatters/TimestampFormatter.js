import moment from 'moment';

const TIMESTAMP_FORMATS = {
  t12: 'h:mm A',
  t24: 'HH:mm',

  T12: 'h:mm:ss A',
  T24: 'HH:mm:ss',

  d12: 'MM/DD/YYYY',
  d24: 'DD/MM/YYYY',

  D12: 'MMMM DD, YYYY',
  D24: 'DD MMMM YYYY',

  f12: 'MMMM DD, YYYY [at] h:mm A',
  f24: 'DD MMMM YYYY [at] HH:mm',

  F12: 'dddd, MMMM DD, YYYY [at] h:mm A Z',
  F24: 'dddd, DD MMMM YYYY [at] HH:mm Z',
};

const getBrowserLocale24h = () =>
  Intl.DateTimeFormat([], { hour: 'numeric' }).resolvedOptions().hour12
    ? '12'
    : '24';

export default class TimestampFormatter {
  constructor() {
    this.timestampRegex =
      /&lt;t:(?<timestamp>\d+)(?::(?<type>[tTdDfFR]))?&gt;/g;
  }

  format(chat, str) {
    return str.replace(this.timestampRegex, (_, timestamp, type) => {
      const momentTimestamp = moment.unix(timestamp);
      const full = momentTimestamp.format(
        TIMESTAMP_FORMATS[`F${getBrowserLocale24h()}`],
      );

      if (type === 'R') {
        const now = moment();

        const relative = moment
          .duration(-now.diff(momentTimestamp))
          .humanize(true);

        return `<span class="timestamp" data-controller="relative-timestamp tooltip" data-relative-timestamp-timestamp-value="${timestamp}" data-tooltip-content-value="${full}">${relative}</span>`;
      }

      const regular = momentTimestamp.format(
        TIMESTAMP_FORMATS[`${type ?? 'f'}${getBrowserLocale24h()}`],
      );
      return `<span class="timestamp" data-controller="tooltip" data-tooltip-content-value="${full}">${regular}</span>`;
    });
  }
}
