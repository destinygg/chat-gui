import UserMessageService from './UserMessageService';
import RustleSearchApiClient from './RustleSearchApiClient';

class MockRustleSearchApiClient {
  constructor() {
    this.getLogsCalls = [];
    this.mockMessages = [];
    this.mockError = null;
  }

  async getLogs(username, channel, startDate, endDate) {
    this.getLogsCalls.push({ username, channel, startDate, endDate });

    if (this.mockError) {
      throw this.mockError;
    }

    return this.mockMessages;
  }
}

describe('UserMessageService', () => {
  let mockApiClient;
  let service;

  beforeEach(() => {
    mockApiClient = new MockRustleSearchApiClient();
    service = new UserMessageService(mockApiClient);
  });

  describe('constructor', () => {
    it('should use default implementation when no apiClient provided', () => {
      const defaultService = new UserMessageService();
      expect(defaultService.apiClient).toBeInstanceOf(RustleSearchApiClient);
    });

    it('should use provided apiClient', () => {
      expect(service.apiClient).toBe(mockApiClient);
    });
  });

  describe('transformMessages', () => {
    it('should transform RustleSearch messages to UserMessage format', () => {
      const rustleMessages = [
        {
          username: 'user1',
          text: 'Hello world',
          ts: '2024-01-15T10:30:00Z',
        },
        {
          username: 'user2',
          text: 'Test message',
          ts: '2024-01-15T11:00:00Z',
        },
      ];

      const result = service.transformMessages(rustleMessages);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        username: 'user1',
        messageText: 'Hello world',
        timestamp: new Date('2024-01-15T10:30:00Z').getTime(),
      });
      expect(result[1]).toEqual({
        username: 'user2',
        messageText: 'Test message',
        timestamp: new Date('2024-01-15T11:00:00Z').getTime(),
      });
    });

    it('should handle empty messages array', () => {
      const result = service.transformMessages([]);
      expect(result).toEqual([]);
    });
  });

  describe('getUserMessages', () => {
    it('should fetch and return user messages successfully', async () => {
      const mockMessages = [
        {
          username: 'testuser',
          text: 'Hello world',
          ts: '2024-01-15T10:30:00Z',
        },
      ];

      mockApiClient.mockMessages = mockMessages;

      const result = await service.getUserMessages('testuser', 5);

      expect(mockApiClient.getLogsCalls).toHaveLength(1);
      expect(mockApiClient.getLogsCalls[0]).toEqual({
        username: 'testuser',
        channel: 'Destinygg',
        startDate: undefined,
        endDate: undefined,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        username: 'testuser',
        messageText: 'Hello world',
        timestamp: new Date('2024-01-15T10:30:00Z').getTime(),
      });
    });

    it('should limit results to specified message count', async () => {
      const mockMessages = [
        { username: 'user1', text: 'msg1', ts: '2024-01-15T10:00:00Z' },
        { username: 'user1', text: 'msg2', ts: '2024-01-15T10:01:00Z' },
        { username: 'user1', text: 'msg3', ts: '2024-01-15T10:02:00Z' },
      ];

      mockApiClient.mockMessages = mockMessages;

      const result = await service.getUserMessages('user1', 2);

      expect(result).toHaveLength(2);
      expect(result[0].messageText).toBe('msg1');
      expect(result[1].messageText).toBe('msg2');
    });

    it('should return empty array when API client throws', async () => {
      mockApiClient.mockError = new Error('API error');

      const result = await service.getUserMessages('testuser');
      expect(result).toEqual([]);
    });
  });
});
