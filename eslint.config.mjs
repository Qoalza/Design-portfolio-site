import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: ["tools/des-art-admin/public/admin.js"] },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
