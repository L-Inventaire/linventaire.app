const path = require("path");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      if (webpackConfig.mode === "production") {
        // Modify output filenames to include content hash
        webpackConfig.output.filename = "static/js/[name].[contenthash:8].js";
        webpackConfig.output.chunkFilename =
          "static/js/[name].[contenthash:8].chunk.js";

        // Ensure content hashing for CSS files by modifying MiniCssExtractPlugin options
        webpackConfig.plugins.forEach((plugin) => {
          if (plugin.constructor.name === "MiniCssExtractPlugin") {
            plugin.options.filename = "static/css/[name].[contenthash:8].css";
            plugin.options.chunkFilename =
              "static/css/[name].[contenthash:8].chunk.css";
          }
        });
      }
      return webpackConfig;
    },
    devtool: "source-map",
    plugins: [],
    alias: {
      "@views": path.resolve(__dirname, "src/views"),
      "@atoms": path.resolve(__dirname, "src/atoms"),
      "@molecules": path.resolve(__dirname, "src/molecules"),
      "@components": path.resolve(__dirname, "src/components"),
      "@store": path.resolve(__dirname, "src/store"),
      "@config": path.resolve(__dirname, "src/config"),
      "@features": path.resolve(__dirname, "src/features"),
      "@assets": path.resolve(__dirname, "src/assets"),
    },
  },
};
