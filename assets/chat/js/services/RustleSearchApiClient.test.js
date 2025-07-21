// @ts-check

import fetchMock from 'jest-fetch-mock';
import RustleSearchApiClient from './RustleSearchApiClient';

describe('RustleSearchApiClient', () => {
  let apiClient;

  beforeEach(() => {
    apiClient = new RustleSearchApiClient();
    fetchMock.resetMocks();
  });

  describe('getLogs', () => {
    it('should fetch and return messages successfully with all parameters', async () => {
      const mockApiResponse = {
        type: 'Success',
        error: null,
        data: {
          messages: [
            {
              username: 'testuser',
              text: 'Hello world',
              ts: '2024-01-15T10:30:00Z',
            },
            {
              username: 'testuser',
              text: 'Another message',
              ts: '2024-01-15T11:00:00Z',
            },
          ],
        },
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockApiResponse));

      const result = await apiClient.getLogs(
        'testuser',
        'TestChannel',
        '2020-01-01',
        '2024-01-15',
      );

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api-v2.rustlesearch.dev/anon/search?username=testuser&channel=TestChannel&start_date=2020-01-01&end_date=2024-01-15',
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        username: 'testuser',
        text: 'Hello world',
        ts: '2024-01-15T10:30:00Z',
      });
      expect(result[1]).toEqual({
        username: 'testuser',
        text: 'Another message',
        ts: '2024-01-15T11:00:00Z',
      });
    });

    it('should fetch and return messages successfully without date parameters', async () => {
      const mockApiResponse = {
        type: 'Success',
        error: null,
        data: {
          messages: [
            {
              username: 'testuser',
              text: 'Hello world',
              ts: '2024-01-15T10:30:00Z',
            },
          ],
        },
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockApiResponse));

      const result = await apiClient.getLogs(
        'testuser',
        'TestChannel',
        undefined,
        undefined,
      );

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api-v2.rustlesearch.dev/anon/search?username=testuser&channel=TestChannel',
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        username: 'testuser',
        text: 'Hello world',
        ts: '2024-01-15T10:30:00Z',
      });
    });

    it('should throw error when API returns BadSchema error response', async () => {
      const mockApiResponse = {
        type: 'BadSchema',
        error: 'Invalid channel',
        data: null,
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockApiResponse));

      await expect(
        apiClient.getLogs(
          'testuser',
          'InvalidChannel',
          '2020-01-01',
          '2024-01-15',
        ),
      ).rejects.toThrow('Invalid channel');
    });

    it('should throw error when API returns invalid JSON', async () => {
      fetchMock.mockResponseOnce('invalid json response');

      await expect(
        apiClient.getLogs(
          'testuser',
          'TestChannel',
          '2020-01-01',
          '2024-01-15',
        ),
      ).rejects.toThrow('Invalid JSON');
    });
  });
});
