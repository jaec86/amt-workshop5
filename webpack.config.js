const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/js/app.js',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: process.env.NODE_ENV === 'production' ? 'none' : 'inline-source-map',
  devServer: {
    contentBase: './dist',
    writeToDisk: true
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/public' }
      ]
    })
  ]
};