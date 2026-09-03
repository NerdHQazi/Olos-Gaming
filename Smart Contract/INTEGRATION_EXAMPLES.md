# Integration Examples

Practical examples for integrating with OLOS smart contracts from frontend, backend, and games.

## Frontend Integration

### 1. Setup and Connection

```typescript
import { ethers } from "ethers";
import { 
  GVTToken__factory, 
  OlosEscrow__factory,
  OlosMatchRegistry__factory 
} from "./typechain-types";

// Contract addresses (Sepolia testnet)
const CONTRACT_ADDRESSES = {
  GVT_TOKEN: "0xDE0Bd309CbCaf5E6fBc7e05660E7BCb83520C3fC",
  OLOS_ESCROW: "0xb13Cf72a4c1C2Da55e2C42E27E8Bd859C9f2A800",
  MATCH_REGISTRY: "0x36206DA73098ca9CcD0963E6416F5A777b4D7B76"
};

// Connect to contracts
async function connectContracts() {
  if (!window.ethereum) {
    throw new Error("Please install MetaMask!");
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();
  
  const gvtToken = GVTToken__factory.connect(CONTRACT_ADDRESSES.GVT_TOKEN, signer);
  const escrow = OlosEscrow__factory.connect(CONTRACT_ADDRESSES.OLOS_ESCROW, signer);
  const registry = OlosMatchRegistry__factory.connect(CONTRACT_ADDRESSES.MATCH_REGISTRY, signer);
  
  return { gvtToken, escrow, registry, userAddress, provider, signer };
}
```

### 2. Check GVT Balance and Approve

```typescript
async function checkAndApproveGVT(escrowAddress: string, amount: bigint) {
  const { gvtToken, userAddress } = await connectContracts();
  
  // Check balance
  const balance = await gvtToken.balanceOf(userAddress);
  if (balance < amount) {
    throw new Error(`Insufficient GVT balance. Need: ${ethers.formatEther(amount)}, Have: ${ethers.formatEther(balance)}`);
  }
  
  // Check allowance
  const allowance = await gvtToken.allowance(userAddress, escrowAddress);
  if (allowance < amount) {
    // Approve escrow to spend GVT
    const tx = await gvtToken.approve(escrowAddress, amount);
    await tx.wait();
    console.log("Approved", ethers.formatEther(amount), "GVT for escrow");
  }
  
  return true;
}
```

### 3. Create a Match

```typescript
async function createSnakeMatch(stakeAmount: string) {
  const { escrow, userAddress } = await connectContracts();
  const escrowAddress = await escrow.getAddress();
  
  // Convert stake to wei
  const stakeWei = ethers.parseEther(stakeAmount);
  
  // Approve tokens if needed
  await checkAndApproveGVT(escrowAddress, stakeWei);
  
  // Create match
  const tx = await escrow.createMatch(
    0,                    // Snake game (0)
    1,                    // ONE_V_ONE mode
    0,                    // HIGH_SCORE result type
    stakeWei
  );
  
  console.log("Creating match...");
  const receipt = await tx.wait();
  
  // Extract matchId from event
  const matchCreatedEvent = receipt.logs.find(log => {
    try {
      const parsed = escrow.interface.parseLog(log);
      return parsed?.name === "MatchCreated";
    } catch {
      return false;
    }
  });
  
  if (!matchCreatedEvent) {
    throw new Error("MatchCreated event not found");
  }
  
  const matchId = matchCreatedEvent.args.matchId;
  console.log("Match created with ID:", matchId);
  
  return matchId;
}
```

### 4. Join a Match

```typescript
async function joinMatch(matchId: string) {
  const { escrow, userAddress } = await connectContracts();
  const escrowAddress = await escrow.getAddress();
  
  // Get match details to check stake amount
  const match = await escrow.getMatch(matchId);
  
  if (match.stakeAmount > 0n) {
    await checkAndApproveGVT(escrowAddress, match.stakeAmount);
  }
  
  const tx = await escrow.joinMatch(matchId);
  await tx.wait();
  console.log("Joined match:", matchId);
  
  return true;
}
```

