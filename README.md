# Destiny.gg chat GUI
Source code for the chat gui [www.destiny.gg](http://www.destiny.gg/)
This is a work in progress!

## License

See [LICENSE.md](LICENSE.md)

## Requirements

### Building

[nodejs](http://nodejs.org/) Dependency manager

[webpack](https://webpack.github.io/) Project builder

[glue](http://glue.readthedocs.org/) Glue is a simple command line tool to generate CSS sprites

#### Install the node dependencies

```shell
npm install webpack -g
npm install
composer install -no-dev
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
webpack
```

#### Additional scripts

Compiles single images from multiple and outputs a css file. Does this for `./assets/emotes` and `./assets/icons`
```shell
npm run glue
```

Pulls the latest list of TLD and outputs a json file `./assets/tld.json`
```shell
npm run tld
```