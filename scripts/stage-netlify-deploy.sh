#!/usr/bin/env bash
# Build a slim Netlify deploy tree (SPA + one Express function under 250MB).
set -euo pipefail

STAGE="${1:?stage dir}"
ROOT="${GITHUB_WORKSPACE:-$(pwd)}"

rm -rf "$STAGE"
mkdir -p "$STAGE/dist" "$STAGE/netlify/functions" "$STAGE/server" "$STAGE/node_modules"

cp -a "$ROOT/client/dist/." "$STAGE/dist/"
cp -a "$ROOT/server/prisma" "$STAGE/server/prisma"
cp -a "$ROOT/server/src" "$STAGE/server/src"

# Bundle Express API into a single CJS file; keep Prisma external (native engine).
npx --yes esbuild "$ROOT/netlify/functions/api.js" \
  --bundle \
  --platform=node \
  --target=node20 \
  --format=cjs \
  --outfile="$STAGE/netlify/functions/api.js" \
  --external:@prisma/client \
  --log-level=warning

# Minimal Prisma runtime: client package + generated engines (rhel for Netlify AWS).
mkdir -p "$STAGE/node_modules/@prisma"
cp -a "$ROOT/node_modules/@prisma/client" "$STAGE/node_modules/@prisma/client"
cp -a "$ROOT/node_modules/.prisma" "$STAGE/node_modules/.prisma"

# Drop unused query-engine binaries (keep rhel-openssl-3.0.x for Lambda).
if [ -d "$STAGE/node_modules/.prisma/client" ]; then
  find "$STAGE/node_modules/.prisma/client" -type f \( \
    -name '*darwin*' -o -name '*windows*' -o -name '*debian*' \
    -o -name '*linux-arm*' -o -name '*linux-musl*' -o -name '*openbsd*' \
  \) -delete
fi

# Remove TypeScript sources / maps from prisma client to shrink zip.
find "$STAGE/node_modules/@prisma" "$STAGE/node_modules/.prisma" \
  -type f \( -name '*.d.ts' -o -name '*.map' -o -name '*.ts' \) -delete 2>/dev/null || true

cat > "$STAGE/netlify.toml" <<'EOF'
[build]
  publish = "dist"
  functions = "netlify/functions"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
  external_node_modules = ["@prisma/client"]

[functions."api"]
  included_files = [
    "node_modules/.prisma/**",
    "node_modules/@prisma/client/**"
  ]

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
EOF

printf '%s\n' '{"name":"ecomm-netlify-deploy","private":true}' > "$STAGE/package.json"

echo "Stage sizes:"
du -sh "$STAGE" "$STAGE/netlify" "$STAGE/node_modules" "$STAGE/dist" "$STAGE/server"
FN_SIZE=$(du -sm "$STAGE/node_modules" "$STAGE/netlify" "$STAGE/server" | awk '{s+=$1} END {print s}')
echo "Approx function payload MB: $FN_SIZE"
if [ "$FN_SIZE" -gt 200 ]; then
  echo "::error::Function payload still too large (${FN_SIZE}MB)"
  find "$STAGE/node_modules" -type f -printf '%s %p\n' | sort -nr | head -20
  exit 1
fi
