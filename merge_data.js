const fs = require("fs/promises");

(async () => {
  let files;
  try {
    files = await fs.readdir("artifacts/channel_emails");
  } catch (error) {
    throw new Error("No emails found");
  }
  const shared_data = JSON.parse(
    await fs.readFile("artifacts/data.json", "utf-8")
  );
  const config = JSON.parse(await fs.readFile("config.json", "utf-8"));

  const merged_data = [];

  for (let idx = 0; idx < files.length; idx++) {
    const file = files[idx];
    const data = JSON.parse(
      await fs.readFile(`artifacts/channel_emails/${file}`, "utf8")
    );
    merged_data.push(...data);
  }

  const existing_channels_with_emails = JSON.parse(
    await fs.readFile("data/channels_with_emails.json", "utf8")
  );

  // update visited_channels_ids.json
  const existing_visited_channels_ids = JSON.parse(
    await fs.readFile("data/visited_channels_ids.json", "utf8")
  );

  await fs.writeFile(
    "data/visited_channels_ids.json",
    JSON.stringify([
      ...shared_data.channel_ids,
      ...existing_visited_channels_ids,
    ]),
    "utf8"
  );

  // update channels_with_emails.json
  let unique_new_channels = [];
  if (merged_data.length > 0) {
    // remove duplicates

    unique_new_channels = merged_data.filter(
      (item, index) => merged_data.findIndex((i) => i.id === item.id) === index
    );

    await fs.writeFile(
      "data/channels_with_emails.json",
      JSON.stringify([
        ...unique_new_channels,
        ...existing_channels_with_emails,
      ]),
      "utf8"
    );
  }

  // update log
  const log_data = {
    crawled: shared_data.channel_ids.length,
    new_emails: unique_new_channels.length,
    startWord: shared_data.startWord,
    maxCrawlIterations: config.maxCrawlIterations,
    date: new Date().toISOString(),
  };
  const existing_log_data = JSON.parse(
    await fs.readFile("data/log.json", "utf8")
  );

  await fs.writeFile(
    "data/log.json",
    JSON.stringify([log_data, ...existing_log_data]),
    "utf8"
  );

  // update readme.md
  const readme_data = `# Youtube Email Crawler
    - Total Channels with emails: ${
      [...unique_new_channels, ...existing_channels_with_emails].length
    }
    - Total Channels Scraped: ${
      [...shared_data.channel_ids, ...existing_visited_channels_ids].length
    }
   `;

  await fs.writeFile("README.md", readme_data, "utf8");
})();
