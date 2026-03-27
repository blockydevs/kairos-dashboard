# Kairos Dashboard

Kairos Dashboard is a modern, real-time trading monitoring interface built with **Next.js 16**. It provides deep insights into trading performance, portfolio status, and blockchain events on the **Hedera network**.

## 🚀 Features

- **Real-time HCS Monitoring**: Subscribes to Hedera Consensus Service (HCS) topics to display live trading events.
- **Portfolio Analytics**: Track portfolio balance, CAGR (Compound Annual Growth Rate), and Hit Rate.
- **PnL Tracking**: Detailed breakdown of Realized and Unrealized Profit & Loss.
- **Performance Charts**: Interactive visualizations for profit history and asset distribution (Treasury breakdown).
- **Trading Parameters**: View current bot settings and whitelisted pairs from the Hedera Parameter Store.
- **Blockchain Event Log**: A paginated, searchable table of all HCS messages and on-chain transactions.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [TanStack React Query v5](https://tanstack.com/query/latest)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Web3**: [Hedera SDK](https://github.com/hashgraph/hedera-sdk-js), [Ethers.js v5](https://docs.ethers.org/v5/)
- **Visuals**: [Lucide React](https://lucide.dev/), [Recharts](https://recharts.org/), [Sonner](https://sonner.stevenly.me/)

## ⚙️ Environment Variables

Create a `.env` file in the root directory and copy the contents from `.env.example`.

### Core Hedera Configuration
- `NEXT_PUBLIC_TOPIC_ID`: The HCS Topic ID to monitor.
- `HEDERA_OPERATOR_ID`: Your Hedera account ID (0.0.xxxxx).
- `HEDERA_OPERATOR_KEY`: Your Hedera private key.
- `NEXT_PUBLIC_MIRROR_NODE_URL`: URL to the Hedera Mirror Node (e.g., `https://testnet.mirrornode.hedera.com`).

### Contract Addresses & Integration
- `NEXT_PUBLIC_HEDERA_TREASURY_CONTRACT_ID`: ID of the treasury smart contract.
- `NEXT_PUBLIC_HEDERA_PAIRWHITELIST_CONTRACT_ID`: ID of the pair whitelist contract.
- `NEXT_PUBLIC_HEDERA_PARAMETERSTORE_CONTRACT_ID`: ID of the parameter store contract.
- `NEXT_PUBLIC_USDC_TOKEN_ID`: USDC token ID on Hedera.
- `NEXT_PUBLIC_WHBAR_TOKEN_ID`: WHBAR token ID on Hedera.

### API & Metrics
- `NEXT_PUBLIC_METRICS_ENDPOINT_URL`: Endpoint for fetching real-time performance metrics (PnL, CAGR).
- `NEXT_PUBLIC_PROFIT_HISTORY_API_URL`: API for historical performance data.
- `NEXT_PUBLIC_SYSTEM_INFO_API_URL`: API for system-level information.
- `NEXT_PUBLIC_PAIR_PNL_API_URL`: API for specific pair performance analytics.

## 🏁 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (Latest LTS)
- [pnpm](https://pnpm.io/)

### Local Development
1. **Clone the repository**:
   ```bash
   git clone https://github.com/blockydevs/kairos-dashboard
   cd kairos-dashboard
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure the environment**:
   ```bash
   cp .env.example .env
   # Fill out your .env variables
   ```

4. **Run the development server**:
   ```bash
   pnpm dev
   ```

5. **Open the browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

### Docker setup
You can also run the dashboard using Docker:
```bash
docker-compose up --build
```

## 📜 Available Scripts

- `pnpm dev` – Run the development server with Webpack.
- `pnpm build` – Create a production-ready build.
- `pnpm start` – Start the production server.
- `pnpm lint` – Run ESLint for code quality checks.
- `pnpm prettier` – Format code using Prettier.

## 📄 License

MIT
