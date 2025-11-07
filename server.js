const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Your Discord webhook URL - you'll set this as an environment variable
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Link replacement rules
const PLATFORM_REPLACEMENTS = {
  'twitter.com': 'vxtwitter.com',
  'x.com': 'vxtwitter.com', 
  'reddit.com': 'vxreddit.com'
};

function fixLinks(text) {
  let fixedText = text;
  
  // Replace all platform links
  for (const [original, replacement] of Object.entries(PLATFORM_REPLACEMENTS)) {
    const regex = new RegExp(`https://${original}`, 'gi');
    fixedText = fixedText.replace(regex, `https://${replacement}`);
  }
  
  return fixedText;
}

app.post('/linkfix', async (req, res) => {
  try {
    const { url, text, username } = req.body;
    
    let contentToFix = '';
    
    if (url) {
      // Single URL mode
      contentToFix = url;
    } else if (text) {
      // Text mode (can contain multiple links)
      contentToFix = text;
    } else {
      return res.status(400).json({ 
        error: 'No URL or text provided',
        usage: 'Send { "url": "single_url" } OR { "text": "text with multiple urls" }'
      });
    }
    
    // Fix all links in the content
    const fixedContent = fixLinks(contentToFix);
    
    // Send to Discord webhook if URL is provided
    if (WEBHOOK_URL && (url || text)) {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: fixedContent,
          username: username || 'Link Fixer'
        })
      });
    }
    
    res.json({ 
      success: true, 
      original: contentToFix,
      fixed: fixedContent,
      platforms: Object.keys(PLATFORM_REPLACEMENTS)
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process links' });
  }
});

// Health check endpoint with usage info
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Multi-Platform Link Fixer is running',
    supported_platforms: PLATFORM_REPLACEMENTS,
    endpoints: {
      '/linkfix': {
        method: 'POST',
        parameters: {
          'url': 'Single URL to fix',
          'text': 'Text containing multiple URLs to fix', 
          'username': 'Custom Discord username (optional)'
        },
        examples: {
          single_url: '{ "url": "https://twitter.com/user/status/123" }',
          multiple_urls: '{ "text": "Check this https://reddit.com/r/funny and this https://twitter.com/user/status/456" }'
        }
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 LinkFix server running on port ${PORT}`);
  console.log(`📝 Supported platforms: ${Object.keys(PLATFORM_REPLACEMENTS).join(', ')}`);
});