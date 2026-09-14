import { createServer as createHttpsServer } from "node:https"
import { request as httpRequest } from "node:http"
import { connect as netConnect } from "node:net"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const host = process.env.NEXT_PUBLIC_BLOCKS_DEV_HOST || "dbsblo.slsblx.com"
const listenPort = Number(process.env.HTTPS_PROXY_PORT || 443)
const targetPort = Number(process.env.NEXT_DEV_PORT || 3000)
const cert = readFileSync(join(root, ".cert", "dev-cert.pem"))
const key = readFileSync(join(root, ".cert", "dev-key.pem"))

const proxy = createHttpsServer({ cert, key }, (incoming, outgoing) => {
  const forwarded = httpRequest(
    {
      hostname: "127.0.0.1",
      port: targetPort,
      method: incoming.method,
      path: incoming.url,
      headers: {
        ...incoming.headers,
        host
      }
    },
    (upstream) => {
      outgoing.writeHead(upstream.statusCode ?? 502, upstream.headers)
      upstream.pipe(outgoing)
    }
  )

  forwarded.on("error", () => {
    if (!outgoing.headersSent) {
      outgoing.writeHead(502, { "content-type": "text/plain" })
    }
    outgoing.end("Next.js is not listening on port 3000.")
  })

  incoming.pipe(forwarded)
})

proxy.on("upgrade", (incoming, socket, head) => {
  const upstream = netConnect(targetPort, "127.0.0.1", () => {
    const headers = Object.entries(incoming.headers)
      .map(([name, value]) => `${name}: ${Array.isArray(value) ? value.join(", ") : value}`)
      .join("\r\n")
    upstream.write(`${incoming.method} ${incoming.url} HTTP/${incoming.httpVersion}\r\n${headers}\r\n\r\n`)
    if (head.length) upstream.write(head)
    upstream.pipe(socket)
    socket.pipe(upstream)
  })

  upstream.on("error", () => socket.destroy())
})

proxy.on("error", (error) => {
  if (error.code === "EACCES") {
    console.error(`Port ${listenPort} needs privilege to serve https://${host}`)
    process.exit(1)
  }
  throw error
})

proxy.listen(listenPort, "0.0.0.0", () => {
  console.log(`https://${host} -> 127.0.0.1:${targetPort}`)
})
