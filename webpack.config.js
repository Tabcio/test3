// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    // Set the mode to development or production
    mode: 'development', // Change to 'production' for deployment
    // Entry point of your application
    entry: './src/index.js',
    // Output configuration
    output: {
        // The output directory for your bundled files
        path: path.resolve(__dirname, 'dist'),
        // The name of the bundled JavaScript file
        filename: 'bundle.js',
        // Clean the output directory before emit.
        clean: true,
    },
    // Development server configuration
    devServer: {
        // Serve content from the 'dist' directory
        static: path.resolve(__dirname, 'dist'),
        // Enable gzip compression for everything served
        compress: true,
        // Port for the development server
        port: 8080,
        // Open the browser automatically when the server starts
        open: true,
    },
    // Plugins to extend webpack's capabilities
    plugins: [
        // Generates an HTML file and injects the bundled JavaScript
        new HtmlWebpackPlugin({
            template: './dist/index.html', // Path to your HTML template
            filename: 'index.html', // Output HTML file name
        }),
        // Copies static assets from one directory to another
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'src/assets', // Source directory for assets
                    to: 'assets',      // Destination directory in 'dist'
                    noErrorOnMissing: true, // Prevents error if source is missing, but still won't copy if files aren't there
                },
            ],
        }),
    ],
    // Module rules for handling different file types
    module: {
        rules: [
            {
                // Process JavaScript files with Babel for compatibility
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'], // Use preset for environment compatibility
                    },
                },
            },
            {
                // Handle image files
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource', // Emit a separate file and export the URL
            },
        ],
    },
};

