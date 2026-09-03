# OLOS Gaming Smart Contracts

## Overview
The OLOS Gaming platform smart contracts provide a secure, decentralized infrastructure for competitive gaming with staking, escrow, and automated payouts. The system consists of three core contracts that work together to manage matches, handle player stakes, and maintain on-chain statistics.

## Architecture

### Core Contracts

1. **GVTToken** (`GVTToken.sol`)
   - ERC20 token with 18 decimals
   - Maximum supply: 1 billion GVT
   - Mintable by authorized MINTER_ROLE (for beta distribution)
   - Pausable transfers with emergency circuit breaker

2. **OlosEscrow** (`OlosEscrow.sol`)
   - Match creation and staking management
   - ECDSA-verified result submission
   - Automated payout distribution with 5% platform fee
   - Timeout-based match cancellation
   - Reentrancy protection and access control

3. **OlosMatchRegistry** (`OlosMatchRegistry.sol`)
   - On-chain match history storage
   - Player statistics and leaderboard data
   - Paginated match history queries

### Contract Interaction Flow

```
Player1 creates match → Escrow tokens → Player2 joins → Game played → 
Backend signs result → Result submitted → Payout distributed → 
Match recorded in Registry
```

## Security Features

- **Reentrancy Protection**: All state-changing functions use `ReentrancyGuard`
- **Access Control**: Role-based permissions (Admin, Minter, Pauser, Fee Withdrawer, Result Signer)
- **Signature Verification**: All results require backend ECDSA signatures
- **Replay Protection**: Each result hash can only be used once
- **Emergency Pause**: Circuit breaker for emergency situations
- **Safe Token Handling**: `SafeERC20` for all token transfers
- **Input Validation**: Comprehensive checks for addresses, amounts, and states

## Deployment

### Sepolia Testnet (Current)
All contracts are deployed and verified on Sepolia Testnet:

| Contract | Address | Status |
|----------|---------|--------|
| **GVTToken** | `0xDE0Bd309CbCaf5E6fBc7e05660E7BCb83520C3fC` | ✅ Verified |
| **OlosMatchRegistry** | `0x36206DA73098ca9CcD0963E6416F5A777b4D7B76` | ✅ Verified |
| **OlosEscrow** | `0xb13Cf72a4c1C2Da55e2C42E27E8Bd859C9f2A800` | ✅ Verified |

### Deployment Details
- **Network**: Sepolia Testnet
- **Deployer**: `0x329843dD1d87FA2c793A6554d997CBb97676D4cb`
- **Deployment Date**: 2026-03-16

For full deployment details, see [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Hardhat CLI

### Installation
```bash
npm install
```

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### TypeScript Support
For TypeScript development setup, see [SETUP.md](./SETUP.md)

## Game Integration

### Supported Games
- 0: Snake (HIGH_SCORE)
- 1: Jumping Jack (HIGH_SCORE) 
- 2: Bounce (HIGH_SCORE)
- 3: Tetris (HIGH_SCORE)
- 4: Chess (WIN_LOSS)
- 5: Checkers (WIN_LOSS)

### Match Creation
```solidity
// Create a 1v1 match with 100 GVT stake
bytes32 matchId = escrow.createMatch(
    0,                    // Snake game
    GameMode.ONE_V_ONE,
    ResultType.HIGH_SCORE,
    ethers.parseEther("100")
);
```

### Result Submission
Results must be signed by the backend with `RESULT_SIGNER_ROLE`:
```solidity
struct MatchResult {
    bytes32 matchId;
    address winner;
    uint256 player1Score;
    uint256 player2Score;
    uint256 duration;
}

// Backend signs the result hash
bytes32 resultHash = escrow.getResultHash(result);
bytes memory signature = backendSign(resultHash);

// Submit signed result
escrow.submitResult(result, signature);
```

## Fees & Economics

- **Platform Fee**: 5% of total pot
- **Minimum Stake**: 1 GVT (for staked matches)
- **Free Practice**: 0 stake allowed for solo practice
- **Fee Distribution**: Accumulated fees can be withdrawn to treasury by `FEE_WITHDRAWER_ROLE`

## Test Coverage

✅ **75 tests passing** covering:
- Token minting and transfers
- Match creation and joining
- Result submission with signatures
- Payout distribution
- Fee calculations
- Security edge cases
- Contract deployment validation

## Directory Structure

```
contracts/
├── core/
│   ├── OlosEscrow.sol          # Main escrow contract
│   └── OlosMatchRegistry.sol   # Match history registry
├── token/
│   └── GVTToken.sol            # Gaming token
├── interfaces/
│   └── IOlosEscrow.sol         # Escrow interface
└── libraries/
    └── OlosTypes.sol           # Shared data types

test/
└── Olos.test.ts                # Comprehensive test suite

scripts/
└── deploy.ts                   # Deployment script

deployments/
└── sepolia.json                # Deployment manifest
```

## Next Steps

1. **Mainnet Deployment**: Deploy to Ethereum mainnet after final testing
2. **Frontend Integration**: Connect to web3 wallet and contract interfaces
3. **Backend Services**: Implement result signing service
4. **Monitoring**: Set up contract event monitoring
5. **Analytics**: Track platform usage and statistics

## License
MIT License - See [LICENSE](./LICENSE) file for details.