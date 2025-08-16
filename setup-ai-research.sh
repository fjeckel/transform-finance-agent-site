#!/bin/bash

# AI Research System Setup Script
# This script will set up the complete AI Research system in Supabase

echo "🚀 Setting up AI Research System..."

# Check if we have the Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory"
    exit 1
fi

echo "📋 Executing database setup..."

# Execute the complete setup SQL
supabase db push --include-all --db-url postgresql://postgres.aumijfxmeclxweojrefa:$SUPABASE_DB_PASSWORD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres

if [ $? -eq 0 ]; then
    echo "✅ AI Research System setup completed successfully!"
    echo ""
    echo "🎉 You can now use the AI Research Comparator with full chat history features:"
    echo "   • Session management and history"
    echo "   • Folder organization" 
    echo "   • Search and filtering"
    echo "   • Cost tracking"
    echo "   • Templates and more!"
    echo ""
    echo "🌐 Access it at: /admin/ai-research"
else
    echo "❌ Setup failed. Please check the error messages above."
    echo ""
    echo "💡 Alternative: Copy COMPLETE_AI_RESEARCH_SETUP.sql to Supabase SQL Editor"
    echo "   URL: https://supabase.com/dashboard/project/aumijfxmeclxweojrefa/sql"
fi