const fs = require("fs/promises");

(async () => {
  const emailed_channel_ids = JSON.parse(
    await fs.readFile("data/emailed_channels_ids.json", "utf-8")
  );
  const channel_email_datas = JSON.parse(
    await fs.readFile("data/channels_with_emails.json", "utf-8")
  );
  const crawled_channels = JSON.parse(
    await fs.readFile("data/visited_channels_ids.json", "utf-8")
  );

  console.log(
    `Total channels with emails: ${
      channel_email_datas.length
    }, Unique channels with emails: ${
      new Set(channel_email_datas.map((channel) => channel.id)).size
    }`
  );
  console.log(
    `Total channels crawled: ${
      crawled_channels.length
    }, Unique channels crawled: ${new Set(crawled_channels).size}`
  );

  // update readme.md
  let readme_data = `# YT Crawler
- Emails: ${channel_email_datas.length}
- Crawled: ${crawled_channels.length}
`;

  const ranges = [
    5000, 15000, 25000, 35000, 50000, 75000, 100000, 300000, 500000, 1000000,
  ];
  const stats = {};

  for (let idx = 0; idx < ranges.length; idx++) {
    const result = channel_email_datas.filter(
      (channel) =>
        channel.subscribers >= ranges[idx] &&
        channel.subscribers < ranges[idx + 1]
    );
    // update stats
    stats[ranges[idx]] = { channels: result, count: result.length };
  }

  let table =
    "| Subscriber Range  | Already Emailed | Not Emailed |\n|-------|-------|-------|\n";
  const keys = Object.keys(stats);

  for (let i = 0; i < keys.length - 1; i++) {
    const already_emailed = stats[keys[i]].channels.filter((channel) =>
      emailed_channel_ids.includes(channel.id)
    );

    table += `| ${keys[i]} - ${keys[i + 1]} | ${already_emailed.length} | ${
      stats[keys[i]].count - already_emailed.length
    } |\n`;
  }

  readme_data += "\n# Stats\n" + table;
  await fs.writeFile("README.md", readme_data, "utf8");
})();
