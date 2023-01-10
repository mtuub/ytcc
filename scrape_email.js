const { readFile } = require("fs/promises");
const fs = require("fs/promises");
const { sleep, getRandomNumber } = require("./utils");
const { getChannelInfo } = require("./yt");

let new_channels_with_emails = [];
let existing_channels_with_emails = [];
let visited_channels_ids = [];
let new_visited_channels_ids = [];

let channelsIds = [];

(async () => {
  // get worker info
  const worker_id = process.argv[2];
  const { workers } = JSON.parse(await readFile("config.json", "utf-8"));

  // get data from artifacts
  const data = JSON.parse(await readFile("artifacts/data.json", "utf-8"));

  // slice channelsIds
  const channel_per_worker = Math.ceil(data.channel_ids.length / workers);
  const startIdx = worker_id * workers;
  const endIdx = startIdx + channel_per_worker;
  channelsIds = data.channel_ids.slice(startIdx, endIdx);

  existing_channels_with_emails = JSON.parse(
    await fs.readFile("data/channels_with_emails.json", "utf8")
  );
  visited_channels_ids = JSON.parse(
    await fs.readFile("data/visited_channels_ids.json", "utf8")
  );

  await getEmailsFromChannelIds();

  // save data
  await fs.mkdir("artifacts/channel_emails", { recursive: true });
  if (new_channels_with_emails.length > 0) {
    await fs.writeFile(
      `artifacts/channel_emails/channels_with_emails_${worker_id}.json`,
      JSON.stringify(new_channels_with_emails),
      "utf8"
    );
  }
})();

async function getEmailsFromChannelIds() {
  let totalEmails = 0;

  const valid_channels_ids = channelsIds.filter(
    (c) => !visited_channels_ids.includes(c)
  );

  console.log(
    `Crawled: ${channelsIds.length} channels, New: ${valid_channels_ids.length} channels`
  );

  for (let idx = 0; idx < valid_channels_ids.length; idx++) {
    const channel_id = valid_channels_ids[idx];
    try {
      const channel_info = await getChannelInfo(channel_id);
      if (channel_info) {
        new_channels_with_emails.push(channel_info);
        totalEmails++;
      }
      new_visited_channels_ids.push(channel_id);
      console.log(
        `Email Iteration ${idx + 1}/${valid_channels_ids.length} completed!`
      );
    } catch (error) {
      console.log(
        `Failed to get email for channel ${channel_id}`,
        error.message
      );
    }
    await sleep(getRandomNumber(100, 500));
  }

  console.log(`Total emails found: ${totalEmails} / ${channelsIds.length}`);
}
