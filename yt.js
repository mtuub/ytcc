const axios = require("axios");
const {
  convertSubscriberCountToNumber,
  validatePublishDateRangeInMonths,
  extractEmailFromString,
} = require("./utils");

const context = {
  client: {
    clientName: "WEB",
    clientVersion: "2.20230104.00.00",
  },
};

async function getSearchedVideosIds(query) {
  const response = await axios.post(
    "https://www.youtube.com/youtubei/v1/search",
    {
      context,
      query,
    }
  );
  const video_datas =
    response.data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents.filter(
      (x) => x.videoRenderer
    );

  const video_ids = video_datas.map(
    (video_data) => video_data.videoRenderer.videoId
  );
  return video_ids;
}

async function getSuggestedVideosAndChannels(videoId) {
  const response = await axios.post(
    "https://www.youtube.com/youtubei/v1/next",
    {
      context,
      videoId,
      captionsRequested: false,
    }
  );

  const video_datas =
    response.data.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results
      .map((result) => result.compactVideoRenderer)
      .filter((x) => x);

  const data = video_datas.map((video_data) => {
    return {
      video_id: video_data.videoId,
      channel_id:
        video_data.shortBylineText.runs[0].navigationEndpoint.browseEndpoint
          .browseId,
    };
  });
  return data;
}

async function getChannelInfo(channelID) {
  const response = await axios.get(
    `https://www.youtube.com/channel/${channelID}`
  );
  const html = response.data;

  // Get subscriber count
  const subscriberCountRegex =
    /"subscriberCountText":\s*{[^}]*"label":\s*"([^"]+)"/;

  const subscriberCountMatch = html.match(subscriberCountRegex);

  // check if subscriber count > 5000 < 1 million
  const subscriberCount = convertSubscriberCountToNumber(
    subscriberCountMatch[1]
  );

  if (subscriberCount > 5000 && subscriberCount < 1000000) {
    // check if last video was published within 6 months

    const publishedTimeRegex =
      /"publishedTimeText":\s*{\s*"simpleText":\s*"(.+?)"\s*}/;
    const publishedTimeStr = html.match(publishedTimeRegex);
    const monthRange = 6;
    const isValidPublishDate = validatePublishDateRangeInMonths(
      publishedTimeStr[1],
      monthRange
    );
    if (isValidPublishDate) {
      // Extract email from channel description
      const response_2 = await axios.get(
        `https://www.youtube.com/channel/${channelID}/about`
      );
      const html_2 = response_2.data;
      // Get channel description
      const descriptionRegex = /"description":\s*"(.+?)"/;
      const descriptionMatch = html_2.match(descriptionRegex);
      // Get email from description
      let email = extractEmailFromString(descriptionMatch[1]);
      if (!email) {
        // Get email from last uploaded video
        const videoIdRegex = /"videoId":\s*"(.+?)"/;
        const videoIDmatch = html.match(videoIdRegex);
        const videoId = videoIDmatch[1];
        // Get video description
        const response_3 = await axios.get(
          `https://www.youtube.com/watch?v=${videoId}`
        );
        const html_3 = response_3.data;
        const videoDescriptionRegexp =
          /"description":\s*{\s*"simpleText":\s*"(.+?)"\s*}/;
        const videoDescriptionMatch = html_3.match(videoDescriptionRegexp);
        // Get email from video description
        email = extractEmailFromString(videoDescriptionMatch[1]);
        if (!email) {
          return;
        }
      }
      // Get channel name
      const channelNameRegexp =
        /"channelMetadataRenderer":\s*{[^}]*"title":\s*"([^"]+)"/;
      const channelNameMatch = html_2.match(channelNameRegexp);
      const channelData = {
        id: channelID,
        name: channelNameMatch[1],
        email,
        subscribers: subscriberCount,
      };
      return channelData;
    }
  }
}

module.exports = {
  getSearchedVideosIds,
  getSuggestedVideosAndChannels,
  getChannelInfo,
};
