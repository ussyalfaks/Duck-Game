import React from 'react';
import { useHoneycomb } from '../../hooks/useHoneycomb';

export const PlayButton: React.FC = () => {
  const { profile, canPlay, isLoading, error, startGame } = useHoneycomb();

  const handlePlay = async () => {
    if (await startGame()) {
      // Navigate to game or start game logic
      console.log("Starting game...");
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <div>
      {canPlay && (
        <button
          onClick={handlePlay}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Loading...' : 'Play Game'}
        </button>
      )}
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};
