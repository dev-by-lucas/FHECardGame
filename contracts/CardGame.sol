// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint8} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract CardGame is SepoliaConfig {
    using FHE for ebool;
    using FHE for euint8;

    uint8 private constant DECK_SIZE = 13;
    uint8 private constant HAND_SIZE = 5;

    struct Game {
        euint8[HAND_SIZE] playerHand;
        euint8[HAND_SIZE] systemHand;
        bool[HAND_SIZE] playerUsed;
        bool[HAND_SIZE] systemRevealed;
        uint8 roundsPlayed;
        euint8 playerScore;
        euint8 systemScore;
        bool active;
        euint8 lastSystemCard;
    }

    mapping(address => Game) private games;
    uint256 private nonce;

    event GameStarted(address indexed player, bytes32[HAND_SIZE] playerHand);
    event RoundPlayed(
        address indexed player,
        bytes32 playerCard,
        bytes32 systemCard,
        bytes32 playerScore,
        bytes32 systemScore,
        uint8 roundsPlayed
    );
    event GameFinished(address indexed player, bytes32 playerScore, bytes32 systemScore);

    constructor() SepoliaConfig() {}

    function startGame() external {
        Game storage game = games[msg.sender];

        _dealHands(game, msg.sender);

        emit GameStarted(msg.sender, _snapshotHand(game.playerHand));
    }

    function playCard(uint8 handIndex) external {
        Game storage game = games[msg.sender];
        require(game.active, "Game not active");
        require(game.roundsPlayed < HAND_SIZE, "Game finished");
        require(handIndex < HAND_SIZE, "Invalid card index");
        require(!game.playerUsed[handIndex], "Card already used");

        game.playerUsed[handIndex] = true;

        uint8 systemIndex = _nextSystemIndex(game);
        game.systemRevealed[systemIndex] = true;

        euint8 playerCard = game.playerHand[handIndex];
        euint8 systemCard = game.systemHand[systemIndex];

        systemCard = _allowForPlayer(systemCard, msg.sender);
        game.systemHand[systemIndex] = systemCard;
        game.lastSystemCard = systemCard;

        ebool playerWins = FHE.gt(playerCard, systemCard);
        ebool systemWins = FHE.gt(systemCard, playerCard);

        game.playerScore = _incrementScore(game.playerScore, playerWins, msg.sender);
        game.systemScore = _incrementScore(game.systemScore, systemWins, msg.sender);

        game.roundsPlayed += 1;

        emit RoundPlayed(
            msg.sender,
            euint8.unwrap(playerCard),
            euint8.unwrap(systemCard),
            euint8.unwrap(game.playerScore),
            euint8.unwrap(game.systemScore),
            game.roundsPlayed
        );

        if (game.roundsPlayed == HAND_SIZE) {
            game.active = false;
            emit GameFinished(msg.sender, euint8.unwrap(game.playerScore), euint8.unwrap(game.systemScore));
        }
    }

    function getGame(address player)
        external
        view
        returns (
            bytes32[HAND_SIZE] memory playerHand,
            bool[HAND_SIZE] memory playerUsed,
            bytes32[HAND_SIZE] memory systemHand,
            bool[HAND_SIZE] memory systemRevealed,
            uint8 roundsPlayed,
            bytes32 playerScore,
            bytes32 systemScore,
            bool active,
            bytes32 lastSystemCard
        )
    {
        Game storage game = games[player];

        playerHand = _snapshotHand(game.playerHand);
        systemHand = _snapshotHand(game.systemHand);
        playerUsed = _snapshotUsage(game.playerUsed);
        systemRevealed = _snapshotUsage(game.systemRevealed);
        roundsPlayed = game.roundsPlayed;
        playerScore = euint8.unwrap(game.playerScore);
        systemScore = euint8.unwrap(game.systemScore);
        active = game.active;
        lastSystemCard = euint8.unwrap(game.lastSystemCard);
    }

    function hasActiveGame(address player) external view returns (bool) {
        return games[player].active;
    }

    function remainingRounds(address player) external view returns (uint8) {
        Game storage game = games[player];
        if (!game.active && game.roundsPlayed == 0) {
            return HAND_SIZE;
        }

        return HAND_SIZE - game.roundsPlayed;
    }

    function _dealHands(Game storage game, address player) private {
        uint8[DECK_SIZE] memory deck;
        for (uint8 i = 0; i < DECK_SIZE; i++) {
            deck[i] = i + 1;
        }

        uint8 remaining = DECK_SIZE;
        uint256 randomSeed = _random(player);

        for (uint8 i = 0; i < HAND_SIZE * 2; i++) {
            uint256 index = randomSeed % remaining;
            uint8 card = deck[index];

            deck[index] = deck[remaining - 1];
            remaining -= 1;

            if (i < HAND_SIZE) {
                euint8 playerCard = FHE.asEuint8(card);
                game.playerHand[i] = _allowForPlayer(playerCard, player);
                game.playerUsed[i] = false;
            } else {
                uint8 systemPosition = i - HAND_SIZE;
                euint8 systemCard = FHE.asEuint8(card);
                game.systemHand[systemPosition] = _allowForContract(systemCard);
                game.systemRevealed[systemPosition] = false;
            }

            randomSeed = uint256(keccak256(abi.encode(randomSeed, card, i, player)));
        }

        game.roundsPlayed = 0;
        game.playerScore = _freshScore(player);
        game.systemScore = _freshScore(player);
        game.active = true;
        game.lastSystemCard = _freshScore(player);
    }

    function _nextSystemIndex(Game storage game) private view returns (uint8) {
        for (uint8 i = 0; i < HAND_SIZE; i++) {
            if (!game.systemRevealed[i]) {
                return i;
            }
        }
        revert("System has no cards");
    }

    function _incrementScore(euint8 current, ebool condition, address player) private returns (euint8) {
        euint8 addend = FHE.select(condition, FHE.asEuint8(1), FHE.asEuint8(0));
        euint8 updated = current.add(addend);
        return _allowForPlayer(updated, player);
    }

    function _freshScore(address player) private returns (euint8) {
        return _allowForPlayer(FHE.asEuint8(0), player);
    }

    function _allowForPlayer(euint8 value, address player) private returns (euint8) {
        value = value.allowThis();
        return value.allow(player);
    }

    function _allowForContract(euint8 value) private returns (euint8) {
        return value.allowThis();
    }

    function _snapshotHand(euint8[HAND_SIZE] storage hand) private view returns (bytes32[HAND_SIZE] memory snapshot) {
        for (uint8 i = 0; i < HAND_SIZE; i++) {
            snapshot[i] = euint8.unwrap(hand[i]);
        }
    }

    function _snapshotUsage(bool[HAND_SIZE] storage flags) private view returns (bool[HAND_SIZE] memory snapshot) {
        for (uint8 i = 0; i < HAND_SIZE; i++) {
            snapshot[i] = flags[i];
        }
    }

    function _random(address player) private returns (uint256) {
        nonce += 1;
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, player, nonce))); // solhint-disable-line not-rely-on-time
    }
}
