### Running with Docker Compose

Copy `.env.example` to `.env` and fill in all required values before first run.

This stack now includes three services:

- `marmut`: the Discord bot
- `lavalink`: the audio node (`ghcr.io/lavalink-devs/lavalink:4-alpine`)
- `yt-cipher`: self-hosted YouTube cipher API (`ghcr.io/kikkia/yt-cipher:master`)

Lavalink is internal-only in Compose (no host port mapping), and Marmut reaches it over the shared Docker network as `lavalink:2333`.
yt-cipher is also internal-only, and Lavalink reaches it as `http://yt-cipher:8001`.

Start everything:

`docker compose up --build`

Run in detached mode:

`docker compose up -d --build`

### Verify Lavalink startup

Follow Lavalink logs:

`docker compose logs -f lavalink`

Follow yt-cipher logs:

`docker compose logs -f yt-cipher`

Follow Marmut logs:

`docker compose logs -f marmut`

### Audio tuning applied

The bundled `lavalink/application.yml` uses high-quality audio settings:

- `opusEncodingQuality: 10`
- `resamplingQuality: HIGH`
- `bufferDurationMs: 400`
- `frameBufferDurationMs: 5000`
- `useSeekGhosting: true`
- youtube-source plugin enabled (`dev.lavalink.youtube:youtube-plugin:1.18.0`)
- remote cipher enabled (`plugins.youtube.remoteCipher`) with self-hosted yt-cipher

Note: the Compose file runs Lavalink as root (`user: "0:0"`) so it can read your mounted local config file and plugin directory regardless of host file ownership.
Marmut waits for Lavalink's healthcheck before startup, preventing cold-start race conditions where the bot connects before Lavalink is listening.
Lavalink waits for yt-cipher container startup before startup. yt-cipher's published image is distroless, so Compose shell-based healthchecks are not available.

### yt-cipher authentication

Set `YT_CIPHER_API_TOKEN` in `.env`.

- Compose injects it to yt-cipher as `API_TOKEN`.
- The same value is injected into Lavalink and used as `plugins.youtube.remoteCipher.password`.

### YouTube OAuth token

Set `YOUTUBE_OAUTH_REFRESH_TOKEN` in `.env`.

- Compose injects it into Lavalink.
- Lavalink reads it as `plugins.youtube.oauth.refreshToken`.

### Cloud image push (optional)

Build your app image:

`docker build -t myapp .`

If needed for a different target CPU architecture:

`docker build --platform=linux/amd64 -t myapp .`

Push it to your registry:

`docker push myregistry.com/myapp`
