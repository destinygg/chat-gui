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
   * @param {'Destinygg'} channel
   * @param {Date} [startDate]
   * @param {Date} [endDate]
   * @returns {Promise<Array<RustleSearchMessage>>}
   * @throws {Error}
   */
  async getLogs(username, channel, startDate, endDate) {
    const apiUrl = new URL('/anon/search', BASE_URI);
    apiUrl.searchParams.set('username', username);
    apiUrl.searchParams.set('channel', channel);

    if (startDate) {
      const startDateStr = startDate.toISOString().split('T')[0];
      apiUrl.searchParams.set('start_date', startDateStr);
    }
    if (endDate) {
      const endDateStr = endDate.toISOString().split('T')[0];
      apiUrl.searchParams.set('end_date', endDateStr);
    }

    const response = await fetch(apiUrl.toString());

    let data;
    try {
      /** @type {RustleSearchResponse} */
      data = await response.json();
    } catch (error) {
      throw new Error('Invalid JSON', { cause: error });
    }

    if (data.type !== 'Success') {
      throw new Error(data.error);
    }

    return data.data.messages;
  }
}
