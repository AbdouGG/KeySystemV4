import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export const handler: Handler = async (event) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  // Get the checkpoint number and HWID from the URL
  const parts = event.path.split('/');
  const checkpointNumber = parseInt(parts[parts.length - 2], 10);
  const hwid = parts[parts.length - 1];

  if (!checkpointNumber || !hwid) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing checkpoint number or HWID' }),
    };
  }

  try {
    // Check for existing valid token
    const { data: existingToken } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('hwid', hwid)
      .eq('checkpoint_number', checkpointNumber)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    // If there's a valid token, use it
    if (existingToken) {
      return {
        statusCode: 302,
        headers: {
          ...headers,
          Location: `/checkpoint/${checkpointNumber}?token=${encodeURIComponent(
            existingToken.token
          )}`,
        },
        body: '',
      };
    }

    // Check rate limiting
    const { count } = await supabase
      .from('verification_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('hwid', hwid)
      .eq('checkpoint_number', checkpointNumber)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (count && count >= 3) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: 'Too many verification attempts. Please wait 5 minutes.',
        }),
      };
    }

    // Generate token using HWID and checkpoint
    const timestamp = Date.now();
    const token = Buffer.from(
      `${hwid}-${checkpointNumber}-${timestamp}`
    ).toString('base64');

    // Store the token
    const { error } = await supabase.from('verification_tokens').insert([
      {
        token,
        hwid,
        checkpoint_number: checkpointNumber,
        expires_at: new Date(timestamp + 2 * 60 * 1000), // 2 minutes expiry
        used: false,
      },
    ]);

    if (error) throw error;

    return {
      statusCode: 302,
      headers: {
        ...headers,
        Location: `/checkpoint/${checkpointNumber}?token=${encodeURIComponent(
          token
        )}`,
      },
      body: '',
    };
  } catch (error) {
    console.error('Error handling verification:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to process verification' }),
    };
  }
};