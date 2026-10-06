'use client';
import { useEffect } from 'react';
import { track, product } from '@/lib/pixel';

// Fires Meta's ViewContent once when a laptop page opens.
export default function PixelViewContent({ id, name, price }) {
  useEffect(() => { track('ViewContent', product({ id, name, price })); }, [id]); // eslint-disable-line
  return null;
}
