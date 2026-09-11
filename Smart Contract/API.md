# OLOS Smart Contracts API Documentation

## Contract Addresses

### Sepolia Testnet
```javascript
const CONTRACT_ADDRESSES = {
  GVT_TOKEN: "0xDE0Bd309CbCaf5E6fBc7e05660E7BCb83520C3fC",
  OLOS_ESCROW: "0xb13Cf72a4c1C2Da55e2C42E27E8Bd859C9f2A800",
  MATCH_REGISTRY: "0x36206DA73098ca9CcD0963E6416F5A777b4D7B76"
};
```

## GVTToken Contract

### Core Functions

#### `mint(address to, uint256 amount)`
Mints GVT tokens (MINTER_ROLE only).

**Parameters:**
- `to`: Recipient address
- `amount`: Amount in wei (18 decimals)

**Events:**
- `TokensMinted(address indexed to, uint256 amount)`

#### `pause()` / `unpause()`
Pauses/unpauses token transfers (PAUSER_ROLE only).

**Note:** Minting is still allowed while paused for admin operations.

#### `burn(uint256 amount)`
Burns tokens from caller's balance (ERC20Burnable).

### View Functions

#### `name()` → `string`
Returns token name: "OLOS Gaming Value Token"

#### `symbol()` → `string`
Returns token symbol: "GVT"

#### `decimals()` → `uint8`
Returns token decimals: 18

#### `MAX_SUPPLY()` → `uint256`
Returns maximum supply: 1,000,000,000 * 10^18

#### `MINTER_ROLE()` / `PAUSER_ROLE()` → `bytes32`
Returns role identifiers for access control.

## OlosEscrow Contract

### Game Constants
```solidity
enum GameMode { SOLO, ONE_V_ONE }
enum ResultType { HIGH_SCORE, WIN_LOSS }

// Game IDs
const GAME_IDS = {
  SNAKE: 0,
  JUMPING_JACK: 1,
  BOUNCE: 2,
  TETRIS: 3,
  CHESS: 4,
  CHECKERS: 5
};
```

### Match Lifecycle

#### `createMatch(uint8 gameId, GameMode mode, ResultType resultType, uint256 stakeAmount)`
Creates a new match and escrows the stake.

**Parameters:**
- `gameId`: 0-5 (see GAME_IDS above)
- `mode`: `GameMode.SOLO` or `GameMode.ONE_V_ONE`
- `resultType`: `ResultType.HIGH_SCORE` or `ResultType.WIN_LOSS`
- `stakeAmount`: GVT in wei (0 for free practice)

**Returns:** `bytes32 matchId`

**Events:**
- `MatchCreated(bytes32 indexed matchId, address indexed player1, uint8 gameId, uint256 stakeAmount, GameMode mode)`

**Requirements:**
- For staked matches: `stakeAmount >= 1 GVT` (10^18 wei)
- Caller must have approved sufficient GVT to escrow contract

#### `joinMatch(bytes32 matchId)`
Player 2 joins a PENDING 1v1 match.

**Parameters:**
- `matchId`: Match identifier from `createMatch`

**Events:**
- `MatchJoined(bytes32 indexed matchId, address indexed player2)`

**Requirements:**
- Match must be PENDING and ONE_V_ONE mode
- Caller cannot be player1
- Within 10-minute join timeout
- Sufficient GVT approval for stake

#### `submitResult(MatchResult calldata result, bytes calldata signature)`
Submits a backend-signed result to complete a match.

**Parameters Structure:**
```typescript
interface MatchResult {
  matchId: bytes32;
  winner: address;          // address(0) for SOLO matches
  player1Score: uint256;
  player2Score: uint256;
  duration: uint256;        // seconds, must be > 0
}
```

**Events:**
- `MatchResultSubmitted(bytes32 indexed matchId, address indexed winner, uint256 player1Score, uint256 player2Score)`
- `RewardDistributed(bytes32 indexed matchId, address indexed winner, uint256 winnerPayout, uint256 platformFee)`

**Requirements:**
- Valid ECDSA signature from RESULT_SIGNER_ROLE
- Match must be ACTIVE (or PENDING for SOLO)
- Result hash not previously used
- Winner must be participant (for 1v1 matches)
- Duration > 0 seconds

#### `cancelMatch(bytes32 matchId)`
Cancels a PENDING match with full refund to player1.

**Events:**
- `MatchCancelled(bytes32 indexed matchId, address indexed cancelledBy)`

**Who can cancel:**
- Player1: Anytime while match is PENDING
- Anyone: After 10-minute join timeout (anti-griefing)

### Admin Functions

#### `withdrawFees(address to)`
Withdraws accumulated platform fees (FEE_WITHDRAWER_ROLE only).

**Parameters:**
- `to`: Treasury address to receive fees

**Events:**
- `PlatformFeeWithdrawn(address indexed to, uint256 amount)`

#### `pause()` / `unpause()`
Pauses/unpauses match operations (PAUSER_ROLE only).