### 5. Check Match Status

```typescript
async function getMatchStatus(matchId: string) {
  const { escrow } = await connectContracts();
  
  const match = await escrow.getMatch(matchId);
  
  const statusMap = {
    0: "PENDING",
    1: "ACTIVE", 
    2: "COMPLETED",
    3: "CANCELLED",
    4: "DISPUTED"
  };
  
  const modeMap = {
    0: "SOLO",
    1: "ONE_V_ONE"
  };
  
  return {
    matchId: match.matchId,
    status: statusMap[match.status],
    player1: match.player1,
    player2: match.player2,
    stakeAmount: ethers.formatEther(match.stakeAmount),
    gameId: match.gameId,
    mode: modeMap[match.mode],
    winner: match.winner,
    createdAt: new Date(Number(match.createdAt) * 1000).toLocaleString(),
    startedAt: match.startedAt > 0n ? new Date(Number(match.startedAt) * 1000).toLocaleString() : "Not started",
    completedAt: match.completedAt > 0n ? new Date(Number(match.completedAt) * 1000).toLocaleString() : "Not completed"
  };
}
```

### 6. Get Player Stats

```typescript
async function getPlayerStats(playerAddress?: string) {
  const { registry, userAddress } = await connectContracts();
  const address = playerAddress || userAddress;
  
  const stats = await registry.getPlayerStats(address);
  
  return {
    totalMatches: Number(stats.totalMatches),
    wins: Number(stats.wins),
    losses: Number(stats.losses),
    totalStaked: ethers.formatEther(stats.totalStaked),
    totalEarned: ethers.formatEther(stats.totalEarned),
    highScore: Number(stats.highScore),
    lastPlayedAt: stats.lastPlayedAt > 0n ? new Date(Number(stats.lastPlayedAt) * 1000).toLocaleString() : "Never"
  };
}
```

## Backend Integration

### 1. Result Signing Service

```typescript
import { ethers } from "ethers";
import express from "express";

const app = express();
app.use(express.json());

// Load signer private key from environment
const RESULT_SIGNER_PRIVATE_KEY = process.env.RESULT_SIGNER_PRIVATE_KEY!;
const signerWallet = new ethers.Wallet(RESULT_SIGNER_PRIVATE_KEY);

// Endpoint to sign match results
app.post("/api/sign-result", async (req, res) => {
  try {
    const { matchId, winner, player1Score, player2Score, duration } = req.body;
    
    // Validate input
    if (!matchId || duration <= 0) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    // Create result hash (same as contract's _hashMatchResult)
    const resultHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "address", "uint256", "uint256", "uint256"],
        [matchId, winner, player1Score, player2Score, duration]
      )
    );
    
    // Sign with Ethereum message prefix
    const signature = await signerWallet.signMessage(ethers.getBytes(resultHash));
    
    res.json({
      success: true,
      signature,
      resultHash,
      signer: signerWallet.address
    });
    
  } catch (error) {
    console.error("Signing error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Result signing service running on port ${PORT}`);
  console.log(`Signer address: ${signerWallet.address}`);
});
```

### 2. Match Monitoring Service

```typescript
import { ethers } from "ethers";
import { OlosEscrow__factory } from "./typechain-types";

async function monitorMatches() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const escrow = OlosEscrow__factory.connect(process.env.ESCROW_ADDRESS!, provider);
  
  // Listen for MatchCreated events
  escrow.on("MatchCreated", (matchId, player1, gameId, stakeAmount, mode) => {
    console.log("New match created:", {
      matchId,
      player1,
      gameId: ["Snake", "JumpingJack", "Bounce", "Tetris", "Chess", "Checkers"][gameId],
      stakeAmount: ethers.formatEther(stakeAmount),
      mode: mode === 0 ? "SOLO" : "ONE_V_ONE"
    });
    
    // Could trigger game server matchmaking here
  });
  
  // Listen for MatchCompleted events
  escrow.on("MatchResultSubmitted", (matchId, winner, player1Score, player2Score) => {
    console.log("Match completed:", {
      matchId,
      winner,
      player1Score: Number(player1Score),
      player2Score: Number(player2Score)
    });
    
    // Update game server with results
  });
  
  console.log("Monitoring OLOS matches...");
}
```

## Game Integration

### 1. Game Client Integration

```typescript
// Game client example for Snake game
class SnakeGameClient {
  private matchId: string | null = null;
  private playerNumber: 1 | 2 | null = null;
  private score: number = 0;
  
