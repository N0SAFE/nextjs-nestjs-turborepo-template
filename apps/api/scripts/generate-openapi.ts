import { OpenAPIGenerator } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import { appContract } from '@repo/api-contracts'
import { generateSpec } from '../src/openapi';

async function main() {
  const spec = await generateSpec();

  process.stdout.write(JSON.stringify(spec, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
