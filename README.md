# Destiny.gg Chat GUI

Source code for the chat gui [www.destiny.gg](http://www.destiny.gg/)
This is a work in progress!

## License

See [LICENSE.md](LICENSE.md)

#### Install the node dependencies

```shell
npm install
```

#### You can now build the project.

```shell
npm run build
```
or
```shell
webpack -p
```

#### Building while developing

```shell
webpack -w
```
or
```shell
npm run watch
```

#### Implementation & Testing

```shell
npm run server
```

You can then test it by going to something like this....
```
http://localhost:8282/index.htm?u=wss://www.destiny.gg/ws
```
```
http://localhost:8282/stream.htm?u=wss://www.destiny.gg/ws
```