# Destinygg Chat GUI

## Development
1. Install Node.js dependencies
```
npm ci
```

2. Run the Webpack development server
```
npm run start
```

3. Navigate to `https://localhost:8282` in your web browser

> Note: Chat GUI starts in mock mode with simulated chat messages by default.

### Mock mode
Mock mode simulates a live chat environment so you can develop and test UI changes without a real WebSocket connection or session tokens. It generates random messages, subscriptions, donations, bans, polls, and other events at random intervals.

Type `/mock` in the chat input with no arguments to see available commands. The following subcommands are supported:

| Command | Description |
|---------|-------------|
| `/mock stop` | Stop the mock event loop |
| `/mock start` | Start the mock event loop |
| `/mock ban` | Emit a ban event |
| `/mock sub` | Emit a subscription event |
| `/mock combo` | Emit a combo event |
| `/mock poll` | Emit a poll event |
| `/mock flood` | Send 20 messages rapidly |
| `/mock donation` | Emit a donation event |
| `/mock gift` | Emit a gift sub event |
| `/mock massgift` | Emit a mass gift sub event |
| `/mock mute` | Emit a mute event |
| `/mock broadcast` | Emit a broadcast event |
| `/mock death` | Emit a death event |

### Connecting to real chat
1. Create a copy of the example `.env` file
```
cp .env.example .env
```

2. Use the developer tools in your web browser to access your cookies and obtain your Destiny.gg session tokens: `sid` and `rememberme`

> Note: The tokens will eventually expire and won't automatically renew in this environment.

3. Add the tokens to your `.env` file
```
vim .env
```

4. Navigate to `https://localhost:8282?live=1` in your web browser


### Query string parameters
| Parameter | Description | Values | Default |
|-----------|-------------|--------|---------|
| `live` | Disable mock mode and connect to the real WebSocket | `1` | — |
| `t` | Embed type | `embed` (Bigscreen chat), `stream` (on-stream chat) | `embed` |
| `f` | Chat font scale (only works for `stream` embed type) | `1` to `10` | — |

#### Examples
- Open the on-stream chat with a font scale of `5`
```
https://localhost:8282/?t=stream&f=5
```

- Connect to real chat (disable mock mode)
```
https://localhost:8282/?live=1
```
