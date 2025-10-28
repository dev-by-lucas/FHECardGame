export const CONTRACT_ADDRESS = '0xA70c60a4d77497b561d78055c973ee6f59083aE0';

export const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "playerScore",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "systemScore",
        "type": "uint8"
      }
    ],
    "name": "GameFinished",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8[5]",
        "name": "playerHand",
        "type": "uint8[5]"
      }
    ],
    "name": "GameStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "playerCard",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "systemCard",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "playerScore",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "systemScore",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "roundsPlayed",
        "type": "uint8"
      }
    ],
    "name": "RoundPlayed",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getGame",
    "outputs": [
      {
        "internalType": "uint8[5]",
        "name": "playerHand",
        "type": "uint8[5]"
      },
      {
        "internalType": "bool[5]",
        "name": "playerUsed",
        "type": "bool[5]"
      },
      {
        "internalType": "uint8[5]",
        "name": "systemHand",
        "type": "uint8[5]"
      },
      {
        "internalType": "bool[5]",
        "name": "systemRevealed",
        "type": "bool[5]"
      },
      {
        "internalType": "uint8",
        "name": "roundsPlayed",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "playerScore",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "systemScore",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "active",
        "type": "bool"
      },
      {
        "internalType": "uint8",
        "name": "lastSystemCard",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "hasActiveGame",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "cardValue",
        "type": "uint8"
      }
    ],
    "name": "playCard",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "remainingRounds",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
