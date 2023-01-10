const moment = require("moment/moment");

function getRandomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}
function extractEmailFromString(text) {
  const matches = text.match(
    /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi
  );

  return matches ? matches[0] : "";
}

function validatePublishDateRangeInMonths(publishedTime, monthRange) {
  const timeUnitRegex =
    /(\d+)\s*(year|month|week|day|hour|minute|second)s?\s*ago/;
  const match = publishedTime.match(timeUnitRegex);

  if (match) {
    const timeValue = parseInt(match[1], 10);
    const timeUnit = match[2];
    const publishedTimeMoment = moment.utc().subtract(timeValue, timeUnit);
    return moment().diff(publishedTimeMoment, "months") <= monthRange;
  }
}

function convertSubscriberCountToNumber(str) {
  const numRegex = /(\d+(\.\d+)?)/;
  const match = str.match(numRegex);

  if (match) {
    let num = Number(match[1]);
    if (str.indexOf("K") !== -1) {
      num *= 1000;
    }
    return num;
  }
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

module.exports = {
  getRandomFromArray,
  extractEmailFromString,
  validatePublishDateRangeInMonths,
  convertSubscriberCountToNumber,
  sleep,
  getRandomNumber,
};
