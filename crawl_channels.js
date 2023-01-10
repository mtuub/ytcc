const { readFile } = require("fs/promises");
const randomWord = require("random-word");
const { getRandomFromArray } = require("./utils");
const { getSearchedVideosIds, getSuggestedVideosAndChannels } = require("./yt");
const fs = require("fs/promises");

(async () => {
  const config = JSON.parse(await readFile("config.json", "utf-8"));
  const startWord = randomWord();
  const channelIds = await crawlChannelIds(
    config.maxCrawlIterations,
    startWord
  );

  const artifact_data = {
    channel_ids: channelIds,
    startWord,
  };

  await fs.writeFile(
    "artifacts/data.json",
    JSON.stringify(artifact_data),
    "utf8"
  );

  console.log(`Crawl completed! ${channelIds.length} channel ids found!`);
})();

async function crawlChannelIds(maxIterations, startWord) {
  const channelIds = [];
  // Get random videoId for starting the crawler
  const searchedVideoIds = await getSearchedVideosIds(startWord);
  let videoIdForCrawling = getRandomFromArray(searchedVideoIds);

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    try {
      // Get suggested videos and channels
      const videoDatas = await getSuggestedVideosAndChannels(
        videoIdForCrawling
      );
      const unvisitedChannelsVideoDatas = videoDatas.filter(
        (d) => !channelIds.includes(d.channel_id)
      );
      const channel_ids = unvisitedChannelsVideoDatas.map((d) => d.channel_id);
      // Remove duplicates
      const unique_channel_ids = Array.from(new Set(channel_ids));
      channelIds.push(...unique_channel_ids);

      // Get random videoId for next iteration
      videoIdForCrawling = getRandomFromArray(
        unvisitedChannelsVideoDatas
      ).video_id;
      console.log(
        `Crawl Iteration ${iteration + 1}/${maxIterations} completed!`
      );
    } catch (error) {
      console.log(`Crawl Iteration ${iteration} failed!`, error.message);
    }
  }

  return channelIds;
}
