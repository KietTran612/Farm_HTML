export default {
  multipass: true,
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          cleanupIds: false
        }
      }
    },
    {
      name: "removeAttrs",
      params: {
        attrs: ["data-name"]
      }
    },
    "removeDimensions",
    "sortAttrs"
  ]
};