  constructor(private escrow: OlosEscrow, private playerAddress: string) {}
  
  async startMatch(matchId: string) {
    this.matchId = matchId;
    
    // Get match details
    const match = await this.escrow.getMatch(matchId);
    
    // Determine if we're player1 or player2
    if (match.player1.toLowerCase() === this.playerAddress.toLowerCase()) {
      this.playerNumber = 1;
    } else if (match.player2.toLowerCase() === this.playerAddress.toLowerCase()) {
      this.playerNumber = 2;
    } else {
      throw new Error("Not a participant in this match");
    }
    
    console.log(`Starting game as Player ${this.playerNumber}`);
    this.score = 0;
    
    return {
      playerNumber: this.playerNumber,
      gameId: match.gameId,
      stakeAmount: ethers.formatEther(match.stakeAmount)
    };
  }
  
  updateScore(points: number) {
    this.score += points;
  }
  
  getScore() {
    return this.score;
  }
  
  async submitResult(durationSeconds: number, backendApiUrl: string) {
    if (!this.matchId) throw new Error("No active match");
    
    const { escrow } = await connectContracts();
    const match = await escrow.getMatch(this.matchId);
    
    // In a real game, you'd get opponent's score from game server
    const opponentScore = 0; // This would come from game logic
    
    const resultData = {
      matchId: this.matchId,
      winner: this.playerAddress, // In real game, determine winner based on scores
      player1Score: this.playerNumber === 1 ? this.score : opponentScore,
      player2Score: this.playerNumber === 2 ? this.score : opponentScore,
      duration: durationSeconds
    };
    
    // Get signature from backend
    const response = await fetch(`${backendApiUrl}/api/sign-result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resultData)
    });
    
    const { signature } = await response.json();
    
    // Submit to blockchain
    const tx = await escrow.submitResult(resultData, signature);
    await tx.wait();
    
    console.log("Result submitted successfully");
    return tx.hash;
  }
}
```

### 2. Game Server Integration

```typescript
// Game server handling match logic
class GameServer {
  private activeMatches = new Map<string, MatchState>();
  
  async handleMatchStart(matchId: string, gameId: number) {
    // Initialize game state
    this.activeMatches.set(matchId, {
      gameId,
      player1Score: 0,
      player2Score: 0,
      startTime: Date.now(),
      status: "active"
    });
    
    // Start game logic based on gameId
    switch (gameId) {
      case 0: // Snake
        this.startSnakeGame(matchId);
        break;
      case 3: // Tetris
        this.startTetrisGame(matchId);
        break;
      // ... other games
    }
  }
  
  async updateScore(matchId: string, player: 1 | 2, score: number) {
    const match = this.activeMatches.get(matchId);
    if (!match) return;
    
    if (player === 1) {
      match.player1Score = score;
    } else {
      match.player2Score = score;
    }
  }
  
  async endMatch(matchId: string) {
    const match = this.activeMatches.get(matchId);
    if (!match) return;
    
    const duration = Math.floor((Date.now() - match.startTime) / 1000);
    match.status = "completed";
    
    // Determine winner
    let winner: string | null = null;
    if (match.player1Score > match.player2Score) {
      winner = "player1";
    } else if (match.player2Score > match.player1Score) {
      winner = "player2";
    }
    
    return {
      duration,
      player1Score: match.player1Score,
      player2Score: match.player2Score,
      winner
    };
  }
}

interface MatchState {
  gameId: number;
  player1Score: number;
  player2Score: number;
  startTime: number;
  status: "active" | "completed" | "cancelled";
}
```

## Testing Integration

### 1. End-to-End Test

```typescript
import { ethers } from "ethers";
import { GVTToken__factory, OlosEscrow__factory } from "./typechain-types";

async function testEndToEnd() {
  console.log("Starting end-to-end test...");
  
  // Setup
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  const [deployer, player1, player2, admin, resultSigner] = await ethers.getSigners();
  
  // Deploy contracts (simplified)
  const gvtToken = await new GVTToken__factory(deployer).deploy(admin.address);
  const escrow = await new OlosEscrow__factory(deployer).deploy(
    await gvtToken.getAddress(),
    admin.address,
    resultSigner.address
  );
  
  // Setup roles
  await gvtToken.connect(admin).grantRole(await gvtToken.MINTER_ROLE(), await escrow.getAddress());
  
  // Fund players
  await gvtToken.connect(admin).mint(player1.address, ethers.parseEther("1000"));
  await gvtToken.connect(admin).mint(player2.address, ethers.parseEther("1000"));
  
  // Approve escrow
  await gvtToken.connect(player1).approve(await escrow.getAddress(), ethers.MaxUint256);
  await gvtToken.connect(player2).approve(await escrow.getAddress(), ethers.MaxUint256);
  
  // Create match
  console.log("Creating match...");
  const tx = await escrow.connect(player1).createMatch(
    0, // Snake
    1, // ONE_V_ONE  
    0, // HIGH_SCORE
    ethers.parseEther("100")
  );
  
  const receipt = await tx.wait();
  const matchId = extractMatchId(receipt, escrow);
  
  console.log("Match created:", matchId);
  
  // Join match
  console.log("Player2 joining match...");
  await escrow.connect(player2).joinMatch(matchId);
  
  // Simulate game and get signature
  const result = {
    matchId,
    winner: player1.address,
    player1Score: 1500n,
    player2Score: 800n,
    duration: 120n
  };
  
  const hash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "address", "uint256", "uint256", "uint256"],
      [result.matchId, result.winner, result.player1Score, result.player2Score, result.duration]
    )
  );
  
  const signature = await resultSigner.signMessage(ethers.getBytes(hash));
  
  // Submit result
  console.log("Submitting result...");
  await escrow.connect(admin).submitResult(result, signature);
  
  console.log("End-to-end test completed successfully!");
}

function extractMatchId(receipt: any, escrow: any): string {
  const event = receipt.logs.find((log: any) => {
    try {
      return escrow.interface.parseLog(log)?.name === "MatchCreated";
    } catch {
      return false;
    }
  });
  return event.args.matchId;
}
```

## Security Best Practices

### Frontend
- **Validate inputs** before sending transactions
- **Handle user rejection** of transactions gracefully
- **Show transaction status** with loading indicators
- **Cache contract data** to reduce RPC calls
- **Use error boundaries** for failed transactions

### Backend
- **Secure private keys** in environment variables
- **Validate requests** before signing
- **Rate limit** signing requests
- **Log all signatures** for audit trail
- **Use HTTPS** for all endpoints

### Games
- **Verify match state** before accepting inputs
- **Validate scores** on both client and server
- **Prevent cheating** with server-side validation
- **Handle disconnections** gracefully
- **Save game state** for recovery

## Common Integration Issues

1. **Wrong Network**: Ensure users are on the correct network (Sepolia for testing)
2. **Insufficient Allowance**: Check GVT token approval before transactions
3. **Signature Mismatch**: Ensure backend signs the exact same data structure as contract
4. **Gas Estimation**: Use `estimateGas` before sending transactions
5. **Event Listening**: Use proper event filters to avoid missing events

## Support

For integration issues:
1. Check contract addresses are correct
2. Verify network configuration
3. Test with small amounts first
4. Review transaction receipts for errors
5. Consult the [API.md](./API.md) for exact function signatures