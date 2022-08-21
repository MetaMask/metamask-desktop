#!/bin/sh

# Export all shell variables
set -a

# Set desktop specific variables
PHISHING_WARNING_PAGE_URL=http://test.com

# Add variables from .metamaskrc
export $(cat .metamaskrc | grep -v ";" | xargs)

electron dist_desktop/app/scripts/background.js
