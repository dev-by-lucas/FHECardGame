import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { sepolia } from 'viem/chains';
import { Contract } from 'ethers';

import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../config/contracts';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import '../styles/CardGameApp.css';

const ZERO_HANDLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

type GameState = {
  playerHand: string[];
  playerUsed: boolean[];
  systemHand: string[];
  systemRevealed: boolean[];
  roundsPlayed: number;
  playerScore: string;
  systemScore: string;
  active: boolean;
  lastSystemCard: string;
};

type RoundSummary = {
  round: number;
  playerCardHandle: string;
  systemCardHandle: string;
};

const INITIAL_DECRYPTED: Record<string, number> = { [ZERO_HANDLE]: 0 };

const EMPTY_GAME: GameState = {
  playerHand: [],
  playerUsed: [],
  systemHand: [],
  systemRevealed: [],
  roundsPlayed: 0,
  playerScore: ZERO_HANDLE,
  systemScore: ZERO_HANDLE,
  active: false,
  lastSystemCard: ZERO_HANDLE,
};

function parseGame(rawGame: any): GameState {
  return {
    playerHand: rawGame[0].map((value: string) => value),
    playerUsed: rawGame[1].map((value: boolean) => value),
    systemHand: rawGame[2].map((value: string) => value),
    systemRevealed: rawGame[3].map((value: boolean) => value),
    roundsPlayed: Number(rawGame[4]),
    playerScore: rawGame[5],
    systemScore: rawGame[6],
    active: rawGame[7],
    lastSystemCard: rawGame[8],
  };
}

function formatValue(handle: string, decrypted: Record<string, number>): string {
  if (!handle || handle === ZERO_HANDLE) {
    return '-';
  }
  const value = decrypted[handle];
  return value === undefined ? '...' : String(value);
}

function outcomeClass(playerValue?: number, systemValue?: number): 'player' | 'system' | 'draw' | 'pending' {
  if (playerValue === undefined || systemValue === undefined) {
    return 'pending';
  }
  if (playerValue > systemValue) {
    return 'player';
  }
  if (playerValue < systemValue) {
    return 'system';
  }
  return 'draw';
}

function outcomeLabel(playerValue?: number, systemValue?: number): string {
  if (playerValue === undefined || systemValue === undefined) {
    return 'Awaiting decryption';
  }
  if (playerValue > systemValue) {
    return 'You win';
  }
  if (playerValue < systemValue) {
    return 'System wins';
  }
  return 'Draw';
}

