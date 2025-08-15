import React from 'react';

interface HowToPlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlay: React.FC<HowToPlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-brand-surface rounded-lg shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-brand-secondary font-['Blockblueprint']">🎮 How to Play</h2>
          <button
            onClick={onClose}
            className="text-brand-text-muted hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Game Challenge */}
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-amber-800 mb-4 font-['Blockblueprint']">🏆 Season 1 Challenge</h3>
            <div className="space-y-2 text-amber-800">
              <p><strong>🎯 Goal:</strong> Complete all 5 levels</p>
              <p><strong>⏱️ Time Limit:</strong> 30 seconds</p>
              <p><strong>💖 Lives:</strong> 3 hearts</p>
              <p><strong>🔑 Mechanics:</strong> Collect keys, unlock doors</p>
              <p><strong>⚠️ Hazards:</strong> Spikes cost 1 heart</p>
              <p><strong>🛡️ Safety:</strong> 2s invincibility after damage</p>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-blue-800 mb-4 font-['Blockblueprint']">🎮 Controls</h3>
            <div className="space-y-2 text-blue-800">
              <p><strong>Movement:</strong> WASD or Arrow Keys</p>
              <p><strong>Jump:</strong> W, Up Arrow, or Spacebar</p>
              <p><strong>Left:</strong> A or Left Arrow</p>
              <p><strong>Right:</strong> D or Right Arrow</p>
              <p><strong>Down:</strong> S or Down Arrow (Duck)</p>
            </div>
          </div>
        </div>

        {/* Game Rules */}
        <div className="mt-6 bg-brand-primary bg-opacity-10 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4 text-white font-['Blockblueprint']">📋 Game Rules</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-2 text-sm text-brand-text-muted">
              <li>• Use WASD or Arrow Keys to move</li>
              <li>• Jump with W, Up Arrow, or Spacebar</li>
              <li>• Collect the key in each level</li>
              <li>• Reach the door to complete the level</li>
            </ul>
            <ul className="space-y-2 text-sm text-brand-text-muted">
              <li>• Avoid spikes - they cost 1 heart!</li>
              <li>• Complete all 5 levels before time runs out</li>
              <li>• You have 3 hearts per season</li>
              <li>• Progress is saved on the blockchain</li>
            </ul>
          </div>
        </div>

        {/* Heart System */}
        <div className="mt-6 bg-red-100 border border-red-300 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-red-800 mb-4 font-['Blockblueprint']">💖 Heart System</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-2 text-sm text-red-700">
              <li>• Start each season with 3 hearts</li>
              <li>• Lose 1 heart when touching spikes</li>
              <li>• Losing a heart restarts the current level</li>
            </ul>
            <ul className="space-y-2 text-sm text-red-700">
              <li>• Get 2 seconds of invincibility after damage</li>
              <li>• Lose all hearts = restart the entire season</li>
              <li>• Hearts reset at the beginning of each season</li>
            </ul>
          </div>
        </div>

        {/* Gameplay Tips */}
        <div className="mt-6 bg-green-50 border border-green-200 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-green-800 mb-4 font-['Blockblueprint']">💡 Pro Tips</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-2 text-sm text-green-700">
              <li>🏃‍♂️ Move quickly - you only have 30 seconds!</li>
              <li>👀 Look ahead to plan your route</li>
              <li>⏰ Time continues even after taking damage</li>
            </ul>
            <ul className="space-y-2 text-sm text-green-700">
              <li>🔑 Keys are required to open doors</li>
              <li>⚡ Use your invincibility frames wisely</li>
              <li>🎯 Practice makes perfect!</li>
            </ul>
          </div>
        </div>

        {/* Blockchain Integration */}
        <div className="mt-6 bg-purple-50 border border-purple-200 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-purple-800 mb-4 font-['Blockblueprint']">⛓️ Blockchain Features</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-2 text-sm text-purple-700">
              <li>🏆 Completing Season 1 earns you a badge</li>
              <li>📊 Your progress is stored on Solana</li>
              <li>🎖️ Badges are NFTs you truly own</li>
            </ul>
            <ul className="space-y-2 text-sm text-purple-700">
              <li>👤 Create your profile on-chain</li>
              <li>🔒 Your achievements are permanent</li>
              <li>🌟 Collect badges from different seasons</li>
            </ul>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={onClose}
            className="bg-brand-secondary text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-colors font-['Blockblueprint']"
          >
            Got it! Let's Play 🎮
          </button>
        </div>
      </div>
    </div>
  );
};