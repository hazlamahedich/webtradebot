#!/bin/bash

echo "Stopping existing Next.js processes..."
pkill -f "node .*next"

echo "Cleaning Next.js cache..."
rm -rf .next/cache

echo "Starting Next.js development server..."
npm run dev 