export default {
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      enabled: true,
      reporter: ["text", "json", "html"],
    },
    testTimeout: 10000,
  },
};
