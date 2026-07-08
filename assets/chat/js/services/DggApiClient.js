// @ts-check

/**
 * @typedef {Object} WatchingEmbed
 * @property {string} platform
 * @property {string} id
 */

/**
 * @typedef {Object} UserInfo
 * @property {?number} id
 * @property {string} nick
 * @property {string[]} roles
 * @property {string[]} features
 * @property {?string} createdDate
 * @property {?WatchingEmbed} watching
 */

/**
 * @typedef {Object} JsonResponseEnvelope
 * @property {boolean} success
 * @property {?string} message
 * @property {*} data
 */

/**
 * Client for the destiny.gg website's first-party JSON API.
 */
export default class DggApiClient {
  /**
   * @param {string} apiBase The website origin (e.g. 'https://www.destiny.gg').
   */
  constructor(apiBase) {
    this.apiBase = apiBase;
  }

  /**
   * Fetches the public user info shown in the user-info menu.
   *
   * @param {string} username
   * @returns {Promise<UserInfo>}
   * @throws {Error}
   */
  async getUserInfo(username) {
    const apiUrl = new URL('/api/chat/userinfo', this.apiBase);
    apiUrl.searchParams.set('username', username);

    const response = await fetch(apiUrl.toString());

    let body;
    try {
      /** @type {JsonResponseEnvelope} */
      body = await response.json();
    } catch (error) {
      throw new Error('Invalid JSON', { cause: error });
    }

    if (!body.success) {
      throw new Error(body.message ?? 'Failed to fetch user info');
    }

    return body.data;
  }
}
