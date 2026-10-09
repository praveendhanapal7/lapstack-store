import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'Lapstack: premium refurbished laptops, honest prices';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Link preview for the home page and any page without its own image.
export default async function Image() {
  const logo = await readFile(join(process.cwd(), 'public/logo.png'));
  const src = `data:image/png;base64,${logo.toString('base64')}`;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 90, background: '#fff', backgroundImage: 'radial-gradient(circle at 50% 0%, #FFF3C4 0%, #fff 60%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <img src={src} width={84} height={84} />
          <div style={{ fontSize: 52, fontWeight: 700, color: '#1d1d1f' }}>Lapstack</div>
        </div>
        <div style={{ fontSize: 66, color: "#1d1d1f", marginTop: 50, letterSpacing: -2, lineHeight: 1.15 }}>Premium refurbished laptops.</div>
        <div style={{ fontSize: 66, color: "#B88A00", letterSpacing: -2, lineHeight: 1.15 }}>Honest prices.</div>
        <div style={{ fontSize: 34, color: '#555', marginTop: 34 }}>Dell · Lenovo · HP · Apple. Tested. Delivered in 2 days.</div>
      </div>
    ),
    size
  );
}
