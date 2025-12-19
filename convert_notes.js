const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const notionHtmlPath = path.join(__dirname, 'data/notion.html');
const notesJsPath = path.join(__dirname, 'data/notes.js');

try {
    const htmlContent = fs.readFileSync(notionHtmlPath, 'utf8');
    const dom = new JSDOM(htmlContent);
    const doc = dom.window.document;

    const notes = [];
    let currentNote = null;

    const blocks = doc.body.children;

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];

        // Check for Date Header (New Note)
        if (block.classList.contains('notion-sub_header-block')) {
            if (currentNote) {
                notes.push(currentNote);
            }
            const dateText = block.textContent.trim();
            currentNote = {
                title: "Journal Entry", // Or just use the date as title? usage in app.js suggests title + date
                date: dateText,
                id: `note-${notes.length}`,
                contentParts: []
            };
        } else if (currentNote) {
            // Process content blocks
            if (block.classList.contains('notion-text-block')) {
                const text = block.textContent.trim();
                if (text) {
                    // Basic link handling if needed, but innerHTML preserves basic structure
                    // We need to be careful about preserving notion's internal html structure if it has links
                    // defined.
                    // The viewer code in app.js expects a 'content' string.
                    // converting notion block to simple HTML.
                    // The notion html uses a lot of nested divs. valid, but we want clean <p>
                    // actually, notion export usually has links in <a> tags inside.
                    // Let's use the innerHTML of the content node.
                    const contentNode = block.querySelector('.content-editable-leaf-rtl') || block;
                    // Replace div lines with p or br? Notion export is weird.
                    // Let's just wrap the innerHTML in a <p>
                    currentNote.contentParts.push(`<p>${contentNode.innerHTML}</p>`);
                }
            } else if (block.classList.contains('notion-image-block')) {
                const img = block.querySelector('img');
                if (img) {
                    // Fix encoded src if necessary, but usually browser handles it.
                    // Notion export images might be localized or remote. 
                    // Looking at the view_file output: src="https://www.notion.so/image/..."
                    // We can keep it.
                    // app.js styles images with max-width: 100% so simple img tag is fine.
                    currentNote.contentParts.push(`<div class="image-wrapper"><img src="${img.src}" alt="Note Image" loading="lazy" /></div>`);
                }
            } else if (block.classList.contains('notion-code-block')) {
                const code = block.textContent; // Get text content to avoid html inside code
                // Actually notion code blocks have syntax highlighting spans.
                // let's try to preserve it or just wrap in <pre>
                // The view_file output shows structure: .line-numbers.notion-code-block
                const codeContent = block.querySelector('.notion-code-block');
                if (codeContent) {
                    // Use innerHTML to keep colors if possible, but style.css might not support notion classes.
                    // Safest is <pre><code>text</code></pre>
                    // But user said "KEEP THE FORMATTING". 
                    // The notion.html had styles in the head. notes.js content is injected into index.html
                    // which does NOT have notion styles.
                    // So we should probably just use text and let a highlighter handle it, OR strip styles.
                    // User's style.css has no code highlighting.
                    // Let's stick to simple pre/code for now.
                    currentNote.contentParts.push(`<pre class="code-block"><code>${codeContent.textContent}</code></pre>`);
                }
            } else if (block.classList.contains('notion-selectable')) {
                // Catch all other blocks (lists, quotes)
                // blockquote
                if (block.querySelector('blockquote')) {
                    currentNote.contentParts.push(block.innerHTML);
                }
            }
        }
    }

    // Push last note
    if (currentNote) {
        notes.push(currentNote);
    }

    // Join content parts
    const finalNotes = notes.map(n => ({
        ...n,
        content: n.contentParts.join('\n'),
        title: n.date // The headers seem to be dates mostly.
    })).map(({ contentParts, ...rest }) => rest);


    const jsContent = `// Auto-generated notes from notion.html\nconst notesData = ${JSON.stringify(finalNotes, null, 2)};`;

    fs.writeFileSync(notesJsPath, jsContent);
    console.log(`Successfully converted ${finalNotes.length} notes.`);

} catch (e) {
    console.error(e);
}
