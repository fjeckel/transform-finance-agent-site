# 📄 Bulk Episode Upload Guide

## Overview
Your enhanced bulk upload system now supports both structured files (Excel/CSV) and **unstructured text content** (Word documents, transcripts, etc.) with smart AI-powered parsing and translation.

## 🚀 How to Use

### 1. Access the Bulk Upload
- Go to `/admin` in your application
- Click **"Enhanced Bulk Upload"** button in the Episodes section
- You'll see two tabs: **Text Content** and **File Upload**

### 2. Upload Unstructured Content (NEW!)

#### Step 1: Paste Your Content
- Select the **"Text Content"** tab
- Paste any unstructured content:
  - Word document text
  - Episode transcripts
  - Markdown content
  - Plain text with title and content

#### Step 2: Parse Content
- Click **"Parse Content"** 
- The AI will extract:
  - Episode title
  - Description
  - Summary
  - Full content

#### Step 3: Review & Upload
- Review the parsed content in the preview
- Enable **"Auto-translate to English"** if desired
- Click **"Add to Upload Queue"**
- Click **"Upload Episodes"** to save to database

### 3. Upload Structured Files (Existing)
- Select the **"File Upload"** tab
- Choose Excel (.xlsx) or CSV format
- Download templates if needed
- Upload your file and review

## 🤖 Smart Content Parsing

The system automatically detects:

### Title Patterns
- `# Episode Title` (Markdown)
- `Title: Episode Name`
- `Episode 1: Title`
- First substantial line (10-80 characters)

### Description Patterns
- `Description: ...`
- `About this episode: ...`
- `In this episode: ...`
- First 2 sentences if not found

### Summary Patterns
- `Summary: ...`
- `Overview: ...`
- `Key Points: ...`
- First substantial paragraph

### Content
- Everything after `Content:` or `Transcript:`
- Full text if no patterns found

## 🌍 Auto-Translation

When enabled, episodes are automatically translated to English using:
- **Claude AI** (cost-effective, high quality)
- Maintains professional tone
- Preserves formatting
- Tracks translation costs and quality

## 💡 Examples

### Example 1: Word Document
```
Financial Planning Strategies - Episode 12

In this comprehensive guide, we explore the fundamentals of financial planning. 

Summary: We discuss market analysis, portfolio diversification, and risk management strategies for individual investors.

Content: Welcome to today's episode. Today we're diving deep into financial planning strategies that every investor should know...

[Full transcript content here]
```

### Example 2: Simple Transcript
```
Real Estate Investment Basics

Host: Welcome everyone to Finance Transformers...
Guest: Thank you for having me...

[Full conversation continues]
```

Both formats will be automatically parsed into proper episode structure!

## 🎯 Benefits

1. **No more manual formatting** - Just paste and go
2. **Smart extraction** - AI finds title, description, summary automatically  
3. **Instant preview** - See exactly what will be uploaded
4. **Batch processing** - Add multiple episodes to queue
5. **Auto-translation** - Multilingual support with one click
6. **Quality control** - Preview before upload, validation errors shown

## 🔧 Technical Details

- **Content parsing**: Regex patterns + smart fallbacks
- **Translation**: Claude API integration 
- **Database**: Direct Supabase integration
- **Validation**: Real-time error checking
- **Auto-save**: Draft episodes can be saved immediately

## 📞 Support

If you encounter any issues:
1. Check the validation errors displayed
2. Verify your content has a clear title
3. Ensure you have admin permissions
4. Contact support if translations fail

---

**Ready to streamline your episode creation process!** 🚀