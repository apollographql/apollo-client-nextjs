const { StatsWriterPlugin } = require("webpack-stats-plugin");

module.exports = {
  webpack: (config, options) => {
    const { dev, isServer } = options;

    // Output webpack stats JSON file only for
    // client-side/production build
    if (!dev && !isServer) {
      config.plugins.push(
        new StatsWriterPlugin({
          filename: "../webpack-stats.json",
          stats: {
            assets: true,
            chunks: true,
            modules: true,
            excludeAssets: [/webpack-stats.json/],
          },
        })
      );
    }

    // Disable minification for debugging purposes
    config.optimization.minimize = false;
    return config;
  },
  swcMinify: false,
  experimental: {
    serverMinification: false,
  },
};
