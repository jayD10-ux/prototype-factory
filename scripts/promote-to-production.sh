
#!/bin/bash

# Script to promote staging to production
echo "🚀 Starting promotion from staging to production..."

# Build and deploy to production
npm run deploy:prod

echo "✅ Promotion complete! The changes are now live in production."
