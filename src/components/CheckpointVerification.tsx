import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  completeCheckpoint,
  getCheckpoints,
} from '../utils/checkpointManagement';

export function CheckpointVerification() {
  const { number } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyCheckpoint = async () => {
      if (!number || !['1', '2', '3'].includes(number)) {
        setError('Invalid checkpoint number');
        setTimeout(() => navigate('/', { replace: true }), 2000);
        return;
      }

      const token = searchParams.get('token');
      if (!token) {
        setError('Invalid verification token');
        setTimeout(() => navigate('/', { replace: true }), 2000);
        return;
      }

      const checkpointNumber = parseInt(number, 10);

      try {
        setIsVerifying(true);
        const currentCheckpoints = await getCheckpoints();

        // Verify prerequisites
        if (
          (checkpointNumber === 2 && !currentCheckpoints.checkpoint1) ||
          (checkpointNumber === 3 &&
            (!currentCheckpoints.checkpoint1 ||
              !currentCheckpoints.checkpoint2))
        ) {
          setError('Previous checkpoints must be completed first');
          setTimeout(() => navigate('/', { replace: true }), 2000);
          return;
        }

        await completeCheckpoint(checkpointNumber, token);

        // Success - redirect after a short delay
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1500);
      } catch (err: any) {
        console.error('Error during checkpoint verification:', err);
        setError(err.message || 'An error occurred during verification');
        setTimeout(() => navigate('/', { replace: true }), 2000);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyCheckpoint();
  }, [number, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">
          Verifying Checkpoint {number}
        </h1>
        {error ? (
          <p className="text-red-400">{error}</p>
        ) : isVerifying ? (
          <p>Please wait while we verify your completion...</p>
        ) : (
          <p className="text-green-400">Verification successful!</p>
        )}
      </div>
    </div>
  );
}
