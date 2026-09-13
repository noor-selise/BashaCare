import { mkdir, access } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const certDir = join(root, ".cert")
const host = process.env.NEXT_PUBLIC_BLOCKS_DEV_HOST || "dbsblo.slsblx.com"
const certFile = join(certDir, "dev-cert.pem")
const keyFile = join(certDir, "dev-key.pem")

const exists = async (path) => {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

if ((await exists(certFile)) && (await exists(keyFile))) {
  console.log(`Using existing cert for ${host}`)
  process.exit(0)
}

await mkdir(certDir, { recursive: true })

const mkcert = spawnSync(
  "mkcert",
  ["-cert-file", certFile, "-key-file", keyFile, host, "localhost", "127.0.0.1"],
  { cwd: root, stdio: "inherit" }
)

if (mkcert.status !== 0) {
  console.error("mkcert failed. Install mkcert and run mkcert -install, then npm run cert.")
  process.exit(mkcert.status ?? 1)
}

console.log(`Wrote ${certFile}`)
