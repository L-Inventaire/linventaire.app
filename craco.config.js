const path = require("path");

module.exports = {
  webpack: {
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
