const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const pkg = require('./package.json');

module.exports = {
    devServer: {
        contentBase: path.join(__dirname, "static"),
        compress: true,
        port: 8282
    },
    entry: {
        chat       : './assets/chat.js',
        streamchat : './assets/streamchat.js',
        test       : './assets/test.js'
    },
    output: {
        path     : __dirname + '/static',
        filename : '[name].js'
    },
    plugins: [
        new CleanWebpackPlugin(['static'], {root: __dirname, verbose: false, exclude: ['cache', 'index.htm']}),
        new ExtractTextPlugin({filename: '[name].css'}),
        new webpack.DefinePlugin({VERSION: JSON.stringify(pkg.version)})
    ],
    watchOptions: {
        ignored: /node_modules/
    },
    module: {
        rules: [
            {
                test    : /\.(ts|tsx)$/,
                loader  : 'ts-loader'
            },
            {
                test    : /\.json$/,
                loader  : 'json-loader'
            },
            {
                test    : /\.js$/,
                exclude : /(node_modules)/,
                loader  : 'babel-loader',
                options : {presets: ['es2015']}
            },
            {
                test    : /\.(scss|css)$/,
                loader  : ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        {loader: 'css-loader'},
                        {loader: 'sass-loader'},
                        {loader: 'postcss-loader'},
                    ]
                })
            },
            {
                test    : /(-webfont|glyphicons-halflings-regular)\.(eot|svg|ttf|woff2?)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader  : 'file-loader',
                options : {name: 'fonts/[name].[ext]'}
            },
            {
                test    : /\.(png|jpg|gif|svg)$/,
                loader  : 'file-loader',
                options : {name: 'img/[name].[ext]'}
            }
        ]
    },
    resolve: {
        alias: {
            jquery: 'jquery/src/jquery'
        },
        extensions: ['.ts','.tsx','.js']
    },
    context: __dirname,
    devtool: false
};