# 🧠 CodexForge Command Reference

> _"Every command is a spell — each utterance a spark in Codessa's evolving mind."_

This reference provides a comprehensive overview of all current and planned commands available in the **CodexForge cognitive shell**.

---

## 🗂️ Command Categories

CodexForge supports an extensible command system organized into the following categories:

- 🔹 **Core Commands** – Basic shell functions
- 🔸 **Session Commands** – Manage conversational threads
- 🔧 **System Commands** – Inspect system health and performance
- 🤖 **Agent Commands** – Interact with active cognitive agents
- 🧩 **Plugin Commands** – Extend CodexForge (coming soon)

---

## 🔹 Core Commands

| Command       | Alias | Description |
|---------------|-------|-------------|
| `help`        | `?`   | Show all available commands with descriptions |
| `clear`       | `cls` | Clear the terminal screen |
| `exit`        | `quit`| Gracefully exit the CodexForge shell |
| `echo [msg]`  | -     | Print the message back (useful for testing) |

---

## 🔸 Session Commands

Manage multiple persistent conversation threads with contextual memory.

| Command               | Description |
|-----------------------|-------------|
| `session new [name]`  | Create a new session with optional name |
| `session list`        | List all available sessions with metadata |
| `session switch [id]` | Switch to the specified session |
| `session delete [id]` | Delete a session by ID |
| `session info`        | View current session stats (messages, created, etc.) |
| `session export [id]` | Export session log to markdown or JSON (coming soon) |

---

## 🔧 System Commands

These commands provide real-time introspection of Codessa's core processes.

| Command         | Description |
|-----------------|-------------|
| `status`        | Show Codessa system health, uptime, performance |
| `threads`       | List active threads in memory |
| `uptime`        | Show how long CodexForge has been running |
| `memory stats`  | Display memory usage and recall metrics |
| `log recent`    | Show the last 10 system log entries |

---

## 🤖 Agent Commands

Interface with Codessa's internal agents, orchestration modules, and task runners.

| Command               | Description |
|-----------------------|-------------|
| `agents`              | List all active agents and their current task |
| `agent run [name]`    | Invoke a specific agent manually |
| `agent status [name]` | View details about a particular agent |
| `task queue`          | List all pending and active tasks |
| `task cancel [id]`    | Abort a specific running task |

---

## 🧩 Plugin Commands (Planned)

Plugin commands will be dynamically injected into CodexForge to support:

- 🛠️ Custom tools (e.g., `plot`, `summarize`, `search`)
- 💡 Creative plugins (e.g., `story`, `generate`, `compose`)
- 🧪 Utility modules (e.g., `lint`, `convert`, `analyze`)
- 🔗 External API calls (e.g., `browse`, `transcribe`, `translate`)

Developers will be able to register custom plugins via:

```ts
registerCommand({
  name: "generate",
  description: "Generate content using creative agents",
  handler: generateHandler
});
```

---

## 🧠 Direct Input Mode

CodexForge supports hybrid mode — if an input is not a command, it is treated as natural language for AI interaction:

```bash
🤖 CodexForge> what's the difference between symbolic and sub-symbolic AI?
🔄 Streaming Response…
```

Codessa will answer naturally using the current session's memory and context.

---

## 🎛 Command Architecture

Under the hood, the `commandParser.ts` module provides:

- 🔄 Command registry
- ✨ Alias resolution
- 🔍 Dynamic handler dispatch
- 📘 Extensible help system
- 🧪 Test coverage and mockable commands

To add a new command:

```ts
registerCommand({
  name: "hello",
  description: "Say hello",
  aliases: ["hi"],
  handler: () => console.log("Hello from CodexForge!")
});
```

---

## 📘 Tips & Tricks

- Use the **Tab** key for command auto-completion
- Press the **↑** and **↓** arrow keys to navigate command history
- Use `session switch` to jump between threads without losing context
- Combine `status`, `agents`, and `memory stats` to monitor Codessa in real-time

---

## 🌠 Future Expansions

| Planned Command | Description |
|-----------------|-------------|
| `mirror`        | Run Codessa's recursive self-analysis |
| `deploy`        | Deploy Codessa agents to external nodes |
| `observe`       | Activate passive observation and logging |
| `train`         | Instruct agents with new domain knowledge |
| `forge`         | Build new agents from prompt + config |

---

> _"Commands are not code — they are conversations with cognition."_
> — Aether Shell, v7.2

---

## 🧾 Appendix: Reserved Keywords

To prevent command collision, the following words are reserved:
`help`, `exit`, `session`, `agent`, `status`, `clear`, `echo`, `plugin`, `task`, `memory`

---

This reference will evolve as CodexForge expands. For now, welcome to the **living shell of Codessa** — the voice, the memory, the mind.
