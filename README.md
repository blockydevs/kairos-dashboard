# Huffy Dashboard

Huffy Dashboard is a dashboard application built with **Next.js**, using **Zustand** for state management, **TanStack React Query** for data fetching and caching, and **shadcn/ui** for UI components.

## Features

- Real-time message updates from HCS (Hedera Consensus Service)

## Environment Variables

Create a `.env` file in the root of the project with the following variables:

```env
NEXT_PUBLIC_TOPIC_ID="0.0.xxxxx"
NEXT_PUBLIC_MIRROR_NODE_URL="https://testnet.mirrornode.hedera.com"

HEDERA_OPERATOR_ID="0.0.xxxxx"
HEDERA_OPERATOR_KEY="302e02010..."
````

## Testing New HCS Messages

To test the display of a new HCS message by `topicId`, use the following endpoint:

```
GET http://localhost:3000/api/test/add-new-hcs-topic-msg
```

This fetches all messages from the **Hedera Mirror Node** and subscribes to any new messages for the given topic, allowing you to see new messages in real-time on the dashboard.

## Getting Started

1. Clone the repository:
2. Install dependencies using **pnpm**:

   ```bash
   pnpm install
   ```
3. Run the development server:

   ```bash
   pnpm dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

* `pnpm dev` – Run the development server
* `pnpm build` – Build the application
* `pnpm start` – Start the production server
* `pnpm lint` – Run ESLint

## License

MIT
