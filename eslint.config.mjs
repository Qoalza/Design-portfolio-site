import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      "tools/des-art-admin/public/admin.js",
      ".next-admin-preview/**",
      ".next-admin-preview-*/**",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
