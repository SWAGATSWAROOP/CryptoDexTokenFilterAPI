const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = 3000;

function formatDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

app.get("/crypto/coin_market/dex", async (req, res) => {
  try {
    const baseApiUrl = "https://pro-api.coinmarketcap.com";
    const apiKey = process.env.CMC_PRO_API_KEY;

    const {
      liquidity_min,
      liquidity_max,
      volume_24h_min,
      volume_24h_max,
      no_of_transactions_24h_min,
      no_of_transactions_24h_max,
      percent_change_24h_min,
      percent_change_24h_max,
      sort,
      sort_dir,
    } = req.query;

    const queryParams = new URLSearchParams();

    if (liquidity_min) queryParams.append("liquidity_min", liquidity_min);
    if (liquidity_max) queryParams.append("liquidity_max", liquidity_max);
    if (volume_24h_min) queryParams.append("volume_24h_min", volume_24h_min);
    if (volume_24h_max) queryParams.append("volume_24h_max", volume_24h_max);
    if (no_of_transactions_24h_min)
      queryParams.append(
        "no_of_transactions_24h_min",
        no_of_transactions_24h_min
      );
    if (no_of_transactions_24h_max)
      queryParams.append(
        "no_of_transactions_24h_max",
        no_of_transactions_24h_max
      );
    if (percent_change_24h_min)
      queryParams.append("percent_change_24h_min", percent_change_24h_min);
    if (percent_change_24h_max)
      queryParams.append("percent_change_24h_max", percent_change_24h_max);
    if (sort) queryParams.append("sort", sort);
    if (sort_dir) queryParams.append("sort_dir", sort_dir);

    queryParams.append("CMC_PRO_API_KEY", apiKey);
    queryParams.append("network_slug", "solana");
    queryParams.append("dex_slug", "raydium");

    const uniqueSymbols = new Set();
    let accumulatedTokens = [];
    let scrollId = null;

    // Fetch tokens from CoinMarketCap API
    const fetchTokens = async () => {
      if (scrollId) queryParams.set("scroll_id", scrollId);

      const url = `${baseApiUrl}/v4/dex/spot-pairs/latest?${queryParams.toString()}`;
      const response = await axios.get(url);

      const data = response.data.data;
      scrollId = response.data.scroll_id;

      data.forEach((res) => {
        const symbol = res.name.split("/")[0];
        if (!uniqueSymbols.has(symbol)) {
          uniqueSymbols.add(symbol);
          accumulatedTokens.push({
            name: res.name,
            symbol,
            contract_address: res.base_asset_contract_address,
            price: res.quote[0]?.price || null,
            volume_24h: res.quote[0]?.volume_24h || null,
            percent_change_1h: res.quote[0]?.percent_change_price_1h || null,
            percent_change_24h: res.quote[0]?.percent_change_price_24h || null,
            liquidity: res.quote[0]?.liquidity || null,
          });
        }
      });

      if (uniqueSymbols.size < 40 && scrollId) {
        await fetchTokens();
      }
    };

    await fetchTokens();

    accumulatedTokens = accumulatedTokens.slice(0, 40);

    // Validate tokens with GoPlus API in parallel
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const validateTokens = async (tokens) => {
      const goPlusApiUrl =
        "https://api.gopluslabs.io/api/v1/solana/token_security";
      const maxRetries = 5; // Max retry attempts
      const retryDelay = 2000; // Delay between retries (in ms)

      const validationResults = [];

      for (const token of tokens) {
        let attempts = 0;
        let isValid = false;
        let validatedToken = null;

        while (attempts < maxRetries && !isValid) {
          try {
            const response = await axios.get(goPlusApiUrl, {
              params: { contract_addresses: token.contract_address },
              headers: {
                "User-Agent": "PostmanRuntime/7.43.0",
                Accept: "*/*",
                "Accept-Encoding": "gzip, deflate, br",
                Connection: "keep-alive",
              },
            });

            const result = response.data.result[token.contract_address];
            const isSafe =
              result.freezable.status === "0" &&
              result.closable.status === "0" &&
              result.mintable.status === "0";
            if (isSafe) {
              validatedToken = token;
              isValid = true;
            }
          } catch (err) {
            console.error(
              `Error validating token: ${token.contract_address}`,
              err.message
            );
          }

          if (!isValid) {
            attempts++;
            if (attempts < maxRetries) {
              console.log(
                `Retrying... Attempt ${attempts} for token ${token.contract_address}`
              );
              await delay(retryDelay * attempts);
            }
          }
        }

        if (validatedToken) {
          validationResults.push(validatedToken);
        }
      }

      return validationResults;
    };

    const safeTokens = await validateTokens(accumulatedTokens);

    const randomSafeTokens = safeTokens
      .sort(() => 0.5 - Math.random())
      .slice(0, 10);

    res.json(randomSafeTokens);
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
