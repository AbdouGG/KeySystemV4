import React from 'react';

interface CheckpointButtonProps {
  currentCheckpoint: number;
  onClick: () => void;
  disabled?: boolean;
}

export const CheckpointButton: React.FC<CheckpointButtonProps> = ({
  currentCheckpoint,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {disabled ? 'Processing...' : `Continue to Checkpoint ${currentCheckpoint}`}
    </button>
  );
};