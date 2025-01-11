# Crypto Dex Token Filter API

## Overview

This project is a Node.js application built using Express.js that interacts with the CoinMarketCap and GoPlus APIs to retrieve, filter, and validate decentralized exchange (DEX) tokens based on specific parameters. It serves as a useful tool to fetch safe tokens from the Solana blockchain, specifically from the Raydium DEX.

## Features

- Fetches the latest tokens from CoinMarketCap API for the Solana blockchain.
- Filters tokens based on:
  - Liquidity
  - 24-hour trading volume
  - Percentage change in 24 hours
  - Number of transactions in 24 hours
- Validates tokens using GoPlus API for additional safety checks.
- Provides a random selection of 10 validated tokens from the safe list.

## Prerequisites

- Node.js (v14 or above)
- npm (Node Package Manager)
- A valid CoinMarketCap API Key

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/crypto-dex-token-filter-api.git
   cd crypto-dex-token-filter-api
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your CoinMarketCap API key:

   ```env
   CMC_PRO_API_KEY=your_coinmarketcap_api_key
   ```

4. Start the server:
   ```bash
   npm start
   ```
   The server will run at `http://localhost:3000`.

## API Endpoint

### GET `/crypto/coin_market/dex`

#### Query Parameters

| Parameter                    | Description                            | Required | Example     |
| ---------------------------- | -------------------------------------- | -------- | ----------- |
| `liquidity_min`              | Minimum liquidity value                | No       | `10000`     |
| `liquidity_max`              | Maximum liquidity value                | No       | `50000`     |
| `volume_24h_min`             | Minimum 24-hour trading volume         | No       | `100000`    |
| `volume_24h_max`             | Maximum 24-hour trading volume         | No       | `500000`    |
| `no_of_transactions_24h_min` | Minimum number of 24-hour transactions | No       | `100`       |
| `no_of_transactions_24h_max` | Maximum number of 24-hour transactions | No       | `1000`      |
| `percent_change_24h_min`     | Minimum 24-hour percentage change      | No       | `-10`       |
| `percent_change_24h_max`     | Maximum 24-hour percentage change      | No       | `10`        |
| `sort`                       | Sorting parameter                      | No       | `liquidity` |
| `sort_dir`                   | Sorting direction (`asc` or `desc`)    | No       | `asc`       |

#### Example Request

```bash
GET http://localhost:3000/crypto/coin_market/dex?liquidity_min=10000&volume_24h_min=50000
```

#### Response Format

```json
[
  {
    "name": "TOKEN/USDC",
    "symbol": "TOKEN",
    "contract_address": "example_contract_address",
    "price": 1.23,
    "volume_24h": 50000,
    "percent_change_1h": 0.5,
    "percent_change_24h": 5.6,
    "liquidity": 100000
  },
  ...
]
```

## How It Works

1. **Fetch Tokens**: The app retrieves tokens from CoinMarketCap's DEX API using the provided query parameters.
2. **Filter Unique Tokens**: Tokens are filtered to ensure only unique symbols are considered.
3. **Recursive Pagination**: The API uses recursive pagination to fetch additional tokens until the criteria are met or 40 unique tokens are retrieved.
4. **Validate Tokens**: The GoPlus API is used to validate tokens for safety based on specific criteria (e.g., non-freezable, non-closable, and non-mintable).
5. **Random Selection**: A random subset of 10 validated tokens is sent in the response.

## Error Handling

If an error occurs during the request or validation process, the API will return a `500 Internal Server Error` with the error message in the response body:

```json
{
  "error": "Error message"
}
```

## Technologies Used

- **Node.js**: Backend runtime environment.
- **Express.js**: Web framework for building APIs.
- **Axios**: HTTP client for API calls.
- **dotenv**: For environment variable management.

## Logging & Debugging

- Logs errors and retries during token validation.
- Implements exponential backoff for retrying failed GoPlus API requests.

## Future Improvements

- Add unit tests for API endpoints and utility functions.
- Enhance validation logic with more robust safety checks.
- Add support for more networks and DEXs.
