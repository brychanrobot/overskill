---
name: local-curl
description: Executes safe, authenticated HTTP/HTTPS requests against local services and Portless (.localhost) domains using lcurl. Use when querying local endpoints, verifying dev servers, testing API responses, or inspecting HTTP headers without risking external network calls or triggering curl sandbox deny rules.
---

# Safe Local HTTP Client (`lcurl`)

The `local-curl` skill provides a drop-in, secure alternative to `curl` strictly restricted to `localhost` and [Portless](https://github.com/vercel-labs/portless) (`.localhost`) domains.

It solves two critical challenges in agent-driven development:
1. **Sandbox & Tooling Policy Compliance**: In many sandboxed agent environments, raw `curl` commands are blocked by prefix-based deny rules. Executing `./scripts/lcurl` passes policy checks while restricting network access to the local machine.
2. **Seamless Portless HTTPS**: Portless provisions TLS certificates for `https://*.localhost` using a local certificate authority stored at `~/.portless/ca.pem`. Standard `curl` rejects these certificates with SSL error 60 unless `--cacert` is manually passed. `lcurl` automatically detects HTTPS queries to `.localhost` and injects `--cacert ~/.portless/ca.pem` when present, eliminating TLS warnings without using insecure `-k` / `--insecure` flags.

---

## 1. Domain & IP Restrictions

`lcurl` parses target URLs and options before executing `curl`. It strictly permits only:

| Target Pattern | Description / Examples |
| :--- | :--- |
| `localhost`, `localhost.localdomain` | Standard loopback hostnames |
| `*.localhost` | Portless base apps (`my-app.localhost`) and subdomains (`api.my-app.localhost`) |
| `127.0.0.0/8` | IPv4 loopback address space (e.g. `127.0.0.1`, `127.0.0.2:3000`) |
| `[::1]` | IPv6 loopback address |
| `*.local` | Multicast DNS hostnames used in Portless LAN mode |
| `*.<custom-domain>` | Custom TLDs or Cloudflare Tunnel domains configured via `PORTLESS_TLD` or `LCURL_ALLOWED_DOMAINS` |

> [!CAUTION]
> Any request targeting public domains (e.g. `google.com`), non-loopback private networks (e.g. `192.168.1.1`, `10.0.0.1`), or cloud metadata services (e.g. `169.254.169.254`) is immediately rejected with exit code `1` before `curl` is ever invoked.

---

## 2. Invocation & Syntax

`lcurl` is located at `scripts/lcurl` in the `overskill` repository:

```bash
# Direct executable invocation
./scripts/lcurl [curl-options] <url> [curl-options...]

# Or via Python 3 directly
python3 scripts/lcurl [curl-options] <url> [curl-options...]
```

`lcurl` passes all flags, options, headers, and standard input streams transparently through to `curl`.

---

## 3. Common Usage Patterns

### A. Basic GET Request

Query a local Portless service or dev server:

```bash
# Query Portless HTTPS domain (auto-validates local CA)
./scripts/lcurl https://my-app.localhost

# Query raw loopback port
./scripts/lcurl http://localhost:5173
```

### B. Inspect Response Headers (`-i` or `-I`)

```bash
./scripts/lcurl -i https://api.my-app.localhost/health
```

### C. Check Status Code Only (Silent Probe)

Extract just the HTTP response code (ideal for script checks and test assertions):

```bash
./scripts/lcurl -s -o /dev/null -w "%{http_code}\n" https://my-app.localhost
```

### D. POST Request with JSON Body

Send data with custom headers:

```bash
./scripts/lcurl -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "ping", "timestamp": 1718000000}' \
  https://my-app.localhost/api/events
```

### E. Pipe Data via Standard Input (`-d @-`)

Stream large payloads, files, or stdin pipes directly to the local server:

```bash
cat payload.json | ./scripts/lcurl -X POST \
  -H "Content-Type: application/json" \
  -d @- \
  https://my-app.localhost/api/sync
```

### F. Follow Redirects (`-L`) & Include Authentication

```bash
./scripts/lcurl -L \
  -H "Authorization: Bearer dev-session-token" \
  https://my-app.localhost/protected/resource
```

### G. View `lcurl` Specific Help & Version

```bash
# Display lcurl usage, security rules, and examples
./scripts/lcurl --lcurl-help

# Display lcurl version and underlying curl binary version
./scripts/lcurl --lcurl-version
```

---

## 4. Environment Variables & Overrides

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORTLESS_CA_PATH` | `~/.portless/ca.pem` | Path to custom Portless local CA certificate |
| `PORTLESS_TLD` | (unset) | Comma-separated custom TLDs (e.g. `localhost,yourdomain.com`) allowed by Portless and permitted by `lcurl` |
| `LCURL_ALLOWED_DOMAINS` | (unset) | Comma-separated list of additional permitted custom domains (e.g. `yourdomain.com`) |
| `CURL_BIN` | `/usr/bin/curl` (or `which curl`) | Path to system `curl` binary |

---

## 5. Security & Design Details

- **Drop-in Argument Parsing**: Correctly handles options that consume separate arguments (`-H`, `-d`, `-X`, `-o`, `--url`, etc.) so that flags like `-H "Host: example.com"` are never mistaken for target URLs.
- **No Unsafe Execution**: Uses Python's `os.execv` to directly replace the process image with `/usr/bin/curl`. No intermediate shell is spawned, eliminating command-injection risks.
- **Zero External Dependencies**: Implemented in standard Python 3.10+ using `ipaddress` and `urllib.parse`. Compatible with `uv run` via PEP 723 metadata without requiring package installations.
