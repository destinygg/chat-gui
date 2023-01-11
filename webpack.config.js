const HtmlWebpackPlugin = require('html-webpack-plugin');
require('webpack');

module.exports = {
  devServer: {
    https: true,
    port: 8282,
    proxy: {
      '/api': {
        target: 'https://www.destiny.gg',
        secure: false,
        changeOrigin: true,
      },
      '/cdn': {
        target: 'https://cdn.destiny.gg',
        pathRewrite: { '^/cdn': '' },
        secure: false,
        headers: {
          Origin: 'https://www.destiny.gg',
          Host: 'cdn.destiny.gg',
        },
      },
      '/chat': {
        target: 'wss://chat.destiny.gg/ws',
        pathRewrite: { '^/chat': '' },
        secure: false,
        ws: true,
        headers: {
          Origin: 'https://www.destiny.gg',
          Host: 'chat.destiny.gg',
        },
      },
    },
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
        loader: 'file-loader',
        options: { name: 'img/[name].[ext]' },
      },
      {
        test: /\.(ttf)$/,
        loader: 'file-loader',
        options: { name: 'font/[name].[ext]' },
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
