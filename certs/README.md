# TLS certificates

`docker compose` mounts this folder into the frontend container at `/certs` (read-only).
At startup the container uses `certs/selfsigned.crt` + `certs/selfsigned.key` if both
exist; otherwise it generates a self-signed fallback (browsers will show a warning).

For a **warning-free HTTPS and a working PWA/service worker**, drop a locally-trusted
certificate here using [mkcert](https://github.com/FiloSottile/mkcert):

```powershell
# one-time on the machine (installs a local CA into the OS/Chrome trust store)
winget install FiloSottile.mkcert
mkcert -install

# from the project root — generate a cert trusted by this machine
mkcert -cert-file certs/selfsigned.crt -key-file certs/selfsigned.key localhost 127.0.0.1
```

Then `docker compose up --build` and open `https://localhost` — no warning, the service
worker registers, and the app is installable.

The actual `.crt` / `.key` files are gitignored (never commit private keys).