**Note:** `cancelMatch` still works while paused (safety feature).

### View Functions

#### `getMatch(bytes32 matchId)` → `Match`
Returns match details.

**Return Structure:**
```solidity
struct Match {
  bytes32 matchId;
  uint8 gameId;
  GameMode mode;
  ResultType resultType;
  address player1;
  address player2;
  uint256 stakeAmount;
  uint256 createdAt;
  uint256 startedAt;
  uint256 completedAt;
  MatchStatus status;  // PENDING, ACTIVE, COMPLETED, CANCELLED
  address winner;
}
```

#### `getResultHash(MatchResult calldata result)` → `bytes32`
Returns the hash that backend must sign for a result.

#### `accruedFees()` → `uint256`
Returns total accumulated platform fees.

#### Constants:
- `PLATFORM_FEE_BPS`: 500 (5%)
- `MATCH_JOIN_TIMEOUT`: 600 seconds (10 minutes)
- `MIN_STAKE`: 1 * 10^18 wei (1 GVT)

## OlosMatchRegistry Contract

### Data Recording

#### `recordMatch(...)` (RECORDER_ROLE only)
Called by OlosEscrow to record completed matches.

### View Functions

#### `getMatchRecord(bytes32 matchId)` → `MatchRecord`
Returns detailed match record.

#### `getPlayerStats(address player)` → `PlayerStats`
Returns player statistics.

**Stats Structure:**
```solidity
struct PlayerStats {
  uint256 totalMatches;
  uint256 wins;
  uint256 losses;
  uint256 totalStaked;    // Cumulative GVT staked
  uint256 totalEarned;    // Cumulative GVT won
  uint256 highScore;      // All-time high across any game
  uint256 lastPlayedAt;
}
```

#### `getPlayerMatchHistory(address player)` → `bytes32[]`
Returns array of match IDs for a player.

#### `getPlayerMatchHistoryPaginated(address player, uint256 offset, uint256 limit)` → `bytes32[]`
Returns paginated match history.

#### `totalMatches()` → `uint256`
Returns total number of matches recorded.

## Integration Examples

### Frontend Integration
```typescript
import { ethers } from "ethers";
import { OlosEscrow__factory } from "./typechain-types";

// Connect to contract
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const escrow = OlosEscrow__factory.connect(ESCROW_ADDRESS, signer);

// Create match
const stakeAmount = ethers.parseEther("100");
const tx = await escrow.createMatch(
  0,                    // Snake
  1,                    // ONE_V_ONE
  0,                    // HIGH_SCORE
  stakeAmount
);

// Wait for event and get matchId
const receipt = await tx.wait();
const event = receipt.logs.find(log => 
  escrow.interface.parseLog(log)?.name === "MatchCreated"
);
const matchId = event?.args.matchId;
```

### Backend Result Signing
```typescript
import { ethers } from "ethers";

async function signResult(result: MatchResult, privateKey: string): Promise<string> {
  const wallet = new ethers.Wallet(privateKey);
  
  // Hash the result (same as contract's _hashMatchResult)
  const hash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "address", "uint256", "uint256", "uint256"],
      [result.matchId, result.winner, result.player1Score, 
       result.player2Score, result.duration]
    )
  );
  
  // Sign with Ethereum message prefix
  return wallet.signMessage(ethers.getBytes(hash));
}
```

## Error Messages

### Common Reverts

**GVTToken:**
- "GVT: zero admin address" - Constructor with zero address
- "GVT: mint to zero address" - Minting to zero address
- "GVT: exceeds max supply" - Minting beyond 1 billion
- "GVT: token transfers paused" - Transfer while paused

**OlosEscrow:**
- "Escrow: zero token/admin/signer" - Invalid constructor parameters
- "Escrow: stake below minimum" - Stake < 1 GVT (for non-zero stake)
- "Escrow: match not found" - Invalid matchId
- "Escrow: match not joinable" - Wrong status or mode
- "Escrow: cannot join own match" - Player1 trying to join
- "Escrow: join window expired" - >10 minutes since creation
- "Escrow: result already used" - Replay attack prevention
- "Escrow: invalid signer" - Wrong signature or signer
- "Escrow: winner not a participant" - Winner not player1/player2
- "Escrow: zero duration" - Duration must be > 0
- "Escrow: no fees" - Withdraw with zero accrued fees

**OlosMatchRegistry:**
- "Registry: zero admin" - Constructor with zero address
- "Registry: already recorded" - Duplicate match recording

## Gas Estimates

Approximate gas costs (Sepolia testnet):

- `createMatch`: ~150,000 gas (plus token transfer approval)
- `joinMatch`: ~100,000 gas (plus token transfer approval)
- `submitResult`: ~200,000 gas (signature verification + payout)
- `cancelMatch`: ~50,000 gas
- `withdrawFees`: ~45,000 gas

*Note: Gas costs vary based on network conditions and stake amounts.*