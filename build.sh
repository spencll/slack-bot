#!/bin/bash

# Exit on any error
set -e

# Update package lists
apt-get update

# Install dependencies for Playwright
apt-get install -y libnss3 libxss1 libasound2 libatk1.0-0 libatk-bridge2.0-0 libcups2 libx11-xcb1 libpangocairo-1.0-0 libxcomposite1 libxcursor1 libxdamage1 libxi6 libxrandr2 libgbm1 libpango1.0-0 libxshmfence1

# Install Node.js dependencies
npm install

# Build project (add any build commands here)
# npm run build

echo "Build completed successfully!"
