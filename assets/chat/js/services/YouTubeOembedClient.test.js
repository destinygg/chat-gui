// @ts-check

import fetchMock from 'jest-fetch-mock';
import YouTubeOembedClient from './YouTubeOembedClient';

describe('YouTubeOembedClient', () => {
  let getData;

  beforeEach(() => {
    // eslint-disable-next-line prefer-destructuring
    getData = YouTubeOembedClient.getData;
  });

  describe('getData', () => {
    it('should fetch and return successfully with a valid id', async () => {
      const mockResponse = {
        title: "I'm Just a Memer (feat. Sordiway)",
        author_name: 'Koaster',
        author_url: 'https://www.youtube.com/@koaster6349',
        type: 'video',
        height: 113,
        width: 200,
        version: '1.0',
        provider_name: 'YouTube',
        provider_url: 'https://www.youtube.com/',
        thumbnail_height: 360,
        thumbnail_width: 480,
        thumbnail_url: 'https://i.ytimg.com/vi/P1C38MABaSM/hqdefault.jpg',
        html: '\u003Ciframe width="200" height="113" src="https://www.youtube.com/embed/P1C38MABaSM?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen title="I&#39;m Just a Memer (feat. Sordiway)"\u003E\u003C/iframe\u003E',
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));
      const result = await getData('P1C38MABaSM');

      expect(fetchMock).toHaveBeenCalledWith(
        `https://youtube.com/oembed?url=${encodeURIComponent('https://youtu.be/P1C38MABaSM')}`,
      );

      expect(result.data).toEqual(mockResponse);
    });

    it('should respond with an error object when given an invalid id', async () => {
      fetchMock.mockResponseOnce('Bad Request');
      const result = await getData('P1C38MABaS');
      expect(fetchMock).toHaveBeenCalledWith(
        `https://youtube.com/oembed?url=${encodeURIComponent('https://youtu.be/P1C38MABaS')}`,
      );
      expect(result).toEqual({
        type: 'Error',
      });
    });
  });
});
