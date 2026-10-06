import { handleUpload } from '@vercel/blob/client';
import { isAdmin } from '@/lib/auth';
export const dynamic = 'force-dynamic';

const IMG = ['image/jpeg', 'image/png', 'image/webp'];

// Issues one-time upload tokens so the browser can send files straight to Vercel Blob
// (avoids the 4.5 MB request limit on serverless functions).
export async function POST(request) {
  const body = await request.json();
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (pathname.startsWith('products/')) {
          if (!(await isAdmin())) throw new Error('Unauthorized');
          return { allowedContentTypes: IMG, maximumSizeInBytes: 8 * 1024 * 1024, addRandomSuffix: true };
        }
        if (pathname.startsWith('sell/')) {
          // Public: sellers upload photos and an optional bill. Stored privately.
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
