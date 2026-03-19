/**
 * Tool description for the artifacts tool. Artifacts = persistent files to save, not for inline display.
 */
export const ARTIFACTS_TOOL_DESCRIPTION = `# Artifacts (save as files)

Create and manage **persistent files** that are saved alongside the conversation. Use this when the user wants to **keep a file** (download, edit later, or open in the panel).

## When to Use Artifacts
- Use when the intent is to **save output as a file**: documentation, notes, exported data, code to keep, HTML/app to run as a file.
- Do NOT use for content that is only meant to be **shown once in the chat** (use the widget tool for that).
- Good fits: "save this as markdown", "create a file", "export to CSV", "give me an HTML file I can open".

## Commands
- create: Create new file. Requires filename and content.
- update: Update part of file (PREFERRED for small edits). Requires filename, old_str, new_str.
- rewrite: Replace entire file (LAST RESORT). Requires filename and content.
- get: Retrieve file content. Requires filename.
- delete: Delete file. Requires filename.
- logs: Get console logs from HTML artifact (if supported). Requires filename.

## Supported File Types
Text-based: .md, .txt, .html, .js, .css, .json, .csv, .svg, etc.

## Critical - Prefer Update Over Rewrite
- Prefer \`update\` with old_str and new_str for targeted edits (token efficient).
- Use \`rewrite\` only when replacing the entire file.`;
