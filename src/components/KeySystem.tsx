import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { KeyDisplay } from './KeyDisplay';
import { CheckpointButton } from './CheckpointButton';
import { generateKey } from '../utils/keyGeneration';
import {
  getExistingValidKey,
  startKeyValidityCheck,
} from '../utils/keyManagement';
import { getCheckpointUrl } from '../utils/checkpointUrls';
import { getCheckpoints } from '../utils/checkpointManagement';
import type { CheckpointStatus, Key } from '../types';

export function KeySystem() {
  const [checkpoints, setCheckpoints] = useState<CheckpointStatus>({
    checkpoint1: false,
    checkpoint2: false,
    checkpoint3: false,
  });
  const [generatedKey, setGeneratedKey] = useState<Key | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        const existingKey = await getExistingValidKey();
        if (existingKey) {
          setGeneratedKey(existingKey);
        }
        const currentCheckpoints = await getCheckpoints();
        setCheckpoints(currentCheckpoints);
      } catch (e) {
        console.error('Error initializing system:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSystem();

    const cleanup = startKeyValidityCheck();

    const handleCheckpointUpdate = async () => {
      const currentCheckpoints = await getCheckpoints();
      setCheckpoints(currentCheckpoints);
    };

    window.addEventListener('checkpointsUpdated', handleCheckpointUpdate);

    return () => {
      window.removeEventListener('checkpointsUpdated', handleCheckpointUpdate);
      cleanup();
    };
  }, []);

  const getCurrentCheckpoint = () => {
    if (!checkpoints.checkpoint1) return 1;
    if (!checkpoints.checkpoint2) return 2;
    if (!checkpoints.checkpoint3) return 3;
    return 3;
  };

  const handleLinkvertiseClick = async () => {
    const currentCheckpoint = getCurrentCheckpoint();
    try {
      setIsProcessing(true);
      setError(null);
      const checkpointUrl = await getCheckpointUrl(currentCheckpoint);
      window.open(checkpointUrl, '_blank');
    } catch (error) {
      console.error('Error handling checkpoint:', error);
      setError('Error processing checkpoint');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateKey = async () => {
    if (
      !checkpoints.checkpoint1 ||
      !checkpoints.checkpoint2 ||
      !checkpoints.checkpoint3
    ) {
      setError('Please complete all checkpoints first');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      const key = await generateKey();
      setGeneratedKey(key);
    } catch (error: any) {
      setError(error.message || 'Error generating key');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const currentCheckpoint = getCurrentCheckpoint();
  const allCheckpointsCompleted =
    checkpoints.checkpoint1 &&
    checkpoints.checkpoint2 &&
    checkpoints.checkpoint3;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-md mx-auto p-6">
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-full bg-red-500 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-red-500 mb-2">Key System</h1>
          {allCheckpointsCompleted ? (
            <p className="text-green-400">All checkpoints completed!</p>
          ) : (
            <p className="text-gray-400">Checkpoint: {currentCheckpoint} / 3</p>
          )}
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-4">
            {error}
          </div>
        )}

        {!generatedKey ? (
          <div className="space-y-4">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
              <div className="space-y-4">
                {!allCheckpointsCompleted ? (
                  <div className="flex justify-center">
                    <CheckpointButton
                      currentCheckpoint={currentCheckpoint}
                      onClick={handleLinkvertiseClick}
                      disabled={isProcessing}
                    />
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateKey}
                    disabled={isProcessing}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Generating...' : 'Generate Key'}
                  </button>
                )}
                <div className="flex justify-center">
                  <button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors opacity-50 cursor-not-allowed"
                    disabled
                  >
                    Continue with Lootlabs
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <KeyDisplay keyData={generatedKey} />
        )}
      </div>
    </div>
  );
}
