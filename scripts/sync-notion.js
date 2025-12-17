// scripts/sync-notion.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const NOTION_URL = 'https://www.notion.so/Daily-s-1cc5c50f89fb804bb90fd3acff1d361c';
const OUTPUT_PATH = path.join(__dirname, '../data/notion.html');

(async () => {
    console.log(`Launching headless browser to sync Notion...`);
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    try {
        console.log(`Navigating to ${NOTION_URL}...`);
        await page.goto(NOTION_URL, { waitUntil: 'networkidle0', timeout: 60000 });

        // Wait for the main notion content to load
        await page.waitForSelector('.notion-page-content', { timeout: 30000 });

        // Auto-scroll to trigger lazy loading of images
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });

        // Wait a bit for images to settle
        await new Promise(r => setTimeout(r, 2000));

        console.log('Page loaded and scrolled. Extracting content...');

        // Extract the inner HTML of the Notion page content
        // We inject specific styles to match the personal website's dark theme
        const content = await page.evaluate(() => {
            const contentElement = document.querySelector('.notion-page-content');
            if (!contentElement) return '<h1>Error: Could not find content</h1>';

            // Fix Images: Convert relative paths to absolute URLs so they work locally
            const images = contentElement.querySelectorAll('img');
            images.forEach(img => {
                // img.src automatically returns the absolute URL in the browser
                // We explicitly set the attribute to this absolute URL
                if (img.src) {
                    img.setAttribute('src', img.src);
                    // Remove referrer policy to prevent blocking
                    img.removeAttribute('referrerpolicy');
                    img.loading = "eager";
                }
            });

            // Dark Mode Styles + Content
            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { 
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; 
                            padding: 20px; 
                            line-height: 1.6; 
                            color: #e0e0e0;          /* Light Text */
                            background-color: #111;  /* Dark Background */
                        }
                        img { max-width: 100%; height: auto; border-radius: 4px; }
                        h1, h2, h3 { font-weight: 600; color: #fff; }
                        a { color: #8ab4f8; text-decoration: none; }
                        a:hover { text-decoration: underline; }
                        ul, ol { padding-left: 20px; }
                        blockquote { border-left: 3px solid #555; padding-left: 10px; color: #bbb; }
                        
                        /* Fix Notion specific bg colors to be transparent or dark */
                        .notion-text-block, .notion-selectable { color: inherit !important; fill: inherit !important; }

                        /* Custom Scrollbar */
                        ::-webkit-scrollbar { width: 10px; height: 10px; }
                        ::-webkit-scrollbar-track { background: #111; }
                        ::-webkit-scrollbar-thumb { background: #444; border-radius: 5px; border: 2px solid #111; }
                        ::-webkit-scrollbar-thumb:hover { background: #666; }
                    </style>
                </head>
                <body>
                    ${contentElement.innerHTML}
                </body>
                </html>
            `;
        });

        fs.writeFileSync(OUTPUT_PATH, content);
        console.log(`Successfully synced to ${OUTPUT_PATH}`);

    } catch (error) {
        console.error('Error syncing Notion:', error);
    } finally {
        await browser.close();
    }
})();
