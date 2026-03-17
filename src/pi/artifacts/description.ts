/**
 * Tool description for the artifacts tool. Can be extended later with runtime provider descriptions.
 */
export const ARTIFACTS_TOOL_DESCRIPTION = `# Artifacts

Create and manage persistent files that live alongside the conversation.

## When to Use
- Use this tool only when the user needs a persistent file or explicitly asks to create, save, update, or manage one.
- Good fits: markdown notes, documentation, html apps, json/csv data files, svg/code files the user should keep.
- Prefer a normal chat response for greetings, simple Q&A, short explanations, brainstorming, and ordinary conversation.

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
