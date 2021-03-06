import { NextApiRequest, NextApiResponse } from 'next';
import { Document } from '@prismicio/client/types/documents';
import { getPrismicClient } from '../../services/prismic';

function linkResolver(doc: Document): string {
  if (doc.type === 'posts') {
    return `/post/${doc.uid}`;
  }
  return '/';
}

export default async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  const { token: ref, documentId } = req.query;

  const redirectUrl = await getPrismicClient(req)
    .getPreviewResolver(ref, documentId)
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }

  res.setPreviewData({ ref });
  res.writeHead(302, { Location: `${redirectUrl}` });
  res.end();
};
