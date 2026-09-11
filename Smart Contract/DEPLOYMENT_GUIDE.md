# Deployment Guide

This guide covers deploying the OLOS smart contracts to various networks.

## Prerequisites

### Environment Setup
1. **Node.js 18+** and **npm** installed
2. **Hardhat** configured (already in project)
3. **Wallet** with testnet/mainnet funds
4. **API Keys** for block explorers (Etherscan, etc.)

### Required Environment Variables
Create a `.env` file in the project root:

```bash
# Network RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY

# Private keys (never commit these!)
DEPLOYER_PRIVATE_KEY=0x...
ADMIN_PRIVATE_KEY=0x...
RESULT_SIGNER_PRIVATE_KEY=0x...

# Block explorer API keys
ETHERSCAN_API_KEY=your_etherscan_key
```

## Network Configurations

### Sepolia Testnet (Current)
- **Chain ID**: 11155111
- **Block Explorer**: https://sepolia.etherscan.io
- **Use Case**: Testing and development

### Ethereum Mainnet
- **Chain ID**: 1
- **Block Explorer**: https://etherscan.io
- **Use Case**: Production deployment

### Other Networks
Add network configurations to `hardhat.config.ts` as needed.

## Deployment Script

The deployment script (`scripts/deploy.ts`) handles:

1. **Contract Deployment** in correct order
2. **Role Setup** between contracts
3. **Initial Configuration** (minting, approvals)
4. **Verification** on block explorer

### Deployment Order
1. **GVTToken** - Deployed first with admin address
2. **OlosMatchRegistry** - Deployed with admin address  
3. **OlosEscrow** - Deployed with token address, admin, and result signer
4. **Role Configuration** - Grant MINTER_ROLE to escrow, RECORDER_ROLE to escrow
5. **Initial Minting** - Optional test minting

## Step-by-Step Deployment

### 1. Prepare Deployment

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests to ensure everything works
npx hardhat test
```

### 2. Configure Deployment Parameters

Edit `scripts/deploy.ts` if needed:
- Admin address
- Result signer address
- Initial token mint amounts
- Treasury address for fee withdrawals

### 3. Deploy to Sepolia (Testnet)

```bash
# Deploy all contracts
npx hardhat run scripts/deploy.ts --network sepolia
```

The script will:
- Deploy contracts in correct order
- Set up inter-contract permissions
- Perform initial configuration
- Save deployment addresses to `deployments/sepolia.json`

### 4. Verify Contracts

```bash
# Verify GVTToken
npx hardhat verify --network sepolia <GVT_TOKEN_ADDRESS> <ADMIN_ADDRESS>

# Verify OlosMatchRegistry
npx hardhat verify --network sepolia <REGISTRY_ADDRESS> <ADMIN_ADDRESS>

# Verify OlosEscrow
npx hardhat verify --network sepolia <ESCROW_ADDRESS> <GVT_TOKEN_ADDRESS> <ADMIN_ADDRESS> <RESULT_SIGNER_ADDRESS>
```

### 5. Post-Deployment Setup

After deployment:

1. **Save Deployment Info**: Record addresses in your application config
2. **Configure Backend**: Set result signer private key in backend service
3. **Setup Frontend**: Update contract addresses in frontend
4. **Test Integration**: Create test matches and results

## Production Deployment (Mainnet)

### Pre-Deployment Checklist

- [ ] **Security Audit**: Complete independent security review
- [ ] **Test Coverage**: All 75 tests passing
- [ ] **Gas Optimization**: Review and optimize gas costs
- [ ] **Disaster Recovery**: Plan for emergencies (pause, migration)
- [ ] **Team Training**: Ensure team understands contract operations
- [ ] **Monitoring Setup**: Event monitoring and alerting

### Mainnet Deployment Commands

```bash
# Dry run on testnet first
npx hardhat run scripts/deploy.ts --network sepolia

# Deploy to mainnet
npx hardhat run scripts/deploy.ts --network mainnet

# Verify contracts
npx hardhat verify --network mainnet <ADDRESSES...>
```

### Critical Security Notes

1. **Private Keys**: Never commit private keys to version control
2. **Multi-sig**: Consider using multi-sig for admin functions in production
3. **Role Management**: Plan for role rotation and emergency access
4. **Pause Function**: Test pause/unpause functionality before mainnet
5. **Fund Recovery**: Ensure cancelMatch works while paused

## Contract Upgrade Considerations

The current contracts are **not upgradeable**. For future upgrades:

### Option 1: New Deployment
- Deploy new contract versions
- Migrate state (if possible)
- Update integrations

### Option 2: Proxy Pattern (Future)
- Use OpenZeppelin Upgradeable contracts
- Requires initial proxy deployment
- More complex but allows in-place upgrades

## Deployment Manifest

After successful deployment, a manifest file is created at `deployments/sepolia.json` (or `deployments/mainnet.json`):

```json
{
  "network": "sepolia",
  "deployer": "0x...",
  "timestamp": "2026-03-16T...",
  "contracts": {
    "GVTToken": {
      "address": "0x...",
      "transactionHash": "0x...",
      "blockNumber": 12345678
    },
    "OlosMatchRegistry": {
      "address": "0x...",
      "transactionHash": "0x...",
      "blockNumber": 12345679
    },
    "OlosEscrow": {
      "address": "0x...",
      "transactionHash": "0x...",
      "blockNumber": 12345680
    }
  },
  "roles": {
    "admin": "0x...",
    "resultSigner": "0x...",
    "feeWithdrawer": "0x..."
  }
}
```

## Troubleshooting

### Common Issues

**"Nonce too low"**
- Wait for previous transactions to confirm
- Reset metamask/wallet connection

**"Insufficient funds"**
- Ensure wallet has enough ETH for gas
- Check gas price settings

**Verification fails**
- Wait 1-2 minutes after deployment for block explorer indexing
- Ensure constructor arguments are correct
- Try with `--constructor-args` parameter

**Contract interactions fail**
- Check contract addresses are correct
- Verify roles are properly configured
- Ensure token approvals are set

### Emergency Procedures

1. **Pause Contracts**: Use `pause()` function (PAUSER_ROLE)
2. **Cancel Matches**: Players can cancel pending matches
3. **Withdraw Fees**: Admin can withdraw accumulated fees
4. **Contact**: Have team contact information ready

## Maintenance

### Regular Checks
- Monitor contract events for unusual activity
- Track gas usage and optimize if needed
- Update dependencies regularly
- Review security best practices

### Documentation Updates
- Update README with new deployment info
- Maintain API documentation
- Keep deployment records

## Support

For deployment issues:
1. Check the [SETUP.md](./SETUP.md) for development setup
2. Review test logs for contract behavior
3. Consult the [API.md](./API.md) for contract interfaces
4. Check deployment manifest for addresses

Remember: Test thoroughly on testnet before any mainnet deployment.