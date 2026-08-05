// Minimal Chrome DevTools Protocol client.
//
// Deliberately dependency-free: Node has no global WebSocket until 22, and the
// alternative is pulling puppeteer/playwright (and a browser download) into the
// project just to run one layout check. This speaks enough of RFC 6455 to issue
// CDP commands and read their replies. It ignores protocol *events*, which is
// fine — every check here is request/response.
import { createHash, randomBytes } from "node:crypto";
import { connect } from "node:net";

function encodeFrame(text) {
  const payload = Buffer.from(text, "utf8");
  const mask = randomBytes(4);
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, 0x80 | len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 0x80 | 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 0x80 | 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  const masked = Buffer.alloc(len);
  for (let i = 0; i < len; i++) masked[i] = payload[i] ^ mask[i % 4];
  return Buffer.concat([header, mask, masked]);
}

function decodeFrames(buf) {
  const messages = [];
  let off = 0;
  while (off + 2 <= buf.length) {
    const opcode = buf[off] & 0x0f;
    let len = buf[off + 1] & 0x7f;
    let pos = off + 2;
    if (len === 126) {
      if (pos + 2 > buf.length) break;
      len = buf.readUInt16BE(pos);
      pos += 2;
    } else if (len === 127) {
      if (pos + 8 > buf.length) break;
      len = Number(buf.readBigUInt64BE(pos));
      pos += 8;
    }
    if (pos + len > buf.length) break;
    if (opcode === 0x1) messages.push(buf.subarray(pos, pos + len).toString("utf8"));
    off = pos + len;
  }
  return { messages, rest: buf.subarray(off) };
}

export async function connectCDP(wsUrl) {
  const { hostname, port, pathname } = new URL(wsUrl);
  const key = randomBytes(16).toString("base64");
  const socket = connect(Number(port), hostname);
  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("error", reject);
  });

  socket.write(
    `GET ${pathname} HTTP/1.1\r\nHost: ${hostname}:${port}\r\n` +
      `Upgrade: websocket\r\nConnection: Upgrade\r\n` +
      `Sec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`,
  );

  const accept = createHash("sha1")
    .update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
    .digest("base64");

  let buf = Buffer.alloc(0);
  await new Promise((resolve, reject) => {
    const onData = (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      const end = buf.indexOf("\r\n\r\n");
      if (end === -1) return;
      const head = buf.subarray(0, end).toString();
      if (!head.includes(accept)) return reject(new Error(`bad handshake:\n${head}`));
      buf = buf.subarray(end + 4);
      socket.off("data", onData);
      resolve();
    };
    socket.on("data", onData);
    socket.once("error", reject);
  });

  let nextId = 1;
  const pending = new Map();
  socket.on("data", (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    const { messages, rest } = decodeFrames(buf);
    buf = rest;
    for (const raw of messages) {
      const msg = JSON.parse(raw);
      const p = pending.get(msg.id);
      if (!p) continue;
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      socket.write(encodeFrame(JSON.stringify({ id, method, params })));
      setTimeout(() => {
        if (pending.delete(id)) reject(new Error(`CDP timeout: ${method}`));
      }, 60_000);
    });

  return { send, close: () => socket.destroy() };
}

/** Evaluate an expression in the page and return its JSON value. */
export async function evaluate(cdp, expression) {
  const { result, exceptionDetails } = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? JSON.stringify(exceptionDetails));
  return result.value;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
