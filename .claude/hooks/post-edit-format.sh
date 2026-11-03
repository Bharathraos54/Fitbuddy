#!/bin/bash
# Hook: PostToolUse — auto-format files after Claude edits them
# Triggered by: Edit, Write, MultiEdit tool calls

# Claude Code passes the tool call as JSON on stdin
FILE=$(jq -r '.tool_input.file_path // empty')

# Only format TypeScript/JavaScript/JSON files
if [[ "$FILE" =~ \.(ts|tsx|js|jsx|json)$ ]]; then
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  command -v npx >/dev/null || exit 0

  cd "$CLAUDE_PROJECT_DIR" || exit 0
  npx prettier --write "$FILE" --log-level silent
fi
