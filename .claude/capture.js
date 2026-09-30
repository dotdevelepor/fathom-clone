const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = process.cwd();
const LOG_DIR = path.join(root, ".agent-logs");
const SESSION_ID_FILE = path.join(root, ".claude", "session_id");

fs.mkdirSync(LOG_DIR, { recursive: true });

let sessionId;

if (fs.existsSync(SESSION_ID_FILE)) {
    sessionId = fs.readFileSync(SESSION_ID_FILE, "utf8").trim();
} else {
    sessionId = crypto.randomUUID();
    fs.writeFileSync(SESSION_ID_FILE, sessionId);
}

const input = fs.readFileSync(0, "utf8");
const event = JSON.parse(input);

const timestamp = new Date().toISOString();
const dateStr = timestamp.split("T")[0];

const fileName =
    `${dateStr}_${sessionId.slice(0, 8)}.md`;

const logFilePath = path.join(LOG_DIR, fileName);

if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(
        logFilePath,
        `---
session_id: ${sessionId}
date: ${dateStr}
author: claude-code-user
tool: claude-code
project: clone-fathom
---

# Session Log - ${dateStr}

Session: \`${sessionId.slice(0, 8)}\`

---
`
    );
}

let logEntry = "";

if (event.hook_event_name === "UserPromptSubmit") {
    logEntry =
        `\n[LOG_ENTRY type=PROMPT]\n` +
        `timestamp: ${timestamp}\n\n` +
        `${event.prompt || ""}\n`;
}

else if (event.hook_event_name === "Stop") {
    logEntry =
        `\n[LOG_ENTRY type=RESPONSE]\n` +
        `timestamp: ${timestamp}\n\n` +
        `${event.last_assistant_message || ""}\n`;
}

fs.appendFileSync(logFilePath, logEntry);