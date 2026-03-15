#!/bin/bash
# Hook: PostToolUse — auto-format files after Claude edits them
# Triggered by: Edit, Write, MultiEdit tool calls

# Get the file path from Claude Code's environment
FILE="$CLAUDE_TOOL_INPUT_FILE_PATH"

# Only format TypeScript/JavaScript/JSON files
if [[ "$FILE" =~ \.(ts|tsx|js|jsx|json)$ ]]; then
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

  cd "/Users/bharathraos/Documents/AI/My first AI project/gym-diet-tracker"
  npx prettier --write "$FILE" --log-level silent
fi
