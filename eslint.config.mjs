import nextConfig from "eslint-config-next/core-web-vitals";

const config = [
  ...nextConfig,
  {
    files: ["e2e/**/*.js"],
    rules: {
      "no-restricted-syntax": ["error", {
        selector: "CallExpression[callee.property.name='screenshot'] > ObjectExpression.arguments > Property[key.name='path']:not([value.type='CallExpression'][value.callee.property.name='outputPath'])",
        message: "Save screenshots with testInfo.outputPath() or test.info().outputPath() so artifacts stay portable and isolated per test.",
      }],
    },
  },
  {
    rules: {
      // These React Compiler diagnostics are not yet actionable across the legacy Pages Router UI.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default config;
