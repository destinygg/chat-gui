require('dotenv').config();
const HtmlWebpackPlugin = require('html-webpack-plugin');
require('webpack');

/**
 * Reads `sid` and `rememberme` session tokens from the environment and adds
 * them to a request. Assumes the `Cookie` header is formatted `k1=v1; k2=v2`.
 * @param {http.ClientRequest} request
 */
function bakeCookies(request) {
  let cookies = request.getHeader('Cookie') ?? '';

  const { SID, REMEMBERME } = process.env;
  if (SID) {
    if (cookies.indexOf('sid=') > -1) {
      cookies = cookies.replace(/(sid=).*?(;|$)/, `$1${SID}$2`);
    } else {
      cookies += `sid=${SID}`;
    }
  }
  if (REMEMBERME) {
    cookies += `; rememberme=${REMEMBERME}`;
  }

  request.setHeader('Cookie', cookies);
}

module.exports = {
  devServer: {
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: true,
      },
    },
    server: {
      type: 'https',
    },
    port: 8282,
    proxy: [
      {
        context: ['/api'],
        target: 'https://www.destiny.gg',
        secure: false,
        changeOrigin: true,
        onProxyReq: (proxyReq) => {
          bakeCookies(proxyReq);
        },
      },
      {
        context: ['/cdn'],
        target: 'https://cdn.destiny.gg',
        pathRewrite: { '^/cdn': '' },
        secure: false,
        headers: {
          Origin: 'https://www.destiny.gg',
          Host: 'cdn.destiny.gg',
        },
      },
      {
        context: ['/chat'],
        target: 'wss://chat.destiny.gg/ws',
        pathRewrite: { '^/chat': '' },
        secure: false,
        ws: true,
        headers: {
          Origin: 'https://www.destiny.gg',
          Host: 'chat.destiny.gg',
        },
        onProxyReqWs: (proxyReq) => {
          bakeCookies(proxyReq);
        },
      },
    ],
  },
  entry: {
    demo: './assets/demo.js',
  },
  watchOptions: {
    ignored: /node_modules/,
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Destiny GG',
      filename: 'index.html',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|)/,
        loader: 'babel-loader',
        options: { presets: ['@babel/preset-env'] },
      },
      {
        test: /\.(scss|css)$/,
        use: ['style-loader', 'css-loader', 'sass-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset/resource',
        generator: { filename: 'img/[name][ext]' },
      },
      {
        test: /\.(ttf)$/,
        type: 'asset/resource',
        generator: { filename: 'font/[name][ext]' },
      },
      {
        test: /\.(html)$/,
        loader: 'html-loader',
        options: { minimize: true },
      },
    ],
  },
  context: __dirname,
  devtool: false,
};