export function CardGameApp() {
  const { address, chainId, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const ethersSigner = useEthersSigner({ chainId });
  const { instance, isLoading: isZamaLoading, error: zamaError } = useZamaInstance();

  const [gameState, setGameState] = useState<GameState>(EMPTY_GAME);
  const [roundHistory, setRoundHistory] = useState<RoundSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [decryptedValues, setDecryptedValues] = useState<Record<string, number>>(INITIAL_DECRYPTED);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);

  const contractConfigured = useMemo(
    () => CONTRACT_ADDRESS.toLowerCase() !== '0x0000000000000000000000000000000000000000',
    []
  );
  const hasValidAddress = useMemo(() => Boolean(address), [address]);
  const isOnSepolia = chainId === sepolia.id || chainId === undefined;

  const fetchGame = useCallback(async (): Promise<GameState | null> => {
    if (!publicClient || !hasValidAddress || !contractConfigured) {
      return null;
    }

    try {
      const rawGame = await publicClient.readContract({
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: 'getGame',
        args: [address!],
      });

      const parsed = parseGame(rawGame);
      setGameState(parsed);
      return parsed;
    } catch (err) {
      console.error('Failed to fetch game', err);
      setError('Unable to load game state');
      return null;
    }
  }, [publicClient, hasValidAddress, address, contractConfigured]);

  useEffect(() => {
    if (!isConnected) {
      setGameState(EMPTY_GAME);
      setRoundHistory([]);
      setError(null);
      setStatusMessage(null);
      setDecryptedValues(INITIAL_DECRYPTED);
      setDecryptionError(null);
      return;
    }

    if (!contractConfigured) {
      setError('Set the deployed CardGame address to interact.');
      return;
    }

    fetchGame();
  }, [isConnected, fetchGame, contractConfigured]);

  const decryptHandles = useCallback(
    async (handles: string[]) => {
      if (!contractConfigured || !instance) {
        return;
      }

      const signer = await ethersSigner;
      if (!signer) {
        return;
      }

      const unique = Array.from(
        new Set(
          handles.filter((handle) => handle && handle !== ZERO_HANDLE && decryptedValues[handle] === undefined)
        )
      );

      if (unique.length === 0) {
        return;
      }

      try {
        setIsDecrypting(true);
        setDecryptionError(null);

        const keypair = instance.generateKeypair();
        const contractAddresses = [CONTRACT_ADDRESS];
        const startTimestamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = '7';
        const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimestamp, durationDays);
        const { EIP712Domain, ...messageTypes } = eip712.types as Record<string, any>;
        const signature = await signer.signTypedData(eip712.domain, messageTypes, eip712.message);

        const signerAddress = await signer.getAddress();
        const decrypted = await instance.userDecrypt(
          unique.map((handle) => ({ handle, contractAddress: CONTRACT_ADDRESS })),
          keypair.privateKey,
          keypair.publicKey,
          signature.replace(/^0x/, ''),
          contractAddresses,
          signerAddress,
          startTimestamp,
          durationDays
        );

        setDecryptedValues((prev) => {
          const next = { ...prev };
          for (const handle of unique) {
            const value = decrypted[handle];
            if (typeof value === 'bigint') {
              next[handle] = Number(value);
            }
          }
          return next;
        });
      } catch (err) {
        console.error('Failed to decrypt handles', err);
        setDecryptionError('Unable to decrypt encrypted values');
      } finally {
        setIsDecrypting(false);
      }
    },
    [contractConfigured, instance, ethersSigner, decryptedValues]
  );

  useEffect(() => {
    if (!isConnected || !contractConfigured || !instance) {
      return;
    }

    const handles = new Set<string>();
    gameState.playerHand.forEach((handle) => handles.add(handle));
    gameState.systemHand.forEach((handle, index) => {
      if (gameState.systemRevealed[index]) {
        handles.add(handle);
      }
    });
    if (gameState.playerScore) {
      handles.add(gameState.playerScore);
    }
    if (gameState.systemScore) {
      handles.add(gameState.systemScore);
    }
    if (gameState.lastSystemCard) {
      handles.add(gameState.lastSystemCard);
    }
    roundHistory.forEach((round) => {
      handles.add(round.playerCardHandle);
      handles.add(round.systemCardHandle);
    });

    if (handles.size > 0) {
      decryptHandles(Array.from(handles));
    }
  }, [isConnected, contractConfigured, instance, gameState, roundHistory, decryptHandles]);

  const handleStartGame = useCallback(async () => {
    if (!isConnected) {
      setError('Connect your wallet to start');
      return;
    }

    if (!contractConfigured) {
      setError('Set the deployed CardGame address to start playing');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const signer = await ethersSigner;
      if (!signer) {
        setError('Signer unavailable');
        setIsLoading(false);
        return;
      }

      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.startGame();
      setStatusMessage('Creating a new encrypted hand...');
      await tx.wait();

      setDecryptedValues(INITIAL_DECRYPTED);
      const updated = await fetchGame();
      if (updated) {
        setRoundHistory([]);
        setStatusMessage('New game is ready. Good luck!');
      }
    } catch (err) {
      console.error('Failed to start game', err);
      setError('Failed to start the game');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, ethersSigner, fetchGame, contractConfigured]);

  const handlePlayCard = useCallback(
    async (index: number, handle: string) => {
      if (!contractConfigured) {
        setError('Set the deployed CardGame address to start playing');
        return;
      }

      if (!gameState.active) {
        setError('Start a new game first');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const signer = await ethersSigner;
        if (!signer) {
          setError('Signer unavailable');
          setIsLoading(false);
          return;
        }

        const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const tx = await contract.playCard(index);
        const displayValue = decryptedValues[handle];
        setStatusMessage(displayValue !== undefined ? `Playing card ${displayValue}...` : 'Submitting encrypted move...');
        await tx.wait();

        const updated = await fetchGame();
        if (updated) {
          setRoundHistory((prev) => [
            ...prev,
            {
              round: updated.roundsPlayed,
              playerCardHandle: handle,
              systemCardHandle: updated.lastSystemCard,
            },
          ]);

          if (!updated.active) {
            const playerValue = decryptedValues[updated.playerScore];
            const systemValue = decryptedValues[updated.systemScore];
            const winnerMessage = outcomeLabel(playerValue, systemValue);
            setStatusMessage(winnerMessage);
          } else {
            setStatusMessage(`Round ${updated.roundsPlayed} resolved.`);
          }
        }
      } catch (err) {
        console.error('Failed to play card', err);
        setError('Transaction failed. Try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [gameState.active, ethersSigner, fetchGame, contractConfigured, decryptedValues]
  );

  const playableCards = useMemo(() => {
    return gameState.playerHand.map((handle, index) => ({
      index,
      handle,
      used: gameState.playerUsed[index],
      value: decryptedValues[handle],
    }));
  }, [gameState.playerHand, gameState.playerUsed, decryptedValues]);

  const revealedSystemCards = useMemo(() => {
    return gameState.systemHand.map((handle, index) => ({
      index,
      handle,
      revealed: gameState.systemRevealed[index],
      value: gameState.systemRevealed[index] ? decryptedValues[handle] : undefined,
    }));
  }, [gameState.systemHand, gameState.systemRevealed, decryptedValues]);

  const playerScoreDisplay = formatValue(gameState.playerScore, decryptedValues);
  const systemScoreDisplay = formatValue(gameState.systemScore, decryptedValues);

  const combinedErrors = useMemo(
    () => [error, decryptionError, zamaError].filter(Boolean) as string[],
    [error, decryptionError, zamaError]
  );

  return (
    <div className="card-game-app">
      <section className="game-panel">
        <header className="game-header">
          <div>
            <h2>Card Duel Arena</h2>
            <p>Draw five encrypted cards and outscore the system in five rounds.</p>
          </div>
          <div className="scoreboard">
            <div>
              <span className="score-label">Player</span>
              <span className="score-value">{playerScoreDisplay}</span>
            </div>
            <div>
              <span className="score-label">System</span>
              <span className="score-value">{systemScoreDisplay}</span>
            </div>
          </div>
        </header>

        {combinedErrors.map((message) => (
          <div key={message} className="feedback error">
            {message}
          </div>
        ))}
        {statusMessage && combinedErrors.length === 0 && (
          <div className="feedback info">{statusMessage}</div>
        )}
        {isDecrypting && combinedErrors.length === 0 && (
          <div className="feedback info">Decrypting encrypted values...</div>
        )}
        {isZamaLoading && (
          <div className="feedback info">Initializing Zama relayer...</div>
        )}

        <div className="actions">
          <button
            className="primary-button"
            onClick={handleStartGame}
            disabled={
              isLoading ||
              isDecrypting ||
              isZamaLoading ||
              !isConnected ||
              !isOnSepolia ||
              !contractConfigured
            }
          >
            {gameState.active ? 'Restart Game' : 'Start Game'}
          </button>
          {!isOnSepolia && <span className="network-warning">Switch to Sepolia to play.</span>}
          {!contractConfigured && <span className="network-warning">Set CONTRACT_ADDRESS to the deployed value.</span>}
        </div>

        <div className="cards-section">
          <h3>Your Hand</h3>
          <div className="card-grid">
            {playableCards.length === 0 && <p className="empty-state">Start a game to receive cards.</p>}
            {playableCards.map((card) => (
              <button
                key={`player-${card.index}`}
                className={`card ${card.used ? 'card-used' : 'card-ready'}`}
                disabled={
                  card.used ||
                  !gameState.active ||
                  isLoading ||
                  isDecrypting ||
                  isZamaLoading ||
                  !contractConfigured
                }
                onClick={() => handlePlayCard(card.index, card.handle)}
              >
                <span className="card-value">{card.value !== undefined ? card.value : '...'}</span>
                <span className="card-label">{card.used ? 'Played' : 'Play'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="cards-section">
          <h3>System Cards</h3>
          <div className="card-grid">
            {revealedSystemCards.length === 0 && <p className="empty-state">System cards remain hidden.</p>}
            {revealedSystemCards.map((card) => (
              <div
                key={`system-${card.index}`}
                className={`card system-card ${card.revealed ? 'card-revealed' : 'card-hidden'}`}
              >
                <span className="card-value">
                  {card.revealed ? (card.value !== undefined ? card.value : '...') : '?'}
                </span>
                <span className="card-label">Round {card.index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="history-section">
          <h3>Round History</h3>
          {roundHistory.length === 0 ? (
            <p className="empty-state">Play a card to see the round summary.</p>
          ) : (
            <ul className="history-list">
              {roundHistory.map((round) => {
                const playerValue = decryptedValues[round.playerCardHandle];
                const systemValue = decryptedValues[round.systemCardHandle];
                const resultClass = outcomeClass(playerValue, systemValue);

                return (
                  <li key={`history-${round.round}`} className={`history-item ${resultClass}`}>
                    <span>Round {round.round}: </span>
                    <span>You played {playerValue !== undefined ? playerValue : '...'}</span>
                    <span className="versus">vs</span>
                    <span>System {systemValue !== undefined ? systemValue : '...'}</span>
                    <span className="result">{outcomeLabel(playerValue, systemValue)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
