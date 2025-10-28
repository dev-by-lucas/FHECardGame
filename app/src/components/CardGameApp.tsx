import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { sepolia } from 'viem/chains';
import { Contract } from 'ethers';

import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../config/contracts';
import { useEthersSigner } from '../hooks/useEthersSigner';
import '../styles/CardGameApp.css';

type GameState = {
  playerHand: number[];
  playerUsed: boolean[];
  systemHand: number[];
  systemRevealed: boolean[];
  roundsPlayed: number;
  playerScore: number;
  systemScore: number;
  active: boolean;
  lastSystemCard: number;
};

type RoundSummary = {
  round: number;
  playerCard: number;
  systemCard: number;
  result: 'player' | 'system' | 'draw';
};

const EMPTY_GAME: GameState = {
  playerHand: [],
  playerUsed: [],
  systemHand: [],
  systemRevealed: [],
  roundsPlayed: 0,
  playerScore: 0,
  systemScore: 0,
  active: false,
  lastSystemCard: 0,
};

function parseGame(rawGame: any): GameState {
  return {
    playerHand: rawGame[0].map((value: bigint) => Number(value)),
    playerUsed: rawGame[1].map((value: boolean) => value),
    systemHand: rawGame[2].map((value: bigint) => Number(value)),
    systemRevealed: rawGame[3].map((value: boolean) => value),
    roundsPlayed: Number(rawGame[4]),
    playerScore: Number(rawGame[5]),
    systemScore: Number(rawGame[6]),
    active: rawGame[7],
    lastSystemCard: Number(rawGame[8]),
  };
}

function outcome(player: number, system: number): RoundSummary['result'] {
  if (player > system) {
    return 'player';
  }
  if (player < system) {
    return 'system';
  }
  return 'draw';
}

export function CardGameApp() {
  const { address, chainId, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const ethersSigner = useEthersSigner({ chainId });

  const [gameState, setGameState] = useState<GameState>(EMPTY_GAME);
  const [roundHistory, setRoundHistory] = useState<RoundSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const contractConfigured = useMemo(
    () => CONTRACT_ADDRESS.toLowerCase() !== '0x0000000000000000000000000000000000000000',
    []
  );
  const hasValidAddress = useMemo(() => Boolean(address), [address]);

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
      return;
    }

    if (!contractConfigured) {
      setError('Set the deployed CardGame address to interact.');
      return;
    }

    fetchGame();
  }, [isConnected, fetchGame, contractConfigured]);

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
      setStatusMessage('Creating a new hand...');
      await tx.wait();

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
    async (card: number) => {
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
        const tx = await contract.playCard(card);
        setStatusMessage(`Playing card ${card}...`);
        await tx.wait();

        const updated = await fetchGame();
        if (updated) {
          const systemCard = updated.lastSystemCard;
          setRoundHistory((prev) => [
            ...prev,
            {
              round: updated.roundsPlayed,
              playerCard: card,
              systemCard,
              result: outcome(card, systemCard),
            },
          ]);

          if (!updated.active) {
            const winner =
              updated.playerScore === updated.systemScore
                ? 'The game ends in a draw.'
                : updated.playerScore > updated.systemScore
                ? 'You win the match!'
                : 'The system wins this time.';
            setStatusMessage(winner);
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
    [gameState.active, ethersSigner, fetchGame, contractConfigured]
  );

  const playableCards = useMemo(() => {
    if (!gameState.playerHand.length) {
      return [];
    }
    return gameState.playerHand.map((card, index) => ({
      value: card,
      used: gameState.playerUsed[index],
    }));
  }, [gameState.playerHand, gameState.playerUsed]);

  const revealedSystemCards = useMemo(() => {
    if (!gameState.systemHand.length) {
      return [];
    }
    return gameState.systemHand.map((card, index) => ({
      value: card,
      revealed: gameState.systemRevealed[index],
    }));
  }, [gameState.systemHand, gameState.systemRevealed]);

  const isOnSepolia = chainId === sepolia.id || chainId === undefined;

  return (
    <div className="card-game-app">
      <section className="game-panel">
        <header className="game-header">
          <div>
            <h2>Card Duel Arena</h2>
            <p>Draw five cards and outscore the system in five rounds.</p>
          </div>
          <div className="scoreboard">
            <div>
              <span className="score-label">Player</span>
              <span className="score-value">{gameState.playerScore}</span>
            </div>
            <div>
              <span className="score-label">System</span>
              <span className="score-value">{gameState.systemScore}</span>
            </div>
          </div>
        </header>

        {error && <div className="feedback error">{error}</div>}
        {statusMessage && !error && <div className="feedback info">{statusMessage}</div>}

        <div className="actions">
          <button
            className="primary-button"
            onClick={handleStartGame}
            disabled={isLoading || !isConnected || !isOnSepolia || !contractConfigured}
          >
            {gameState.active ? 'Restart Game' : 'Start Game'}
          </button>
          {!isOnSepolia && <span className="network-warning">Switch to Sepolia to play.</span>}
        </div>

        <div className="cards-section">
          <h3>Your Hand</h3>
          <div className="card-grid">
            {playableCards.length === 0 && <p className="empty-state">Start a game to receive cards.</p>}
            {playableCards.map((card) => (
              <button
                key={`player-${card.value}`}
                className={`card ${card.used ? 'card-used' : 'card-ready'}`}
                disabled={card.used || !gameState.active || isLoading || !contractConfigured}
                onClick={() => handlePlayCard(card.value)}
              >
                <span className="card-value">{card.value}</span>
                <span className="card-label">{card.used ? 'Played' : 'Play'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="cards-section">
          <h3>System Cards</h3>
          <div className="card-grid">
            {revealedSystemCards.length === 0 && <p className="empty-state">System cards remain hidden.</p>}
            {revealedSystemCards.map((card, index) => (
              <div
                key={`system-${index}`}
                className={`card system-card ${card.revealed ? 'card-revealed' : 'card-hidden'}`}
              >
                <span className="card-value">{card.revealed ? card.value : '?'}</span>
                <span className="card-label">Round {index + 1}</span>
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
              {roundHistory.map((round) => (
                <li key={`history-${round.round}`} className={`history-item ${round.result}`}>
                  <span>Round {round.round}: </span>
                  <span>You played {round.playerCard}</span>
                  <span className="versus">vs</span>
                  <span>System {round.systemCard}</span>
                  <span className="result">{round.result === 'draw' ? 'Draw' : round.result === 'player' ? 'You win' : 'System wins'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
