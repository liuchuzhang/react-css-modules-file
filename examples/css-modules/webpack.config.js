const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')

module.exports = {
  devtool: false,
  entry: './main.js',
  mode: 'development',
  devServer: {
    port: 3000,
    hot: true
  },
  module: {
    rules: [
      {
        test: /\.js[x]?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: [
            '@babel/preset-react',
          ],
          plugins: [
            require.resolve('@babel/plugin-syntax-jsx')
          ]
        }
      },
      {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
            'css-modules-file-css-loader',
          ]
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new HTMLWebpackPlugin({
      template: path.resolve(__dirname, './index.html')
    })
  ]
}
