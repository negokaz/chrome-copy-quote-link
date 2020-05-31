// This file is not going through babel transformation.
// So, we write it in vanilla JS
// (But you could use ES2015 features supported by your Node.js version)
const webpack = require('webpack')
const { resolve } = require('path');
const GlobEntriesPlugin = require('webpack-watched-glob-entries-plugin');

module.exports = {
  webpack: (config, { dev, vendor }) => {
    // Perform customizations to webpack config
    config.entry = GlobEntriesPlugin.getEntries(
        [
          resolve('app', '*.{js,mjs,jsx,ts,tsx}'),
          resolve('app', '?(scripts)/**/*.{js,mjs,jsx,ts,tsx}')
        ]
    );
    config.module.rules.push(
        {
            test: /\.(ts|tsx)$/,
            use: 'ts-loader',
        },
        {
            test: /\.css$/i,
            use: ['style-loader', 'css-loader'],
        },
        {
            test: /\.(png|svg|eot|woff|woff2|ttf)$/i,
            use: ['file-loader'],
        }
    );
    config.resolve.extensions.push('.js', '.ts', '.tsx');
    // Important: return the modified config
    return config
  },
  copyIgnore: ['**/*.ts', '**/*.tsx']
}
