const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(process.cwd(), '.agent-logs');
const SESSION_ID_FILE = path.join(process.cwd(), '.claude', 'session_id');

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

let sessionId = fs.existsSync(SESSION_ID_FILE)
    ? fs.readFileSync(SESSION_ID_FILE, 'utf8').trim()
    : require('crypto').randomUUID();

if (!fs.existsSync(SESSION_ID_FILE)) {
    fs.writeFileSync(SESSION_ID_FILE, sessionId);
}

const date = new Date();
const dateStr = date.toISOString().split('T')[0];
const fileName = `${dateStr}_${date.toISOString().replace(/[:.] /g, '-').slice(0, 19).replace('T', '_')}_${sessionId.slice(0, 8)}.md`;
const logFilePath = path.join(LOG_DIR, fileName);

const eventType = process.argv[2]; // 'prompt' or 'end-of-turn'
let content = '';

if (eventType === 'prompt') {
    content = process.argv.slice(3).join(' ');
} else if (eventType === 'end-of-turn') {
    // For end-of-turn, the transcript is passed on stdin
    content = require('fs').readFileSync(0, 'utf8');
    // We need the final response. The transcript contains the whole turn.
    // A simple way to get the final response is to look for the last model output.
    const parts = content.split(/<tool_use| <thought/);
    content = parts[parts.length - 1].trim();
}

const timestamp = new Date().toISOString();
const model = 'gemma4:cloud';

let logEntry = '';
if (eventType === 'prompt') {
    logEntry = `\n\n[LOG_ENTRY type=PROMPT num=?? session=${sessionId.slice(0, 8)}]\ntimestamp: ${timestamp}\nmodel: ${model}\n\n${content}\n`;
} else {
    logEntry = `\n\n[LOG_ENTRY type=RESPONSE num=?? session=${sessionId.slice(0, 8)}]\ntimestamp: ${timestamp}\nmodel: ${model}\n\n${content}\n`;
}

// Initialize file with header if it doesn't exist
if (!fs.existsSync(logFilePath)) {
    const header = `---
session_id: ${sessionId}
date: ${dateStr}
author: claude-code-user
model: ${model}
tool: claude-code
project: clone-fathom
total_exchanges: 0
first_prompt_time: ${timestamp}
last_prompt_time: ${timestamp}
---

# Session Log - ${dateStr}

Session: \`${sessionId.slice(0, 8)}\` | Project: \`clone-fathom\` | Author: \`claude-code-user\`

---
`;
    fs.writeFileSync(logFilePath, header);
}

fs.appendFileSync(logFilePath, logEntry);
