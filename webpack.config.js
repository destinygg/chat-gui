require('webpack')
const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')

module.exports = {
    devServer: {
        contentBase: path.join(__dirname, 'static'),
        compress: true,
        port: 8282
    },
    entry: {
        test: './assets/test.js',
    },
    output: {
        path: __dirname + '/static',
        filename: '[name].js'
    },
    plugins: [
        new CleanWebpackPlugin(['static'], {
            root: __dirname,
            verbose: false,
            exclude: ['cache', 'index.htm', 'stream.htm']
        })
    ],
    watchOptions: {
        ignored: /node_modules/
    },
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules|)/,
                use: {
                    loader: 'babel-loader',
                    options: {presets: ['@babel/preset-env'],}
                }
            },
            {
                test: /\.(scss|css)$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                    'postcss-loader',
                ]
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'file-loader',
                options: {name: 'img/[name].[ext]'}
            }
        ]
    },
    resolve: {
        alias: {jquery: 'jquery/src/jquery'},
        extensions: ['.js']
    },
    context: __dirname,
    devtool: false
};