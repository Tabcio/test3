// We need the 'path' module to work with file and directory paths.
const path = require('path');

module.exports = {
  // The 'entry' point is the main JavaScript file of your application.
  // Webpack will start bundling from this file.
  entry: './src/index.js',

  // The 'output' configuration tells Webpack where to put the bundled file.
  output: {
    // 'path.resolve' creates an absolute path to the 'dist' directory.
    // '__dirname' is a Node.js variable for the current directory's path.
    path: path.resolve(__dirname, 'dist'),
    // 'filename' is the name of the bundled JavaScript file.
    filename: 'bundle.js',
  },

  // Configuration for the webpack-dev-server.
  devServer: {
    // The 'static' property tells the server where to serve files from.
    // It will serve the 'index.html' in your 'dist' folder.
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    // Automatically open the browser when the server starts.
    open: true,
  },

  // Set the mode for Webpack. 'development' is faster and better for debugging.
  mode: 'development',
};