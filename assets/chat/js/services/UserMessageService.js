/**
 * @typedef {Object} UserMessage
 * @property {string} username
 * @property {string} messageText
 * @property {number} timestamp
 */
export default class UserMessageService {
  /**
   * @param {string} username
   * @param {number} messageCount
   * @returns {Promise<Array<UserMessage>>}
   */
  // eslint-disable-next-line no-unused-vars
  async getUserMessages(username, messageCount = 50) {
    throw new Error('getUserMessages is not implemented');
  }
}
