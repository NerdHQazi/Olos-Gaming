# TypeScript Development Setup

This guide covers the TypeScript configuration for the OLOS smart contracts project. We've set up Hardhat with TypeScript support to improve development experience and type safety.

## Getting Started

### 1. Install Dependencies

First, install the project dependencies:

```bash
npm install
```

### 2. Compile Contracts and Generate Types

The contracts need to be compiled to generate TypeChain type definitions:

```bash
npx hardhat compile
```

This command does two things:
- Compiles the Solidity contracts (`GVTToken`, `OlosEscrow`, `OlosMatchRegistry`)
- Generates TypeScript type definitions in the `typechain-types/` directory

### 3. Run Tests

With types generated, you can run the test suite:

```bash
npx hardhat test
```

For gas reporting during tests:

```bash
REPORT_GAS=true npx hardhat test
```

## Development Environment

### TypeScript Configuration

We've configured `tsconfig.json` with settings optimized for Hardhat development:

- **Target**: ES2022 for modern JavaScript features
- **Module Resolution**: Node for compatibility with Hardhat
- **Type Checking**: Strict mode enabled for better safety
- **Hardhat Integration**: Includes Hardhat and Mocha type definitions

### Dependencies Added

To support TypeScript development, we've added:

- `@types/mocha` and `@types/node` - Type definitions for testing
- `@typechain/hardhat` and `@typechain/ethers-v6` - Contract type generation
- `ts-node` - TypeScript execution for Hardhat
- `typescript` - TypeScript compiler

### Common Issues and Solutions

**Issue**: Type errors about missing contract properties
**Solution**: Run `npx hardhat compile` to generate the TypeChain types. The initial stub types in `typechain-types/` are placeholders that get replaced with actual contract interfaces.

**Issue**: Import errors with ethers
**Solution**: Use `import { ethers } from "hardhat"` instead of direct ethers imports. We've configured Hardhat to provide the ethers instance with proper types.

**Issue**: Mocha test types not recognized
**Solution**: The `@types/mocha` package provides type definitions for Mocha's testing framework. Make sure tests use `describe`, `it`, `beforeEach` with proper function signatures.

## Testing Workflow

1. **Write Tests**: Create test files in the `test/` directory
2. **Generate Types**: Run `npx hardhat compile` after contract changes
3. **Run Tests**: Execute `npx hardhat test` to verify functionality
4. **Check Types**: TypeScript will catch type errors during compilation

## Project Structure

- `contracts/` - Solidity smart contracts
- `test/` - TypeScript test files
- `typechain-types/` - Generated contract interfaces (do not edit manually)
- `tsconfig.json` - TypeScript configuration
- `hardhat.config.ts` - Hardhat configuration with TypeScript support

## Tips for Development

- **Auto-compilation**: Hardhat will recompile contracts when files change
- **Type Generation**: Remember to run `npx hardhat compile` after modifying contracts
- **Test Development**: Use the existing `Olos.test.ts` as a reference for test patterns
- **Debugging**: Use `console.log` in tests (TypeScript supports this with `@types/node`)

## Next Steps

After setting up the development environment:

1. Review the contract tests in `test/Olos.test.ts`
2. Explore the generated types in `typechain-types/`
3. Check the main README for contract architecture and deployment information
4. Consider adding more tests for edge cases specific to your use case
