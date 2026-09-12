import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      "public/concept-v2/**",
      "tools/des-art-admin/public/admin.js",
      "dist/Des-art Admin.app/Contents/Resources/source/**",
      ".next-admin-preview/**",
      ".next-admin-preview-*/**",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
