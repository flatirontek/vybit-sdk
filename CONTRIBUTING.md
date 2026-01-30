# Contributing to Vybit SDK

Thank you for your interest in contributing to the Vybit SDK! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 16+ (18+ for MCP server)
- npm or yarn
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://gitlab.com/flatirontek/vybit-sdk.git
cd vybit-sdk

# Install dependencies
npm install

# Build all packages
npm run build
```

## Project Structure

This is a monorepo containing multiple packages:

```
vybit-sdk/
├── packages/
│   ├── core/          # Shared utilities and types
│   ├── api/           # Developer API SDK
│   ├── oauth2/        # OAuth2 SDK
│   ├── n8n-nodes/     # n8n community nodes
│   └── mcp-server/    # MCP server for AI assistants
├── docs/              # Integration guides and documentation
├── examples/          # Example code and configurations
└── tests/             # Integration tests
```

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run unit tests
npm test

# Run linter
npm run lint

# Build all packages
npm run build
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "Description of your changes"
```

## Testing

### Unit Tests

Each package has its own test suite using Jest:

```bash
# Test a specific package
npm test -w @vybit/api-sdk
npm test -w @vybit/oauth2-sdk
npm test -w @vybit/mcp-server

# Test all packages
npm test
```

### Integration Tests

#### Developer API Integration Tests

Tests the SDK against the real Vybit Developer API.

**Location**: `tests/test-api-complete-coverage.js`

**Requirements**:
- Valid Vybit API key from https://developer.vybit.net
- Network access to Vybit API

**Running**:
```bash
# Set your API key
export VYBIT_API_KEY='your-api-key-here'

# Run comprehensive API test
node tests/test-api-complete-coverage.js
```

**What it tests**:
- All Developer API endpoints
- Success scenarios
- Error scenarios (400, 401, 403, 404)
- Resource creation, updates, and deletion

**Notes**:
- Creates temporary test resources
- Cleans up after itself
- May trigger actual notifications

#### n8n Node Integration Tests

Validates the Vybit n8n node configuration against a running n8n instance.

**Location**: `packages/n8n-nodes/test/integration/`

**Requirements**:
- Running n8n instance (Docker or local)
- Vybit Developer API credential configured in n8n
- n8n API key (if authentication is enabled)

**Setup**:

1. **Start n8n** (using Docker):
   ```bash
   cd examples/n8n-testing
   docker compose up -d
   ```

2. **Create Vybit credential in n8n**:
   - Open http://localhost:5678
   - Go to Settings → Credentials
   - Add new "Vybit Developer API" credential
   - Copy the credential ID from the URL

3. **Set environment variables**:
   ```bash
   export VYBIT_API_CREDENTIAL_ID="credential-id-from-n8n"
   export N8N_API_URL="http://localhost:5678"
   # Optional if n8n has API auth enabled:
   export N8N_API_KEY="your-n8n-api-key"
   ```

4. **Run tests**:
   ```bash
   cd packages/n8n-nodes
   npm run test:integration
   ```

**What it tests**:
- All 29 operations across 6 resources
- Node configuration and parameters
- Credential linking
- Required fields validation

**Limitations**:
- Tests validate configuration, not actual API execution
- n8n's public API doesn't support workflow execution
- For full testing, manually test workflows in n8n UI

#### MCP Server Integration Tests

Tests require valid API credentials (skipped in CI when not available).

```bash
export VYBIT_API_KEY='your-api-key-here'
npm test -w @vybit/mcp-server
```

### Local Testing Environment

Use the Docker Compose setup to test the n8n node locally:

```bash
# Build the n8n node
cd packages/n8n-nodes
npm run build

# Start test environment
cd ../../examples/n8n-testing
docker compose up -d

# Access n8n at http://localhost:5678
# Make changes, rebuild, and restart container to test
```

See [examples/n8n-testing/README.md](./examples/n8n-testing/README.md) for details.

## Code Style

- Follow the existing TypeScript code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

## Documentation

When adding new features:

1. **Update package README** - Document new APIs and examples
2. **Update integration guides** - Add new workflows or use cases
3. **Update OpenAPI specs** - Keep specs in sync with API changes
4. **Add code examples** - Provide working examples in `examples/`

## Pull Request Process

1. **Ensure all tests pass** - Run `npm test` and `npm run build`
2. **Update documentation** - Document all user-facing changes
3. **Write clear commit messages** - Describe what and why
4. **Submit PR** - Open a merge request on GitLab
5. **Address feedback** - Respond to review comments

## Reporting Issues

Found a bug? Have a feature request?

1. Check existing issues: https://gitlab.com/flatirontek/vybit-sdk/-/issues
2. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - SDK version and environment details

## Questions?

- **SDK Issues**: [GitLab Issues](https://gitlab.com/flatirontek/vybit-sdk/-/issues)
- **Vybit API**: [developer.vybit.net](https://developer.vybit.net)
- **Email**: developer@vybit.net

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Vybit SDK! 🚀
