# FHEverse - Card Duel Arena

A full-stack blockchain-based card game built on Ethereum, demonstrating the integration of smart contracts with modern web technologies. FHEverse is a strategic card game where players compete against an on-chain system in a five-round duel, with all game logic executed trustlessly on the blockchain.

## Table of Contents

- [Introduction](#introduction)
- [Key Features](#key-features)
- [Technologies Used](#technologies-used)
- [Problems Solved](#problems-solved)
- [Game Mechanics](#game-mechanics)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (Smart Contracts)](#backend-setup-smart-contracts)
  - [Frontend Setup (dApp)](#frontend-setup-dapp)
- [Project Structure](#project-structure)
- [Smart Contract Details](#smart-contract-details)
- [Testing](#testing)
- [Deployment](#deployment)
- [Available Scripts](#available-scripts)
- [Future Roadmap](#future-roadmap)
- [Security Considerations](#security-considerations)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Introduction

FHEverse (Card Duel Arena) is a decentralized application (dApp) that brings traditional card gaming to the blockchain. Built as a demonstration of blockchain gaming capabilities, this project showcases how smart contracts can manage complex game state, ensure fair play through verifiable randomness, and provide a seamless user experience through modern web3 integrations.

The project is built on the FHEVM Hardhat template, positioning it for future integration with Fully Homomorphic Encryption (FHE) technology, which will enable private gaming experiences where player strategies can remain hidden even from the blockchain itself.

## Key Features

### Core Game Features
- **Fully On-Chain Game Logic**: All game rules, card dealing, and scoring executed trustlessly via smart contracts
- **Deterministic Randomness**: Fair card distribution using blockchain-based randomness (block.prevrandao, timestamps)
- **Real-time State Management**: Instant game state updates with wallet connection integration
- **Complete Game History**: Every round tracked and displayed with detailed outcome summaries
- **User-Friendly Interface**: Clean, modern UI with visual card representations and score tracking

### Technical Features
- **Wallet Integration**: Seamless Web3 wallet connectivity via RainbowKit
- **Multi-Network Support**: Configured for local development (Hardhat/Anvil), Sepolia testnet, and mainnet deployment
- **Type-Safe Development**: Full TypeScript support across contracts and frontend
- **Comprehensive Testing**: Unit tests covering all game scenarios and edge cases
- **Gas Optimization**: Efficient contract design with optimized storage patterns
- **Developer-Friendly**: Hot module replacement, extensive documentation, and clear code structure

### Web3 Experience
- **No Backend Required**: Fully decentralized architecture
- **Wallet-Based Authentication**: No traditional login/signup needed
- **Transparent Gameplay**: All actions verifiable on-chain
- **Cross-Platform**: Works on any device with a web browser and Web3 wallet

## Technologies Used

### Blockchain & Smart Contracts
- **Solidity ^0.8.24**: Smart contract programming language
- **Hardhat 2.26.0**: Ethereum development environment
- **FHEVM Protocol**: Integration ready for Fully Homomorphic Encryption by Zama
- **Ethers.js 6.15.0**: Ethereum wallet implementation and contract interaction library
- **Hardhat Deploy**: Deployment management and contract versioning
- **TypeChain**: Automatic TypeScript bindings for smart contracts
- **OpenZeppelin Standards**: Following best practices for contract development

### Frontend Technologies
- **React 19.1.1**: Modern UI component library
- **TypeScript 5.8.3**: Type-safe JavaScript development
- **Vite 7.1.6**: Next-generation frontend build tool with HMR
- **Wagmi 2.17.0**: React hooks for Ethereum
- **Viem 2.37.6**: Lightweight Ethereum library
- **RainbowKit 2.2.8**: Beautiful wallet connection UI
- **TanStack Query 5.89.0**: Powerful data synchronization for React

### Development & Testing Tools
- **Mocha & Chai**: JavaScript testing frameworks
- **Chai-as-Promised**: Async testing utilities
- **Hardhat Network Helpers**: Time manipulation and testing utilities
- **Solidity Coverage**: Code coverage reporting for smart contracts
- **ESLint & Prettier**: Code quality and formatting
- **Solhint**: Solidity linting

### Infrastructure
- **Infura**: Ethereum node infrastructure
- **Etherscan API**: Contract verification and exploration
- **Sepolia Testnet**: Testing environment
- **Netlify**: Frontend deployment platform

## Problems Solved

### 1. **Trust and Transparency in Gaming**
Traditional online games require players to trust centralized servers for fair play. FHEverse eliminates this trust requirement by executing all game logic on-chain, making every action transparent and verifiable.

### 2. **Provably Fair Randomness**
Card games require unpredictable randomness that cannot be manipulated. This project implements blockchain-based randomness using a combination of block data and nonces, ensuring cards are dealt fairly without possibility of cheating.

### 3. **State Synchronization**
Managing game state across blockchain and frontend is complex. FHEverse demonstrates robust patterns for state synchronization, ensuring the UI always reflects the true on-chain state.

### 4. **Web3 User Experience**
Web3 gaming often suffers from poor UX. This project shows how modern Web3 libraries (Wagmi, RainbowKit) can create experiences comparable to Web2 applications.

### 5. **Gas Efficiency**
Blockchain transactions cost gas. The CardGame contract is optimized to minimize gas usage through efficient storage patterns and minimal on-chain computation.

### 6. **Testing Blockchain Applications**
Testing smart contracts requires specialized knowledge. This project includes comprehensive test suites demonstrating best practices for testing game logic, edge cases, and security considerations.

## Game Mechanics

### How to Play

1. **Start a Game**: Connect your wallet and click "Start Game" to receive your hand of 5 cards
2. **Receive Cards**: Both you and the system are dealt 5 unique cards (values 1-13)
3. **Play Rounds**: Each round, select a card from your hand to play
4. **Card Comparison**: Your card is compared against the system's card for that round
   - Higher card wins the round
   - Lower card loses the round
   - Equal cards result in a draw
5. **Scoring**: First to win more rounds wins the game
6. **Complete Match**: After 5 rounds, the final score determines the winner

### Game Rules

- **Deck Size**: 13 unique cards (1-13)
- **Hand Size**: 5 cards per player
- **Rounds**: Exactly 5 rounds per game
- **Card Selection**: Cards cannot be reused once played
- **System Behavior**: System cards are revealed sequentially (no strategic selection)
- **Winning Condition**: Most rounds won determines the winner
- **Tie Condition**: Equal rounds won results in a draw

### Smart Contract Game State

The contract tracks:
- Player and system hands
- Which cards have been played
- Which system cards have been revealed
- Current round number
- Player and system scores
- Game active status
- Last system card played (for UI updates)

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  RainbowKit  │  │    Wagmi     │  │  Components  │ │
│  │   (Wallet)   │  │   (Hooks)    │  │    (UI)      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Web3 Provider
                           │
┌─────────────────────────────────────────────────────────┐
│              Ethereum Network (Sepolia)                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │           CardGame Smart Contract                │  │
│  │  - Game State Management                         │  │
│  │  - Randomness Generation                         │  │
│  │  - Card Distribution                             │  │
│  │  - Round Execution                               │  │
│  │  - Scoring Logic                                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Game Initialization**: User clicks "Start Game" → Transaction sent → Contract deals cards → Event emitted → UI updates
2. **Playing a Card**: User selects card → Transaction sent → Contract validates and executes round → Event emitted → UI fetches updated state
3. **State Queries**: UI periodically queries contract for current game state
4. **Game Completion**: After 5 rounds, contract marks game inactive and emits final score

### Contract Architecture

```solidity
CardGame Contract
├── State Variables
│   ├── games (mapping: address => Game)
│   └── nonce (randomness seed)
├── Structs
│   └── Game (player hand, system hand, scores, status)
├── Public Functions
│   ├── startGame()
│   ├── playCard(uint8 cardValue)
│   ├── getGame(address player)
│   ├── hasActiveGame(address player)
│   └── remainingRounds(address player)
└── Internal Functions
    ├── _dealHands()
    ├── _playerCardIndex()
    ├── _nextSystemIndex()
    └── _random()
```

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js**: Version 20 or higher ([Download](https://nodejs.org/))
- **npm**: Version 7.0.0 or higher (comes with Node.js)
- **Git**: For cloning the repository
- **MetaMask** or another Web3 wallet: For interacting with the dApp
- **Sepolia ETH**: Testnet funds for deployment and gameplay ([Faucet](https://sepoliafaucet.com/))

### Backend Setup (Smart Contracts)

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd FHEverse
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file or use Hardhat vars:

   ```bash
   # Set your private key (DO NOT commit this!)
   npx hardhat vars set PRIVATE_KEY
   # Example: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

   # Set your Infura API key for network access
   npx hardhat vars set INFURA_API_KEY
   # Get one at: https://infura.io/

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   # Get one at: https://etherscan.io/apis
   ```

   Alternatively, create a `.env` file:

   ```env
   PRIVATE_KEY=your_private_key_here
   INFURA_API_KEY=your_infura_api_key_here
   ETHERSCAN_API_KEY=your_etherscan_api_key_here
   ```

4. **Compile contracts**

   ```bash
   npm run compile
   ```

   This will:
   - Compile all Solidity contracts
   - Generate TypeScript types with TypeChain
   - Create artifacts in the `artifacts/` directory

5. **Run tests**

   ```bash
   npm run test
   ```

   To run tests with gas reporting:

   ```bash
   REPORT_GAS=true npm run test
   ```

6. **Deploy to local network**

   Terminal 1 - Start local Hardhat node:
   ```bash
   npm run chain
   ```

   Terminal 2 - Deploy contracts:
   ```bash
   npm run deploy:localhost
   ```

7. **Deploy to Sepolia testnet**

   ```bash
   npm run deploy:sepolia
   ```

   After deployment, verify on Etherscan:

   ```bash
   npm run verify:sepolia
   ```

   Note the deployed contract address - you'll need it for the frontend!

### Frontend Setup (dApp)

1. **Navigate to the app directory**

   ```bash
   cd app
   ```

2. **Install frontend dependencies**

   ```bash
   npm install
   ```

3. **Configure the contract address**

   Edit `app/src/config/contracts.ts`:

   ```typescript
   export const CONTRACT_ADDRESS = '0xYourDeployedContractAddress';
   ```

   Replace with the address from your Sepolia deployment.

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

5. **Connect your wallet**

   - Open the app in your browser
   - Click "Connect Wallet"
   - Select your wallet (MetaMask, etc.)
   - Switch to Sepolia network if prompted
   - Start playing!

6. **Build for production**

   ```bash
   npm run build
   ```

   Production files will be in `app/dist/`

## Project Structure

```
FHEverse/
├── contracts/              # Solidity smart contracts
│   └── CardGame.sol        # Main game contract
├── deploy/                 # Deployment scripts
│   └── deploy.ts           # CardGame deployment script
├── tasks/                  # Custom Hardhat tasks
│   ├── accounts.ts         # Account management
│   └── cardGame.ts         # Game interaction tasks
├── test/                   # Smart contract tests
│   └── CardGame.ts         # Comprehensive game tests
├── app/                    # Frontend React application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Header.tsx          # App header with wallet connection
│   │   │   └── CardGameApp.tsx     # Main game interface
│   │   ├── config/         # Configuration files
│   │   │   ├── contracts.ts        # Contract ABI and address
│   │   │   └── wagmi.ts            # Wagmi configuration
│   │   ├── hooks/          # Custom React hooks
│   │   │   ├── useEthersSigner.ts  # Ethers.js signer hook
│   │   │   └── useZamaInstance.ts  # FHEVM integration (future)
│   │   ├── styles/         # CSS stylesheets
│   │   │   └── CardGameApp.css     # Game styling
│   │   ├── App.tsx         # Root component
│   │   ├── main.tsx        # Application entry point
│   │   └── vite-env.d.ts   # Vite type definitions
│   ├── index.html          # HTML template
│   ├── netlify.toml        # Netlify deployment config
│   ├── package.json        # Frontend dependencies
│   ├── tsconfig.json       # TypeScript config
│   └── vite.config.ts      # Vite configuration
├── artifacts/              # Compiled contract artifacts (generated)
├── cache/                  # Hardhat cache (generated)
├── types/                  # TypeChain generated types (generated)
├── node_modules/           # Dependencies (generated)
├── hardhat.config.ts       # Hardhat configuration
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── .gitignore              # Git ignore rules
├── .env                    # Environment variables (not committed)
└── README.md               # This file
```

## Smart Contract Details

### CardGame.sol

The `CardGame` contract is the core of the application, managing all game logic:

#### Key Functions

**Public Functions:**

- `startGame()`: Initializes a new game for the caller, dealing cards to both player and system
- `playCard(uint8 cardValue)`: Plays a card from the player's hand, executes a round
- `getGame(address player)`: Returns complete game state for a player
- `hasActiveGame(address player)`: Checks if player has an active game
- `remainingRounds(address player)`: Returns number of rounds left to play

**Internal Functions:**

- `_dealHands()`: Deals 5 unique cards to player and system from a 13-card deck
- `_playerCardIndex()`: Finds index of a specific card in player's hand
- `_nextSystemIndex()`: Gets next unrevealed system card
- `_random()`: Generates pseudo-random number using block data and nonce

#### Events

```solidity
event GameStarted(address indexed player, uint8[5] playerHand);
event RoundPlayed(address indexed player, uint8 playerCard, uint8 systemCard,
                  uint8 playerScore, uint8 systemScore, uint8 roundsPlayed);
event GameFinished(address indexed player, uint8 playerScore, uint8 systemScore);
```

#### Gas Optimization Techniques

- **Efficient Storage**: Uses fixed-size arrays instead of dynamic arrays
- **Minimal State Changes**: Updates state in batch where possible
- **View Functions**: Game state queries don't require transactions
- **Event Emission**: Uses events for historical data instead of storing all history on-chain

#### Security Features

- **Access Control**: Players can only modify their own games
- **Input Validation**: All inputs validated (card values, game state)
- **Reentrancy Protection**: No external calls in state-changing functions
- **Overflow Protection**: Solidity 0.8+ built-in overflow protection
- **Card Uniqueness**: Ensures no duplicate cards in hands
- **Game State Validation**: Prevents playing in invalid states

## Testing

### Smart Contract Tests

The project includes comprehensive test coverage:

```bash
# Run all tests
npm run test

# Run tests with gas reporting
REPORT_GAS=true npm run test

# Run tests with coverage
npm run coverage

# Run tests on Sepolia (requires deployed contract)
npm run test:sepolia
```

### Test Scenarios Covered

1. **Game Initialization**
   - Deals unique, non-overlapping hands
   - Initializes game state correctly
   - Sets active status

2. **Card Playing**
   - Tracks used cards correctly
   - Updates round count
   - Records last system card

3. **Game Completion**
   - Completes full 5-round game
   - Marks game inactive after completion
   - Allows starting new game after completion

4. **Error Handling**
   - Prevents replaying used cards
   - Prevents playing invalid cards
   - Prevents extra rounds after game completion
   - Prevents playing without active game

5. **Scoring Logic**
   - Correctly awards points for winning rounds
   - Handles draw scenarios
   - Accurately maintains score totals

### Frontend Testing

While comprehensive frontend tests are not yet implemented, you can manually test:

1. **Wallet Connection**: Connect/disconnect wallet
2. **Network Switching**: Switch between networks
3. **Game Flow**: Complete game start-to-finish
4. **Error States**: Try playing without connecting wallet, on wrong network, etc.
5. **UI Responsiveness**: Test on different screen sizes

## Deployment

### Local Deployment

1. Start local Hardhat node:
   ```bash
   npm run chain
   ```

2. Deploy contracts:
   ```bash
   npm run deploy:localhost
   ```

3. Update frontend config with local contract address

### Sepolia Testnet Deployment

1. Ensure you have Sepolia ETH in your deployer wallet

2. Deploy contract:
   ```bash
   npm run deploy:sepolia
   ```

3. Note the deployed contract address from console output

4. Verify on Etherscan:
   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

5. Update `app/src/config/contracts.ts` with deployed address

6. Deploy frontend (example with Netlify):
   ```bash
   cd app
   npm run build
   # Deploy dist/ folder to Netlify
   ```

### Mainnet Deployment

⚠️ **Warning**: Deploying to mainnet requires real ETH and thorough security audits.

Before mainnet deployment:
1. Conduct professional security audit
2. Improve randomness mechanism (consider Chainlink VRF)
3. Add pause/emergency stop functionality
4. Consider upgrade patterns (proxy contracts)
5. Implement comprehensive monitoring

## Available Scripts

### Backend (Root Directory)

| Script | Description |
|--------|-------------|
| `npm run clean` | Remove artifacts, cache, and regenerate types |
| `npm run compile` | Compile Solidity contracts |
| `npm run coverage` | Generate test coverage report |
| `npm run lint` | Run all linters (Solidity + TypeScript) |
| `npm run lint:sol` | Lint Solidity files |
| `npm run lint:ts` | Lint TypeScript files |
| `npm run prettier:check` | Check code formatting |
| `npm run prettier:write` | Auto-format code |
| `npm run test` | Run contract tests on Hardhat network |
| `npm run test:sepolia` | Run tests on Sepolia testnet |
| `npm run build:ts` | Compile TypeScript files |
| `npm run typechain` | Generate TypeScript types for contracts |
| `npm run chain` | Start local Hardhat node |
| `npm run deploy:localhost` | Deploy to local Hardhat node |
| `npm run deploy:sepolia` | Deploy to Sepolia testnet |
| `npm run verify:sepolia` | Verify contracts on Etherscan |

### Frontend (app/ Directory)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build production bundle |
| `npm run lint` | Run ESLint on frontend code |
| `npm run preview` | Preview production build locally |

## Future Roadmap

### Phase 1: Enhanced Gameplay (Q2 2025)
- **Multiplayer Mode**: Player vs player matches
- **Tournament System**: Multi-round tournaments with rankings
- **Card Special Abilities**: Different card types with unique powers
- **Multiple Game Modes**: Different rule sets and game variations
- **Achievement System**: Track player stats and milestones

### Phase 2: FHE Integration (Q3 2025)
- **Private Card Hands**: Use FHEVM to hide player cards until reveal
- **Encrypted System Cards**: Hide system cards until played
- **Private Strategy**: Enable hidden betting and bluffing mechanics
- **Zero-Knowledge Proofs**: Prove valid plays without revealing hand

### Phase 3: Economic Layer (Q4 2025)
- **NFT Cards**: Unique collectible cards as NFTs
- **Card Marketplace**: Trade and sell rare cards
- **Staking Mechanism**: Stake tokens to enter premium tournaments
- **Rewards System**: Earn tokens for wins and participation
- **Governance**: Community voting on game rules and features

### Phase 4: Advanced Features (2026)
- **AI Opponents**: Machine learning-based opponents with difficulty levels
- **Mobile App**: Native iOS and Android applications
- **Cross-Chain Support**: Deploy on multiple EVM chains
- **Social Features**: Friend lists, chat, spectator mode
- **Deck Building**: Custom deck creation and management
- **Seasonal Events**: Time-limited special game modes

### Technical Improvements
- **Gas Optimization**: Further reduce transaction costs
- **Randomness**: Integrate Chainlink VRF for verifiable randomness
- **Layer 2 Scaling**: Deploy on L2 solutions (Optimism, Arbitrum)
- **Upgrade Patterns**: Implement upgradeable contracts
- **Advanced Analytics**: On-chain game analytics and statistics
- **Automated Testing**: Expand test coverage, add E2E frontend tests
- **Security Audits**: Professional smart contract audits

### UI/UX Enhancements
- **Animated Cards**: Card flip animations and effects
- **Sound Effects**: Audio feedback for game actions
- **Themes**: Multiple visual themes and customization
- **Tutorial Mode**: Interactive tutorial for new players
- **Leaderboard**: Global rankings and statistics
- **Replay System**: Watch past game replays

## Security Considerations

### Current Implementation

**Randomness**:
The current randomness implementation uses `block.prevrandao` and `block.timestamp`. While suitable for a demo, this is potentially manipulable by miners/validators on mainnet.

**Recommendation**: For production, integrate Chainlink VRF (Verifiable Random Function) for provably fair randomness.

**Access Control**:
Games are isolated per player address. No authorization issues.

**State Management**:
All state changes are validated and guarded by require statements.

### Best Practices Implemented

- ✅ Use of Solidity 0.8+ (automatic overflow protection)
- ✅ No external calls in critical functions (no reentrancy risk)
- ✅ Input validation on all public functions
- ✅ Events for all state changes
- ✅ Gas-efficient storage patterns

### Recommended Before Mainnet

- 🔒 Professional security audit
- 🔒 Implement Chainlink VRF for randomness
- 🔒 Add emergency pause functionality
- 🔒 Implement rate limiting for game starts
- 🔒 Add comprehensive monitoring and alerting
- 🔒 Consider upgradeable contract patterns

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for all new features
- Follow existing code style (use Prettier)
- Run linters before committing
- Update documentation for API changes
- Keep commits atomic and well-described

## License

This project is licensed under the **BSD-3-Clause-Clear License**.

```
BSD 3-Clause Clear License

Copyright (c) 2025, FHEverse Contributors
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted (subject to the limitations in the disclaimer
below) provided that the following conditions are met:

     * Redistributions of source code must retain the above copyright notice,
     this list of conditions and the following disclaimer.

     * Redistributions in binary form must reproduce the above copyright
     notice, this list of conditions and the following disclaimer in the
     documentation and/or other materials provided with the distribution.

     * Neither the name of the copyright holder nor the names of its
     contributors may be used to endorse or promote products derived from this
     software without specific prior written permission.

NO EXPRESS OR IMPLIED LICENSES TO ANY PARTY'S PATENT RIGHTS ARE GRANTED BY
THIS LICENSE. THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND
CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
```

## Support

### Documentation
- **FHEVM Documentation**: [https://docs.zama.ai/fhevm](https://docs.zama.ai/fhevm)
- **Hardhat Documentation**: [https://hardhat.org/docs](https://hardhat.org/docs)
- **Wagmi Documentation**: [https://wagmi.sh](https://wagmi.sh)
- **RainbowKit Documentation**: [https://www.rainbowkit.com/docs](https://www.rainbowkit.com/docs)

### Community
- **GitHub Issues**: [Report bugs or request features](https://github.com/your-repo/FHEverse/issues)
- **Discussions**: [Join community discussions](https://github.com/your-repo/FHEverse/discussions)
- **Zama Discord**: [https://discord.gg/zama](https://discord.gg/zama)
- **Ethereum Stack Exchange**: [https://ethereum.stackexchange.com/](https://ethereum.stackexchange.com/)

### Getting Help

If you encounter issues:

1. Check existing GitHub issues
2. Review the documentation
3. Ask in community channels
4. Create a detailed bug report with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node version, network, etc.)
   - Error messages and logs

---

## Acknowledgments

- **Zama**: For the FHEVM protocol and development tools
- **Hardhat Team**: For the excellent development framework
- **Rainbow Team**: For the beautiful wallet connection UX
- **Ethereum Community**: For the incredible ecosystem

---

**Built with passion for decentralized gaming** 🎮⛓️

*Ready to duel? Deploy your contract and start playing!*
