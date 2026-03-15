# @vybit/cli

Command-line interface for the [Vybit](https://www.vybit.net) notification platform. Manage vybits, trigger notifications, browse sounds, and more — directly from your terminal.

Designed for both humans and AI agents: all output is structured JSON to stdout, with errors to stderr and deterministic exit codes.

## Installation

```bash
npm install -g @vybit/cli
```

## Authentication

Get your API key from [developer.vybit.net](https://developer.vybit.net).

```bash
# Option 1: Environment variable (recommended for CI/CD and agents)
export VYBIT_API_KEY='your-api-key'

# Option 2: Config file (~/.config/vybit/config.json)
vybit auth setup --api-key 'your-api-key'

# Option 3: Per-command flag
vybit --api-key 'your-api-key' vybits list
```

Credentials are resolved in order: CLI flag > environment variable > config file.

## Usage

```bash
# List your vybits
vybit vybits list

# Create a vybit
vybit vybits create --name "Deploy Alert"

# Trigger a notification
vybit trigger <vybit-key> --message "Build passed"

# Search sounds
vybit sounds list --search "bell"

# Check usage
vybit meter

# Quiet mode — output only keys/IDs (useful for scripting)
vybit vybits list -q
vybit trigger <key> --message "$(git log -1 --oneline)" -q
```

## Commands

| Command | Operations |
|---------|-----------|
| `vybit vybits` | `list`, `get`, `create`, `update`, `delete` |
| `vybit trigger` | Trigger a vybit notification |
| `vybit reminders` | `list`, `create`, `update`, `delete` |
| `vybit sounds` | `list`, `get` |
| `vybit subscriptions` | `list`, `get`, `create`, `update`, `delete` |
| `vybit browse` | `list`, `get` (public vybits) |
| `vybit logs` | `list`, `get`, `vybit`, `subscription` |
| `vybit peeps` | `list`, `get`, `create`, `delete`, `vybit` |
| `vybit meter` | API usage metrics |
| `vybit status` | API health check |
| `vybit profile` | User profile info |
| `vybit auth` | `setup`, `status`, `logout` |

Use `vybit <command> --help` for detailed options on any command.

## Output

- **Default**: Pretty-printed JSON to stdout
- **`--quiet` / `-q`**: Only keys/IDs (one per line for lists)
- **Errors**: Structured JSON (`{"error":"...","statusCode":404}`) to stderr

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | API or general error |
| 2 | Authentication error |

## Image URL Requirements

All `--image-url` values must be direct links ending in `.jpg`, `.jpeg`, `.png`, or `.gif`. Dynamic image URLs (e.g., Unsplash `?w=400`) will not render in push notifications.

## Links

- [Vybit Developer Portal](https://developer.vybit.net)
- [API Reference](https://developer.vybit.net/api-reference)
- [Vybit SDK Monorepo](https://gitlab.com/flatirontek/vybit-sdk)

## License

MIT
