const { unix } = require("dayjs");
const rp = require("request-promise-native");
const env = require("../../config/config");
env();

const apiKey = process.env.OPENWEATHER_API_KEY;

exports.getHistory = async (time, location, callback) => {
  const unixTime = {
    today: callback(time, 0),
    yesterday: callback(time, 1),
    twoDayAgo: callback(time, 2),
  };

  let [befores, yesterdays] = await Promise.all([
    rqHistory(location, unixTime.today),
    rqHistory(location, unixTime.yesterday),
  ]);
  if (time.hour() >= 9) {
    const secondYesterdays = await rqHistory(location, unixTime.twoDayAgo);
    yesterdays = secondYesterdays.concat(yesterdays);
  }

  return [yesterdays, befores];
};

exports.getForecasts = async (location) => {
  return await rqForecasts(location);
};

async function rqHistory(location, time) {
  const response = await rp({
    uri: "https://api.openweathermap.org/data/2.5/onecall/timemachine",
    qs: {
      lat: location.lat,
      lon: location.lon,
      dt: time,
      appid: apiKey,
    },
  });

  const data = JSON.parse(response);

  if (data.hourly === undefined) {
    return [data.current];
  } else {
    return data.hourly;
  }
}

async function rqForecasts(location) {
  const data = await rp({
    uri: "https://api.openweathermap.org/data/2.5/onecall",
    qs: {
      lat: location.lat,
      lon: location.lon,
      exclude: "minutely,alerts",
      appid: apiKey,
    },
  });

  const result = JSON.parse(data);

  return [result.current, result.hourly, result.daily];
}
