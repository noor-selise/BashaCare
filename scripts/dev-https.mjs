import { spawn } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const host = process.env.NEXT_PUBLIC_BLOCKS_DEV_HOST || "dbsblo.slsblx.com"

const run = (command, args) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit" })
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`))
    })
  })
}

await run(process.execPath, [join(root, "scripts", "generate-cert.mjs")])

const next = spawn(
  "npx",
  ["next", "dev", "--hostname", "127.0.0.1", "--port", "3000"],
  { cwd: root, stdio: "inherit" }
)

const startProxy = () => {
  const proxy = spawn(process.execPath, [join(root, "scripts", "https-proxy.mjs")], {
    cwd: root,
    stdio: "inherit"
  })

  proxy.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error("HTTPS proxy stopped. Next is still on 127.0.0.1:3000.")
      console.error(`Open https://${host} after: sudo npm run proxy`)
    }
  })

  return proxy
}

const proxy = startProxy()

const shutdown = () => {
  next.kill("SIGTERM")
  proxy.kill("SIGTERM")
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

next.on("exit", (code) => {
  proxy.kill("SIGTERM")
  process.exit(code ?? 0)
})
