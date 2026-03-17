/**
 * Tool description for the artifacts tool. Can be extended later with runtime provider descriptions.
 */
export const ARTIFACTS_TOOL_DESCRIPTION = `# Artifacts

Create and manage persistent files that live alongside the conversation.

## When to Use
- Writing research summaries, analysis, ideas, documentation
- Creating markdown notes for the user to read
- Building HTML applications/visualizations that present data

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
