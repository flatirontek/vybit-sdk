# Integration Tests

This directory contains integration tests for the Vybit SDK against the Developer API.

## Running Tests

```bash
# Set your API credentials
export VYBIT_API_KEY='your-api-key-here'

# Run the complete API coverage test
node tests/test-api-complete-coverage.js
```

## Test Requirements

- Valid Vybit API key from https://developer.vybit.net
- Node.js 16+ with node-fetch support
- Network access to the Vybit API

## Tests Included

- **test-api-complete-coverage.js** - Comprehensive test suite covering:
  - All Developer API endpoints
  - Success scenarios
  - Error scenarios (400, 401, 403, 404)
  - New endpoints: trigger, sendToOwner, sendToGroup

## Notes

These are integration tests, not unit tests. They require an actual API server and will:
- Create temporary test resources (vybits, subscriptions, peeps)
- Clean up after themselves
- May trigger actual notifications during testing
