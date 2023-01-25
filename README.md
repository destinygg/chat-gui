# Destinygg Chat GUI
## Requirements
- Node.js

## Development
1. Install Node.js dependencies
```
npm ci
```

2. Create a copy of the example `.env` file
```
cp .env.example .env
```

3. (Optional) Use the developer tools in your web browser to access your cookies and obtain your Destiny.gg session tokens: `sid` and `rememberme`

4. (Optional) Add the tokens to your `.env` file
```
vim .env
```
>Note: Save and exit vim with `:wq`.

5. Run the Webpack development server
```
npm run start
```

## Development server
Navigate to `https://localhost:8282` in your web browser of choice to access a local instance of Dgg Chat GUI connected to production Destiny.gg chat.

If you supplied your session tokens by following steps 3 and 4 above, you'll be authenticated and can chat like normal. Note that the tokens will eventually expire and won't automatically renew in this environment.

### Query string parameters
- `t`
  - Embed type
  - Possible values: `embed` for Bigscreen chat, `stream` for on-stream chat
  - Default: `embed`

- `f`
  - Chat font scale
  - Possible values: An integer from `1` to `10`
  - Note: Only works for the `stream` embed type

### Examples
- Open the on-stream chat with a font scale of `5`
```
https://localhost:8282/?t=stream&f=5
```
