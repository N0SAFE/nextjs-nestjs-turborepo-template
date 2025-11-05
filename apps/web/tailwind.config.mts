import { Config } from 'tailwindcss'
import sharedConfig from '@repo-configs/tailwind'

const config: Config = {
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
        '../../packages/ui/base/src/components/**/*.{ts,tsx}',
        '../../packages/ui/base/src/lib/**/*.{ts,tsx}',
        '../../packages/ui/base/src/index.tsx',
    ],
    darkMode: 'class',
    presets: [sharedConfig],
}
export default config
