# Marmut 🐹🎧
Mari Mutar Musik

## Prerequisites
- Node.js 20+
- Pnpm
- Lavalink Server

## Setup
```bash
pnpm install
```

## Environment Variables
Copy `.env.example` to `.env` and fill in the required values:
- `DISCORD_TOKEN`: Your Discord bot token.
- `CLIENT_ID`: Your Discord bot client ID.
- `GUILD_ID`: (Optional) Your Discord server ID.
- `LAVALINK_NODE_NAME`: Name for Lavalink node.
- `LAVALINK_NODE_URL`: Lavalink node URL (e.g., localhost:2333).
- `LAVALINK_NODE_AUTH`: Lavalink node password.
- `LAVALINK_NODE_IS_SECURE`: `true` if Lavalink uses HTTPS/WSS.
- `AUTO_REGISTER_COMMANDS`: Set to `false` to disable automatic slash command registration.

## Deployment
### Native
```bash
pnpm build
pnpm start
```

### Docker
```bash
docker build -t marmut .
docker run -d --env-file .env marmut
```

## Testing
```bash
pnpm test
```
