import { spawn } from "node:child_process"
import { realpathSync } from "node:fs"
import { createConnection, createServer } from "node:net"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const host = process.env.NEXT_PUBLIC_BLOCKS_DEV_HOST || "dbsblo.slsblx.com"
const proxyScript = join(root, "scripts", "https-proxy.mjs")

const run = (command, args) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit" })
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`))
    })
  })
}

const runSoft = (command, args) => {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit" })
    child.on("exit", (code) => resolve(code === 0))
  })
}

const isPortOpen = (port) =>
  new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port }, () => {
      socket.end()
      resolve(true)
    })
    socket.on("error", () => resolve(false))
  })

const probeListen = (port) =>
  new Promise((resolve) => {
    const server = createServer()
    server.once("error", (error) => {
      resolve(error.code === "EADDRINUSE" ? "busy" : "denied")
    })
    server.listen(port, "0.0.0.0", () => {
      server.close(() => resolve("free"))
    })
  })

const waitForListen = async (port, timeoutMs) => {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (await isPortOpen(port)) return true
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  return false
}

const startProxy = (useSudo) => {
  if (useSudo) {
    return spawn("sudo", ["-E", process.execPath, proxyScript], {
      cwd: root,
      stdio: "inherit"
    })
  }

  return spawn(process.execPath, [proxyScript], {
    cwd: root,
    stdio: "inherit"
  })
}

await run(process.execPath, [join(root, "scripts", "generate-cert.mjs")])

if (await isPortOpen(3000)) {
  console.error("Port 3000 is already in use. Free it, then retry:")
  console.error("  fuser -k 3000/tcp")
  process.exit(1)
}

let listen = await probeListen(443)

if (listen === "denied") {
  console.log(`Port 443 needs sudo once so https://${host} can bind.`)
  const nodeBin = realpathSync(process.execPath)
  if (await runSoft("sudo", ["setcap", "cap_net_bind_service=+ep", nodeBin])) {
    listen = "free"
  }
}

let proxy = null

if (listen === "busy") {
  console.log(`https://${host} is already listening on 443.`)
} else if (listen === "free") {
  proxy = startProxy(false)
} else {
  proxy = startProxy(true)
}

if (listen !== "busy" && !(await waitForListen(443, 120000))) {
  console.error(`Could not bind https://${host}.`)
  proxy?.kill("SIGTERM")
  process.exit(1)
}

const next = spawn(
  "npx",
  ["next", "dev", "--hostname", "127.0.0.1", "--port", "3000"],
  { cwd: root, stdio: "inherit" }
)

const shutdown = () => {
  next.kill("SIGTERM")
  proxy?.kill("SIGTERM")
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

next.on("exit", (code) => {
  proxy?.kill("SIGTERM")
  process.exit(code ?? 0)
})
