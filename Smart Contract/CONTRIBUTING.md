# Contributing to OLOS Smart Contracts

Thank you for your interest in contributing to the OLOS gaming smart contracts! This document provides guidelines and instructions for contributing.

## Development Workflow

### 1. Fork and Clone
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR-USERNAME/olos-smart-contracts.git
cd olos-smart-contracts

# Add upstream remote
git remote add upstream https://github.com/olos-gaming/smart-contracts.git
```

### 2. Setup Development Environment
```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
```

### 3. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 4. Make Changes
- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed

### 5. Run Tests
```bash
# Run all tests
npx hardhat test

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test

# Run specific test file
npx hardhat test test/Olos.test.ts
```

### 6. Commit Changes
```bash
git add .
git commit -m "feat: add new feature description"
```

### 7. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
# Create PR on GitHub
```

## Code Style Guidelines

### Solidity
- Use SPDX license identifier at the top of each file
- Follow Solidity style guide (https://docs.soliditylang.org/en/latest/style-guide.html)
- Use descriptive function and variable names
- Add NatSpec comments for public functions
- Group related functions with comments

### TypeScript/JavaScript
- Use TypeScript for all test files
- Follow ESLint configuration
- Use async/await for async operations
- Add type annotations for clarity

### Documentation
- Update README.md for significant changes
- Add comments for complex logic
- Document security considerations
- Update API documentation if interfaces change

## Testing Guidelines

### Writing Tests
- Test all public functions
- Include edge cases and error conditions
- Test security scenarios (reentrancy, access control)
- Verify event emissions
- Test with different parameter combinations

### Test Structure
```typescript
describe("ContractName — Feature", () => {
  beforeEach(async () => {
    // Setup code
  });

  it("should do something", async () => {
    // Test code
  });

  it("should revert when condition", async () => {
    await expect(contract.function()).to.be.revertedWith("Error message");
  });
});
```

### Gas Optimization
- Run gas reports: `REPORT_GAS=true npx hardhat test`
- Consider gas costs when adding new features
- Look for optimization opportunities in loops and storage

## Security Considerations

### Before Submitting
- Review for common vulnerabilities (reentrancy, overflow, etc.)
- Test access control thoroughly
- Verify signature validation logic
- Check for proper input validation

### Security Checklist
- [ ] No unprotected external calls
- [ ] Proper access control checks
- [ ] Input validation on all parameters
- [ ] Safe math operations
- [ ] No storage collisions
- [ ] Event emissions for state changes
- [ ] Proper error messages

## Pull Request Process

### PR Requirements
1. **Clear Description**: Explain what changes were made and why
2. **Tests Pass**: All existing and new tests must pass
3. **Code Coverage**: Maintain or improve test coverage
4. **Documentation**: Update relevant documentation
5. **Security Review**: Address any security concerns

### PR Review Process
1. Automated checks run (tests, linting)
2. Maintainers review code
3. Security review performed
4. Feedback provided if needed
5. PR merged after approval

## Project Structure

```
contracts/
├── core/           # Main contracts (Escrow, Registry)
├── token/          # Token contracts
├── interfaces/     # Contract interfaces
└── libraries/      # Shared libraries and types

test/              # Test files
scripts/           # Deployment and utility scripts
deployments/       # Deployment manifests

docs/              # Documentation
├── API.md         # API documentation
├── DEPLOYMENT_GUIDE.md
└── INTEGRATION_EXAMPLES.md
```

## Adding New Features

### Smart Contract Features
1. **Design**: Plan contract architecture and interactions
2. **Implement**: Write Solidity code with tests
3. **Test**: Comprehensive test coverage
4. **Review**: Security and code review
5. **Document**: Update API and integration docs

### Tooling Improvements
1. **Proposal**: Describe the improvement
2. **Implementation**: Add/update tooling
3. **Testing**: Verify functionality
4. **Documentation**: Update setup guides

## Bug Reports

### Reporting Bugs
When reporting bugs, please include:
1. **Description**: What happened vs what was expected
2. **Steps**: How to reproduce the issue
3. **Environment**: Network, contract versions, etc.
4. **Error Messages**: Console output or transaction hashes

### Bug Fix Process
1. **Reproduce**: Confirm the issue exists
2. **Fix**: Implement solution
3. **Test**: Add tests to prevent regression
4. **Document**: Update changelog if needed

## Questions and Support

### Getting Help
- Check existing documentation first
- Review test examples for usage patterns
- Search existing issues for similar questions

### Community
- Join discussions in GitHub issues
- Participate in code reviews
- Share ideas for improvements

## License

By contributing, you agree that your contributions will be licensed under the MIT License. See [LICENSE](./LICENSE) for details.

## Acknowledgments

Thank you for contributing to making OLOS gaming more secure, efficient, and feature-rich!