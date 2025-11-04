#!/bin/bash

# Fix Next.js 16 params in route handlers
# This script updates all route handlers to use Promise<params> instead of direct params

echo "Fixing route handlers for Next.js 16..."

# List of route files to fix
routes=(
  "app/api/admin/blog/categories/[id]/route.ts"
  "app/api/admin/blog/tags/[id]/route.ts"
  "app/api/admin/claims/[id]/route.ts"
  "app/api/admin/listings/[id]/route.ts"
  "app/api/admin/reviews/[id]/route.ts"
  "app/api/advisor/leads/[id]/route.ts"
  "app/api/advisors/[id]/reviews/route.ts"
  "app/api/advisors/[id]/track-click/route.ts"
)

for route in "${routes[@]}"; do
  if [ -f "$route" ]; then
    echo "Processing: $route"

    # Backup
    cp "$route" "$route.bak"

    # Fix RouteParams interface
    sed -i 's/params: {$/params: Promise<{/g' "$route"
    sed -i 's/params: { id: string }$/params: Promise<{ id: string }>/g' "$route"
    sed -i 's/params: { slug: string }$/params: Promise<{ slug: string }>/g' "$route"

    # Add await for params at the start of each function
    # This is trickier and might need manual review

    echo "  ✓ Updated $route"
  else
    echo "  ✗ Not found: $route"
  fi
done

echo "Done! Review changes and remove .bak files if everything looks good."
