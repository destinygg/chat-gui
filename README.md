# Destiny.gg Chat GUI

Source code for the chat gui [www.destiny.gg](http://www.destiny.gg/)
This is a work in progress!

## License

See [LICENSE.md](LICENSE.md)

#### Install the node dependencies

```
npm install
```

#### Developing

```
npm run start
```

### Get params
`u`: socket url
default `ws://localhost:9000`

`a`: api url
default `http://localhost:8181`

`s`: cdn url
default `http://localhost:8182`

`c`: cache key
default `empty`

`t`: template
[EMBED | STREAM] default `embed`

`f`: font scale
only works on STREAM. [1 ... 10] default `1`

e.g. Connect to destiny.gg, with defaults
`http://localhost:8282/index.htm?u=wss://www.destiny.gg/ws`

e.g. Connect to destiny.gg with the stream template
`http://localhost:8282/index.htm?u=wss://destiny.gg/ws&t=stream`