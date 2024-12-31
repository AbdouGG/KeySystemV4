import { v4 as uuidv4 } from 'uuid';

// Generate a unique hardware ID based on browser fingerprinting
export const getHWID = (): string => {
  const storedHWID = localStorage.getItem('hwid');
  if (storedHWID) return storedHWID;

  // Create a more robust fingerprint
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
    navigator.deviceMemory,
    navigator.platform,
    !!navigator.webdriver,
    // Canvas fingerprinting
    (() => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      // Draw some text with specific styling
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#123456';
      ctx.fillText('Browser Fingerprint', 2, 2);

      return canvas.toDataURL();
    })(),
  ]
    .filter(Boolean)
    .join('|');

  // Create a consistent hash from the components
  const hash = components
    .split('')
    .reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) >>> 0;
    }, 0)
    .toString(16);

  // Add a random component that stays consistent for this browser
  const browserKey = localStorage.getItem('browser_key') || uuidv4();
  localStorage.setItem('browser_key', browserKey);

  // Combine hash with browser key for final HWID
  const hwid = `HWID-${hash}-${browserKey.slice(0, 8)}`;

  localStorage.setItem('hwid', hwid);
  return hwid;
};

// Function to verify if the HWID is valid
export const verifyHWID = (hwid: string): boolean => {
  const currentHWID = getHWID();
  return hwid === currentHWID;
};
