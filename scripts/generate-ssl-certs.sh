#!/bin/bash

# Generate self-signed SSL certificates for local development

set -e

CERTS_DIR="$(cd "$(dirname "$0")/.." && pwd)/nginx/certs"
DAYS_VALID=365

echo "🔐 Generating self-signed SSL certificates for local development..."

# Create certs directory if it doesn't exist
mkdir -p "$CERTS_DIR"

# Generate private key
echo "📝 Generating private key..."
openssl genrsa -out "$CERTS_DIR/localhost.key" 2048

# Generate certificate signing request (CSR)
echo "📝 Generating certificate signing request..."
openssl req -new -key "$CERTS_DIR/localhost.key" \
  -out "$CERTS_DIR/localhost.csr" \
  -subj "/C=US/ST=Local/L=Local/O=Development/CN=localhost"

# Create config file for SAN (Subject Alternative Names)
cat > "$CERTS_DIR/localhost.ext" <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = 127.0.0.1
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Generate self-signed certificate with SAN
echo "📝 Generating self-signed certificate..."
openssl x509 -req -in "$CERTS_DIR/localhost.csr" \
  -signkey "$CERTS_DIR/localhost.key" \
  -out "$CERTS_DIR/localhost.crt" \
  -days "$DAYS_VALID" \
  -sha256 \
  -extfile "$CERTS_DIR/localhost.ext"

# Generate Diffie-Hellman parameters for stronger SSL security (optional but recommended)
echo "🔒 Generating Diffie-Hellman parameters (this may take a moment)..."
openssl dhparam -out "$CERTS_DIR/dhparam.pem" 2048

# Clean up temporary files
rm -f "$CERTS_DIR/localhost.csr" "$CERTS_DIR/localhost.ext"

# Set appropriate permissions
chmod 644 "$CERTS_DIR/localhost.crt"
chmod 600 "$CERTS_DIR/localhost.key"
chmod 644 "$CERTS_DIR/dhparam.pem"

echo "✅ SSL certificates generated successfully!"
echo "📁 Location: $CERTS_DIR"
echo "📄 Files created:"
echo "   - localhost.key (private key)"
echo "   - localhost.crt (certificate)"
echo "   - dhparam.pem (DH parameters)"
echo ""
echo "⚠️  Note: These are self-signed certificates for local development only."
echo "   Your browser will show a security warning - this is expected."
echo "   Add an exception to proceed to https://localhost:8443"
