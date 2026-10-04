import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const config = [
  { ignores: ['.next/**', '.local/**', 'src/payload-types.ts', 'src/app/(payload)/admin/importMap.js'] },
  ...nextVitals,
  ...nextTypescript,
]
export default config
