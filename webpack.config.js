require('webpack')

module.exports = {
    devServer: {
        contentBase: './demo',
        port: 8282
    },
    entry: {
        demo: './assets/demo.js',
    },
    watchOptions: {
        ignored: /node_modules/
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules|)/,
                loader: 'babel-loader',
                options: {presets: ['@babel/preset-env'],}
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
            },
            {
                test: /\.(html)$/,
                loader: 'html-loader',
                options: {minimize: true}
            }
        ]
    },
    context: __dirname,
    devtool: false
};