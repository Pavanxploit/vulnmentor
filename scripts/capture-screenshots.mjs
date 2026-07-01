import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const screenshotDir = process.env.SCREENSHOT_DIR
  ? path.resolve(process.env.SCREENSHOT_DIR)
  : path.join(rootDir, "screenshots");
const portalUrl = (process.env.PORTAL_URL ?? "http://localhost:3000").replace(/\/$/, "");
const defaultWidth = Number(process.env.SCREENSHOT_WIDTH ?? 1440);
const defaultHeight = Number(process.env.SCREENSHOT_HEIGHT ?? 1100);

const browserCandidates = [
  process.env.BROWSER_EXECUTABLE,
  process.env.CHROME_BIN,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  "C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

class CdpClient {
  constructor(wsUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.ws = new WebSocket(wsUrl);
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
      this.ws.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        const waiter = this.pending.get(message.id);
        if (!waiter) return;
        this.pending.delete(message.id);
        if (message.error) {
          waiter.reject(new Error(message.error.message));
          return;
        }
        waiter.resolve(message.result ?? {});
      });
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  close() {
    this.ws.close();
  }
}

function findBrowser() {
  const executable = browserCandidates.find((candidate) => existsSync(candidate));
  if (!executable) {
    throw new Error(
      "No Chromium-based browser found. Set BROWSER_EXECUTABLE to Chrome, Edge, Brave, or Chromium.",
    );
  }
  return executable;
}

async function getFreePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${url} failed with ${response.status}`);
  }
  return response.json();
}

async function waitForChrome(port) {
  const versionUrl = `http://127.0.0.1:${port}/json/version`;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      return await fetchJson(versionUrl);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error("Browser remote debugging endpoint did not become ready.");
}

async function createPage(port) {
  const targetUrl = `http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`;
  try {
    return await fetchJson(targetUrl, { method: "PUT" });
  } catch {
    return fetchJson(targetUrl);
  }
}

async function removeTempDir(dir) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      await rm(dir, { recursive: true, force: true });
      return;
    } catch {
      if (attempt === 5) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

async function waitForReady(client) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const result = await client.send("Runtime.evaluate", {
      expression: "document.readyState",
      returnByValue: true,
    });
    if (["interactive", "complete"].includes(result.result?.value)) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Page did not become ready.");
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Browser evaluation failed.");
  }
  return result.result?.value;
}

async function waitForText(client, text) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const hasText = await evaluate(
      client,
      `document.body.innerText.includes(${JSON.stringify(text)})`,
    );
    if (hasText) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Expected text not found: ${text}`);
}

async function authenticateDemoUser(client) {
  await client.send("Page.navigate", { url: portalUrl });
  await waitForReady(client);
  await evaluate(
    client,
    `(async () => {
      const credentials = {
        email: "guide@example.test",
        password: "VulnMentor@123"
      };

      const login = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      });

      if (login.ok) return "logged-in";

      const register = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Guide User",
          email: credentials.email,
          password: credentials.password,
          usn: "GUIDE",
          role: "instructor"
        })
      });

      if (!register.ok) {
        const error = await register.json().catch(() => ({ message: "Registration failed" }));
        throw new Error(error.message ?? "Registration failed");
      }

      return "registered";
    })()`,
  );
}

async function setViewportToContent(client) {
  const metrics = await evaluate(
    client,
    `(() => {
      const body = document.body;
      const html = document.documentElement;
      return {
        width: Math.max(${defaultWidth}, body.scrollWidth, html.scrollWidth),
        height: Math.min(3600, Math.max(${defaultHeight}, body.scrollHeight, html.scrollHeight))
      };
    })()`,
  );

  await client.send("Emulation.setDeviceMetricsOverride", {
    width: metrics.width,
    height: metrics.height,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

async function hideCaptureNoise(client) {
  await evaluate(
    client,
    `(() => {
      const style = document.createElement("style");
      style.textContent = [
        "nextjs-portal",
        "[data-nextjs-toast]",
        "[data-nextjs-dialog]",
        "[data-nextjs-dev-tools-button]",
        "[data-nextjs-dev-tools-indicator]",
        "[data-next-badge-root]",
        "[aria-label='Next.js dev tools']"
      ].join(",") + "{display:none!important;visibility:hidden!important;opacity:0!important;}";
      document.documentElement.appendChild(style);

      for (const element of Array.from(document.body.querySelectorAll("*"))) {
        const rect = element.getBoundingClientRect();
        const computed = getComputedStyle(element);
        const lowerLeftWidget =
          computed.position === "fixed" &&
          rect.left < 90 &&
          rect.top > window.innerHeight - 100 &&
          rect.width <= 100 &&
          rect.height <= 100;
        if (lowerLeftWidget) {
          element.style.setProperty("display", "none", "important");
        }
      }
    })()`,
  );
}

async function capture(client, item) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: defaultWidth,
    height: defaultHeight,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send("Page.navigate", { url: item.url });
  await waitForReady(client);

  if (item.action) {
    await evaluate(client, item.action);
    await new Promise((resolve) => setTimeout(resolve, 700));
  }

  if (item.expectText) {
    await waitForText(client, item.expectText);
  }

  await hideCaptureNoise(client);
  await setViewportToContent(client);
  const screenshot = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true,
  });
  await writeFile(path.join(screenshotDir, item.file), Buffer.from(screenshot.data, "base64"));
  console.log(`captured ${item.file}`);
}

const screenshots = [
  {
    file: "01-portal-overview.png",
    url: portalUrl,
    expectText: "Learn Cybersecurity with Safe Vulnerable Labs",
  },
  {
    file: "02-report-dashboard.png",
    url: `${portalUrl}/dashboard`,
    expectText: "Workspace pages",
  },
  {
    file: "03-labs-directory.png",
    url: `${portalUrl}/labs`,
    expectText: "Browse Practical Labs",
  },
  {
    file: "04-sqli-lab.png",
    url: `${portalUrl}/labs/web-sqli-login`,
    expectText: "Submit Flag",
  },
  {
    file: "05-stored-xss-lab.png",
    url: `${portalUrl}/labs/web-xss-comment`,
    expectText: "Stored XSS",
  },
  {
    file: "06-guide-console.png",
    url: `${portalUrl}/guide`,
    expectText: "Instructor Guide Console",
  },
  {
    file: "07-teaching-section.png",
    url: `${portalUrl}/teaching`,
    expectText: "Step-by-Step Teaching",
  },
];

async function main() {
  await mkdir(screenshotDir, { recursive: true });
  const port = await getFreePort();
  const userDataDir = path.join(tmpdir(), `vulnmentor-screenshots-${Date.now()}`);
  const browserExecutable = findBrowser();

  const browser = spawn(
    browserExecutable,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--disable-background-networking",
      "--disable-extensions",
      "--disable-spell-checking",
      "--disable-component-update",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  try {
    await waitForChrome(port);
    const target = await createPage(port);
    const client = new CdpClient(target.webSocketDebuggerUrl);
    await client.open();
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Emulation.setDefaultBackgroundColorOverride", {
      color: { r: 255, g: 255, b: 255, a: 1 },
    });
    await authenticateDemoUser(client);

    for (const item of screenshots) {
      await capture(client, item);
    }

    client.close();
  } finally {
    browser.kill();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await removeTempDir(userDataDir);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
