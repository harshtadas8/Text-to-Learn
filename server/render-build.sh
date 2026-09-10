#!/usr/bin/env bash
# exit on error
set -o errexit

npm install

# Install Puppeteer browser explicitly into the project directory
npx puppeteer browsers install chrome
