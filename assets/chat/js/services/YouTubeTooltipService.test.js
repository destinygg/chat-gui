// @ts-check

import YouTubeTooltipService from './YouTubeTooltipService';
import YoutubeOembedClient from './YouTubeOembedClient';

jest.mock('./YouTubeOembedClient');

describe('YouTubeTooltipService', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    jest.clearAllMocks();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should fetch data and populate unfetched tooltips when a successful response is received', async () => {
    const videoId = 'test-video-id';
    const mockResponse = {
      type: 'Success',
      data: {
        title: 'Mock Video Title',
        author_name: 'Mock Channel Name',
      },
    };

    const unfetchedParent = document.createElement('div');
    unfetchedParent.id = `ytt-${videoId}`;
    unfetchedParent.innerHTML = `
      <div class="tooltip-wrapper" data-fetched="false">
        <img class="yt-tooltip-thumbnail" src="" alt="Thumbnail">
        <div class="yt-tooltip-title"></div>
        <div class="yt-tooltip-channel"></div>
      </div>
    `;
    container.appendChild(unfetchedParent);

    const fetchedParent = document.createElement('div');
    fetchedParent.id = `ytt-${videoId}`;
    fetchedParent.innerHTML = `
      <div class="tooltip-wrapper" data-fetched="true">
        <img class="yt-tooltip-thumbnail" src="https://i.ytimg.com/vi/${videoId}/mqdefault.jpg" alt="Thumbnail">
        <div class="yt-tooltip-title">Old Title</div>
        <div class="yt-tooltip-channel">Old Channel</div>
      </div>
    `;
    container.appendChild(fetchedParent);

    YoutubeOembedClient.getData.mockResolvedValue(mockResponse);

    await YouTubeTooltipService.populateTooltips(videoId);

    expect(YoutubeOembedClient.getData).toHaveBeenCalledTimes(1);
    expect(YoutubeOembedClient.getData).toHaveBeenCalledWith(videoId);

    const populatedTooltip = unfetchedParent.querySelector('.tooltip-wrapper');
    const populatedThumbnail = populatedTooltip.querySelector(
      '.yt-tooltip-thumbnail',
    );
    const populatedTitle = populatedTooltip.querySelector('.yt-tooltip-title');
    const populatedChannel = populatedTooltip.querySelector(
      '.yt-tooltip-channel',
    );

    expect(populatedTooltip.dataset.fetched).toBe('true');
    expect(populatedThumbnail.src).toBe(
      `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    );
    expect(populatedTitle.innerHTML).toBe(mockResponse.data.title);
    expect(populatedChannel.innerHTML).toBe(mockResponse.data.author_name);

    const untouchedTooltip = fetchedParent.querySelector('.tooltip-wrapper');
    const untouchedTitle = untouchedTooltip.querySelector('.yt-tooltip-title');
    expect(untouchedTooltip.dataset.fetched).toBe('true');
    expect(untouchedTitle.innerHTML).toBe('Old Title');
  });

  it('should not populate tooltips if the API returns an error response', async () => {
    const videoId = 'test-video-id';
    const mockErrorResponse = { type: 'Error' };

    const unfetchedParent = document.createElement('div');
    unfetchedParent.id = `ytt-${videoId}`;
    unfetchedParent.innerHTML = `
      <div class="tooltip-wrapper" data-fetched="false">
        <img class="yt-tooltip-thumbnail" src="" alt="Thumbnail">
        <div class="yt-tooltip-title"></div>
        <div class="yt-tooltip-channel"></div>
      </div>
    `;
    container.appendChild(unfetchedParent);

    YoutubeOembedClient.getData.mockResolvedValue(mockErrorResponse);

    await YouTubeTooltipService.populateTooltips(videoId);

    const tooltip = unfetchedParent.querySelector('.tooltip-wrapper');
    const title = tooltip.querySelector('.yt-tooltip-title');

    expect(tooltip.dataset.fetched).toBe('false');
    expect(title.innerHTML).toBe('');
  });

  it('should not call the client if all tooltips are already fetched', async () => {
    const videoId = 'test-video-id';
    const fetchedParent = document.createElement('div');
    fetchedParent.id = `ytt-${videoId}`;
    fetchedParent.innerHTML = `
      <div class="tooltip-wrapper" data-fetched="true">
        ...
      </div>
    `;
    container.appendChild(fetchedParent);

    await YouTubeTooltipService.populateTooltips(videoId);

    expect(YoutubeOembedClient.getData).not.toHaveBeenCalled();
  });
});
