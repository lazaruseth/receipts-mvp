# Contributing to RECEIPTS Guard

Thank you for your interest in contributing to receipts-guard!

## Core Principles

**Local-Only Architecture**: This is non-negotiable. receipts-guard runs 100% on the user's machine with:
- Zero external API calls
- No cloud storage
- No network requests
- No telemetry

Any PR that adds external dependencies will be rejected.

## How to Report Issues

1. **Check existing issues** first to avoid duplicates
2. **Use the issue templates** - they help us understand and fix problems faster
3. **Include environment details** - OS, Node version, OpenClaw version

## How to Request Features

1. Open a feature request issue
2. Explain the problem you're trying to solve
3. Propose a solution that stays local-only
4. Be open to discussion on implementation

## How to Submit Code

### Setup
```bash
git clone https://github.com/lazaruseth/receipts-mvp.git
cd receipts-mvp/clawhub-skill/receipts-guard
```

### Testing
```bash
# Test capture
node capture.js capture "Sample terms of service text" "https://example.com" "Test Corp"

# Verify output
cat ~/.openclaw/receipts/*.json
```

### Code Standards
- Plain JavaScript (Node.js compatible)
- No external npm dependencies (keep it lightweight)
- Clear comments for complex logic
- Consistent naming: camelCase for functions, SCREAMING_CASE for constants

### Pull Request Process
1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Test locally
5. Submit PR with clear description

## Questions?

Open an issue or reach out on X: [@Remaster_io](https://x.com/Remaster_io)

## License

MIT - See [LICENSE](LICENSE) for details.
