// @ts-check

import DggApiClient from './DggApiClient';

/**
 * @typedef {import('./DggApiClient').UserInfo} UserInfo
 */

/**
 * Fetches per-user info for the user-info menu from the website API, rather
 * than relying only on the locally-cached chat presence data.
 */
export default class UserInfoService {
  /**
   * @param {string} apiBase The website origin (e.g. 'https://www.destiny.gg').
   * @param {DggApiClient} [apiClient]
   */
  constructor(apiBase, apiClient) {
    this.apiClient = apiClient ?? new DggApiClient(apiBase);
  }

  /**
   * @param {string} username
   * @returns {Promise<UserInfo|null>} `null` when the user does not exist.
   * @throws {Error}
   */
  async getUserInfo(username) {
    return this.apiClient.getUserInfo(username);
  }
}
