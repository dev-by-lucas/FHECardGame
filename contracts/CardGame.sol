// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CardGame {
    uint8 private constant DECK_SIZE = 13;
    uint8 private constant HAND_SIZE = 5;

    struct Game {
        uint8[HAND_SIZE] playerHand;
        uint8[HAND_SIZE] systemHand;
        bool[HAND_SIZE] playerUsed;
        bool[HAND_SIZE] systemRevealed;
        uint8 roundsPlayed;
        uint8 playerScore;
        uint8 systemScore;
        bool active;
        uint8 lastSystemCard;
    }

    mapping(address => Game) private games;
    uint256 private nonce;

    event GameStarted(address indexed player, uint8[HAND_SIZE] playerHand);
    event RoundPlayed(
        address indexed player,
        uint8 playerCard,
        uint8 systemCard,
        uint8 playerScore,
        uint8 systemScore,
        uint8 roundsPlayed
    );
    event GameFinished(address indexed player, uint8 playerScore, uint8 systemScore);

    function startGame() external {
        Game storage game = games[msg.sender];

        _dealHands(game, msg.sender);

        emit GameStarted(msg.sender, game.playerHand);
    }

    function playCard(uint8 cardValue) external {
        Game storage game = games[msg.sender];
        require(game.active, "Game not active");
        require(game.roundsPlayed < HAND_SIZE, "Game finished");

        (uint8 playerIndex, bool hasCard) = _playerCardIndex(game, cardValue);
        require(hasCard, "Card unavailable");

        game.playerUsed[playerIndex] = true;

        uint8 systemIndex = _nextSystemIndex(game);
        uint8 systemCard = game.systemHand[systemIndex];
        game.systemRevealed[systemIndex] = true;
        game.lastSystemCard = systemCard;

        uint8 playerCard = game.playerHand[playerIndex];

        if (playerCard > systemCard) {
            game.playerScore += 1;
        } else if (playerCard < systemCard) {
            game.systemScore += 1;
        }

        game.roundsPlayed += 1;

        emit RoundPlayed(
            msg.sender,
            playerCard,
            systemCard,
            game.playerScore,
            game.systemScore,
            game.roundsPlayed
        );

        if (game.roundsPlayed == HAND_SIZE) {
            game.active = false;
            emit GameFinished(msg.sender, game.playerScore, game.systemScore);
        }
    }

    function getGame(address player)
        external
        view
        returns (
            uint8[HAND_SIZE] memory playerHand,
            bool[HAND_SIZE] memory playerUsed,
            uint8[HAND_SIZE] memory systemHand,
            bool[HAND_SIZE] memory systemRevealed,
            uint8 roundsPlayed,
            uint8 playerScore,
            uint8 systemScore,
            bool active,
            uint8 lastSystemCard
        )
    {
        Game storage game = games[player];
        return (
            game.playerHand,
            game.playerUsed,
            game.systemHand,
            game.systemRevealed,
            game.roundsPlayed,
            game.playerScore,
            game.systemScore,
            game.active,
            game.lastSystemCard
        );
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
                game.playerHand[i] = card;
                game.playerUsed[i] = false;
            } else {
                uint8 systemPosition = i - HAND_SIZE;
                game.systemHand[systemPosition] = card;
                game.systemRevealed[systemPosition] = false;
            }

            randomSeed = uint256(keccak256(abi.encode(randomSeed, card, i, player)));
        }

        game.roundsPlayed = 0;
        game.playerScore = 0;
        game.systemScore = 0;
        game.active = true;
        game.lastSystemCard = 0;
    }

    function _playerCardIndex(Game storage game, uint8 cardValue) private view returns (uint8, bool) {
        for (uint8 i = 0; i < HAND_SIZE; i++) {
            if (!game.playerUsed[i] && game.playerHand[i] == cardValue) {
                return (i, true);
            }
        }
        return (0, false);
    }

    function _nextSystemIndex(Game storage game) private view returns (uint8) {
        for (uint8 i = 0; i < HAND_SIZE; i++) {
            if (!game.systemRevealed[i]) {
                return i;
            }
        }
        revert("System has no cards");
    }

    function _random(address player) private returns (uint256) {
        nonce += 1;
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, player, nonce))); // solhint-disable-line not-rely-on-time
    }
}
