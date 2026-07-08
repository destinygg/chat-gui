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
   * Fetches the public user info shown in the user-info menu. Resolves to
   * `null` when the user does not exist (HTTP 404), so callers can show a
   * "not found" state; transient failures still reject.
   *
   * @param {string} username
   * @returns {Promise<UserInfo|null>}
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
      // A 404 means the user doesn't exist; distinguish it from transient
      // failures (which reject) so the menu can show a "not found" state.
      if (response.status === 404) {
        return null;
      }
      throw new Error(body.message ?? 'Failed to fetch user info');
    }

    return body.data;
  }
}
