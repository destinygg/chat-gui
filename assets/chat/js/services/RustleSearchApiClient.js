// @ts-check

/**
 * @typedef {Object} RustleSearchMessage
 * @property {string} username
 * @property {string} text
 * @property {string} ts - ISO timestamp string
 */

/**
 * @typedef {Object} RustleSearchSuccessResponse
 * @property {'Success'} type
 * @property {Object} data
 * @property {Array<RustleSearchMessage>} data.messages
 */

/**
 * @typedef {Object} RustleSearchErrorResponse
 * @property {'BadSchema'} type
 * @property {string} error
 */

/**
 * @typedef {RustleSearchSuccessResponse|RustleSearchErrorResponse} RustleSearchResponse
 */

const BASE_URI = 'https://api-v2.rustlesearch.dev';

export default class RustleSearchApiClient {
  /**
   * @param {string} username
   * @param {string} channel
   * @param {string} [startDate]
   * @param {string} [endDate]
   * @returns {Promise<Array<RustleSearchMessage>>}
   * @throws {Error}
   */
  async getLogs(username, channel, startDate, endDate) {
    const apiUrl = new URL('/anon/search', BASE_URI);
    apiUrl.searchParams.set('username', username);
    apiUrl.searchParams.set('channel', channel);

    if (startDate) {
      apiUrl.searchParams.set('start_date', startDate);
    }
    if (endDate) {
      apiUrl.searchParams.set('end_date', endDate);
    }

    const response = await fetch(apiUrl.toString());

    let data;
    try {
      /** @type {RustleSearchResponse} */
      data = await response.json();
    } catch (error) {
      throw new Error('Invalid JSON');
    }

    if (data.type !== 'Success') {
      throw new Error(data.error);
    }

    return data.data.messages;
  }
}
