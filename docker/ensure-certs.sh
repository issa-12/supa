#!/bin/sh
# Runs via nginx's /docker-entrypoint.d hook before nginx starts.
# Prefer a cert/key mounted at /certs (e.g. a locally-trusted mkcert pair);
# otherwise generate a self-signed fallback so the container always has TLS.
set -e

CERT_DIR=/etc/nginx/certs
mkdir -p "$CERT_DIR"

if [ -f /certs/selfsigned.crt ] && [ -f /certs/selfsigned.key ]; then
  echo "ensure-certs: using mounted certificate from /certs"
  cp /certs/selfsigned.crt "$CERT_DIR/selfsigned.crt"
  cp /certs/selfsigned.key "$CERT_DIR/selfsigned.key"
elif [ ! -f "$CERT_DIR/selfsigned.crt" ] || [ ! -f "$CERT_DIR/selfsigned.key" ]; then
  echo "ensure-certs: no mounted cert found, generating self-signed fallback (browsers will warn)"
  openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout "$CERT_DIR/selfsigned.key" \
    -out "$CERT_DIR/selfsigned.crt" \
    -days 825 \
    -subj "/C=US/ST=Local/L=Local/O=ReadTrack/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
fi
