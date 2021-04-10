import Prismic from '@prismicio/client';
import { DefaultClient } from '@prismicio/client/types/client';

export function getPrismicClient(req?: unknown): DefaultClient {
  // ENDPOINT = process.env.PRISMIC_API_ENDPOINT
  const prismic = Prismic.client(
    'https://spacetravellingworld.cdn.prismic.io/api/v2',
    {
      req,
      accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    }
  );

  return prismic;
}
