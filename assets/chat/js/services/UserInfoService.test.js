// @ts-check

import UserInfoService from './UserInfoService';
import DggApiClient from './DggApiClient';

class MockDggApiClient {
  constructor() {
    this.getUserInfoCalls = [];
    this.mockUserInfo = null;
    this.mockError = null;
  }

  async getUserInfo(username) {
    this.getUserInfoCalls.push({ username });

    if (this.mockError) {
      throw this.mockError;
    }

    return this.mockUserInfo;
  }
}

describe('UserInfoService', () => {
  let mockApiClient;
  let service;

  beforeEach(() => {
    mockApiClient = new MockDggApiClient();
    service = new UserInfoService('https://www.destiny.gg', mockApiClient);
  });

  describe('constructor', () => {
    it('should build a default DggApiClient when none is provided', () => {
      const defaultService = new UserInfoService('https://www.destiny.gg');
      expect(defaultService.apiClient).toBeInstanceOf(DggApiClient);
      expect(defaultService.apiClient.apiBase).toBe('https://www.destiny.gg');
    });

    it('should use the provided apiClient', () => {
      expect(service.apiClient).toBe(mockApiClient);
    });
  });

  describe('getUserInfo', () => {
    it('should delegate to the client and return its result', async () => {
      const userInfo = {
        id: 123,
        nick: 'Destiny',
        roles: [],
        features: ['flair1'],
        createdDate: '2013-01-01T00:00:00+00:00',
        watching: null,
      };
      mockApiClient.mockUserInfo = userInfo;

      const result = await service.getUserInfo('Destiny');

      expect(mockApiClient.getUserInfoCalls).toEqual([{ username: 'Destiny' }]);
      expect(result).toBe(userInfo);
    });

    it('should propagate errors from the client', async () => {
      mockApiClient.mockError = new Error('API error');

      await expect(service.getUserInfo('Destiny')).rejects.toThrow('API error');
    });

    it('should pass through a null result when the user does not exist', async () => {
      mockApiClient.mockUserInfo = null;

      await expect(service.getUserInfo('nobody')).resolves.toBeNull();
    });
  });
});
