require("dotenv").config(); // Load .env file
const axios = require("axios");
const { Client, Intents } = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

function getPrices(index) {
  // API for price data.
  axios
    .get(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${process.env.COIN_ID}&price_change_percentage=1h%2C24h%2C7d%2C30d`
    )
    .then((res) => {
      // If we got a valid response
      if (
        res.data &&
        res.data[0].current_price &&
        res.data[0].price_change_percentage_24h
      ) {
        let currentPrice = res.data[0].current_price || 0; // Default to zero
        let priceChangePct = res.data[0].price_change_percentage_24h || 0; //Default to zero
        let priceChangePctWeek =
          res.data[0].price_change_percentage_7d_in_currency || 0;
        let priceChangePctMonth =
          res.data[0].price_change_percentage_30d_in_currency || 0;
        let symbol = res.data[0].symbol || "?";

        let activities = [
          `24hr: ${priceChangePct.toFixed(2)}%`,
          `7d: ${priceChangePctWeek.toFixed(2)}%`,
          `30d: ${priceChangePctMonth.toFixed(2)}%`,
        ];

        if (index === activities.length) index = 0;
        client.user.setPresence({
          activities: [
            {
              name: activities[index],
              type: "WATCHING",
            },
          ],
        });
        index++;

        client.guilds.cache
          .find((guild) => guild.id === process.env.SERVER_ID)
          .me.setNickname(
            `${symbol.toUpperCase()} ${
              process.env.CURRENCY_SYMBOL
            }${currentPrice
              .toLocaleString()
              .replace(/,/g, process.env.THOUSAND_SEPARATOR)}`
          );

        console.log("Updated price to", currentPrice);
      } else
        console.log(
          "Could not load player count data for",
          process.env.COIN_ID
        );
    })
    .catch((err) => console.log("Error at api.coingecko.com data:", err));
}

// Runs when client connects to Discord.
client.on("ready", () => {
  console.log("Logged in as", client.user.tag);

  getPrices(); // Ping server once on startup
  // Ping the server and set the new status message every x minutes. (Minimum of 1 minute)
  let index = 0;
  setInterval(() => {
    getPrices(index);
  }, Math.max(1, process.env.MC_PING_FREQUENCY || 1) * 60 * 1000);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
