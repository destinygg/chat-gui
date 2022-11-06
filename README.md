# Destinygg Chat GUI
## Requirements
- Node.js

## Development
1. Install Node.js dependencies
```
npm ci
```

2. Install Git hooks
```
cp .githooks/* .git/hooks/
```

3. Run the Webpack development server
```
npm run start
```

## Development server
Navigate to `http://localhost:8282` in your web browser of choice to access a local instance of Dgg Chat GUI.

>Note: Due to recent security improvements, you can no longer connect to production or staging Dgg chat from `localhost` (or any other origin). A workaround is coming soon™, so stay tuned.

### Query string parameters
- `u`
  - Chat WebSocket URL
  - Default: `ws://localhost:9000`

- `a`
  - Website API URL
  - Default: `http://localhost:8181`

- `s`
  - Website CDN URL
  - Default: `http://localhost:8182`

- `c`
  - Flairs and emotes cache key
  - Example: `1665865293752.1778`
  - Default: `null`
  - Note: This value changes every time a flair or emote is updated

- `t`
  - Embed type
  - Possible values: `embed` for Bigscreen chat, `stream` for on-stream chat
  - Default: `embed`

- `f`
  - Chat font scale
  - Possible values: An integer from `1` to `10`
  - Note: Only works for the `stream` embed type

### Examples
- Connect to `www.destiny.gg` (production)
```
http://localhost:8282/index.html?t=embed&u=wss://chat.destiny.gg/ws&s=https://cdn.destiny.gg&a=https://www.destiny.gg&c=1665865293752.1778
```

- Connect to `www.omniliberal.dev` (staging)
```
http://localhost:8282/index.html?t=embed&u=wss://chat.omniliberal.dev/ws&s=https://cdn.omniliberal.dev&a=https://www.omniliberal.dev&c=1664498644366.7973
```
