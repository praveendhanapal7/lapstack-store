import { handleUpload } from '@vercel/blob/client';
import { isAdmin } from '@/lib/auth';
export const dynamic = 'force-dynamic';

const IMG = ['image/jpeg', 'image/png', 'image/webp'];

// Seller photos and bills go to the private store; product images to the public one.
const isSell = (body) => String(body?.payload?.pathname || body?.payload?.blob?.pathname || '').startsWith('sell/');

// Issues one-time upload tokens so the browser can send files straight to Vercel Blob
// (avoids the 4.5 MB request limit on serverless functions).
export async function POST(request) {
  const body = await request.json();
  try {
    const json = await handleUpload({
      body,
      request,
      token: isSell(body) ? process.env.SELL_BLOB_READ_WRITE_TOKEN : process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        if (pathname.startsWith('products/')) {
          if (!(await isAdmin())) throw new Error('Unauthorized');
          return { allowedContentTypes: IMG, maximumSizeInBytes: 8 * 1024 * 1024, addRandomSuffix: true };
        }
        if (pathname.startsWith('sell/')) {
          // Anyone can upload (sell form); files land in the private store, readable only via admin.
          return { allowedContentTypes: [...IMG, 'application/pdf'], maximumSizeInBytes: 10 * 1024 * 1024, addRandomSuffix: true };
        }
        throw new Error('Not allowed');
      },
      onUploadCompleted: async () => {},
    });
    return Response.json(json);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}
