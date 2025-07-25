#!/bin/bash

# Quick deploy script for debugging tools
echo "🔧 Building with debug tools enabled..."

# Build the project
npm run build

echo "✅ Build complete!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy the 'dist' folder to your production environment"
echo "2. The debug panels will now show on live site with red background"
echo "3. Test the purchase button on production to see diagnostics"
echo ""
echo "🚨 IMPORTANT: Remove debug tools after fixing the issue!"
echo "   Uncomment the 'if (import.meta.env.PROD)' lines when done"

# Show build output
echo ""
echo "📁 Build output in:"
ls -la dist/