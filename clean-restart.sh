#!/bin/bash

set -e

echo "Stopping existing Next.js processes..."
pkill -f "node .*next" || true

echo "Cleaning Next.js cache and build files..."
rm -rf .next
rm -rf node_modules/.cache

echo "Clearing npm cache..."
npm cache clean --force

echo "Removing node_modules... (this may take a minute)"
rm -rf node_modules

echo "Reinstalling dependencies..."
npm install --prefer-offline --no-audit --no-fund

echo "Starting Next.js development server..."
npm run dev 