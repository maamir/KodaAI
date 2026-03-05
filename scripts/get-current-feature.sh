#!/bin/bash

# Script to get the current feature ID for tracking
# Returns just the feature ID for use in other scripts

if [ ! -f .kiro/current-feature.json ]; then
  echo "Error: No current feature set. Run ./scripts/set-current-feature.sh first" >&2
  exit 1
fi

jq -r '.featureId' .kiro/current-feature.json
