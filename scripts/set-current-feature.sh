#!/bin/bash

# Script to set the current feature for tracking
# Usage: ./scripts/set-current-feature.sh <feature-id>

if [ -z "$1" ]; then
  echo "Usage: $0 <feature-id>"
  echo ""
  echo "Available features:"
  curl -s http://localhost:4000/api/features | jq -r '.data[] | "\(.id) - \(.name) (\(.status))"'
  exit 1
fi

FEATURE_ID=$1

# Validate feature exists
FEATURE=$(curl -s http://localhost:4000/api/features/$FEATURE_ID)

if echo "$FEATURE" | jq -e '.code == "NOT_FOUND"' > /dev/null; then
  echo "Error: Feature not found"
  exit 1
fi

FEATURE_NAME=$(echo "$FEATURE" | jq -r '.name')

# Update current feature file
cat > .kiro/current-feature.json <<EOF
{
  "featureId": "$FEATURE_ID",
  "name": "$FEATURE_NAME",
  "description": "Current feature being tracked by Kiro hooks"
}
EOF

echo "✓ Current feature set to: $FEATURE_NAME ($FEATURE_ID)"
echo ""
echo "Now updating hooks..."

# Update hooks to use this feature ID
for hook_file in .kiro/hooks/*.kiro.hook; do
  if [ -f "$hook_file" ]; then
    # Create a temporary file with updated feature ID
    jq --arg fid "$FEATURE_ID" '
      if .then.command then
        .then.command |= gsub("featureId\\\\\":\\\\\"[^\\\\\"]+"; "featureId\\\\\":\\\\\"" + $fid)
      else
        .
      end
    ' "$hook_file" > "$hook_file.tmp" && mv "$hook_file.tmp" "$hook_file"
    echo "  Updated: $(basename $hook_file)"
  fi
done

echo ""
echo "✓ All hooks updated successfully!"
