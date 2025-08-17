import { defineDocs, defineConfig } from 'fumadocs-mdx/config'

// Define our docs content root within the web app so we can co-locate and version with the app
export const docs = defineDocs({
  dir: 'src/content/docs',
})

// Create default config; fumadocs-mdx will emit .source types during postinstall/build
export default defineConfig()
