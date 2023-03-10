const fs = require("fs/promises");
const { verifyEmail } = require("./utils");

const limit = 55;
const start_count = 75000;
const end_count = 100000;

(async () => {
  const channel_email_datas = JSON.parse(
    await fs.readFile("data/channels_with_emails.json", "utf-8")
  );
  const already_emailed_channels = JSON.parse(
    await fs.readFile("data/emailed_channels_ids.json", "utf-8")
  );

  const selected_channels = channel_email_datas
    .filter((c) => c.subscribers >= start_count && c.subscribers < end_count)
    .filter((c) => !already_emailed_channels.includes(c.id))
    .slice(0, limit);

  let total_valid = 0;
  if (selected_channels.length > 0) {
    let csv = "email,channel_name,subscriber_count\n";

    for (let idx = 0; idx < selected_channels.length; idx++) {
      const channel = selected_channels[idx];

      const isValidEmail = await verifyEmail(channel.email);
      if (isValidEmail) {
        total_valid++;
        csv += `${channel.email},${channel.name.replace("\\u0026", "&")},${
          channel.subscribers
        }\n`;
        console.log(`Valid emails: ${total_valid}/${selected_channels.length}`);
      }
    }

    await fs.writeFile(
      `data/emails/emails_${start_count}_${end_count}.csv`,
      csv
    );

    // update emailed.json

    const updated_emailed_channels = [
      ...already_emailed_channels,
      ...selected_channels.map((c) => c.id),
    ];
    await fs.writeFile(
      "data/emailed_channels_ids.json",
      JSON.stringify(updated_emailed_channels),
      "utf-8"
    );
  }

  console.log(`Total valid found: ${total_valid}`);
})();
