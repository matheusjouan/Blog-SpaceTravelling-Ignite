/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  nextPage: Post;
  prevPage: Post;
  preview: boolean;
}

export default function Post({
  post,
  prevPage,
  nextPage,
  preview,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  const estimatedTimeToRead = post.data.content.reduce((acc, content) => {
    const totalHeading = content.heading.split(' ').length;
    const totalBody = RichText.asText(content.body).split(' ').length;

    const total = totalBody + totalHeading + acc;
    const min = Math.ceil(total / 200);
    return min;
  }, 0);

  const formattedTitle = (title: string): string => {
    return title.substring(0, 15).concat('...');
  };

  return (
    <>
      <Head>
        <title>Post - </title>
      </Head>

      <Header />

      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="banner" />
      </div>

      <section className={styles.container}>
        <div className={styles.headerPost}>
          <h1>{post.data.title}</h1>
          <div className={styles.infoPostContainer}>
            <div className={styles.infoContent}>
              <FiCalendar />
              <span>
                {format(
                  new Date(post.first_publication_date),
                  "dd ' ' MMM ' ' yyyy",
                  { locale: ptBR }
                )}
              </span>
            </div>

            <div className={styles.infoContent}>
              <FiUser />
              <span>{post.data.author}</span>
            </div>

            <div className={styles.infoContent}>
              <FiClock />
              {/* <time>4 min</time> */}
              <time>{estimatedTimeToRead} min</time>
            </div>
          </div>

          {post.first_publication_date !== post.last_publication_date && (
            <div className={styles.editPostContent}>
              <span>
                * editado em{' '}
                {format(
                  new Date(post.last_publication_date),
                  "dd ' ' MMM ' ' yyyy ' às ' HH:mm",
                  {
                    locale: ptBR,
                  }
                )}
              </span>
            </div>
          )}
        </div>

        <article className={styles.post}>
          {post.data.content.map(content => (
            <div className={styles.postSection} key={content.heading}>
              <h2>{content.heading}</h2>

              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </article>

        <div className={styles.paginationContainer}>
          {prevPage && (
            <div className={`${styles.paginationContent} ${styles.prevPost}`}>
              <p>{formattedTitle(prevPage.data.title)}</p>
              <Link href={prevPage.uid}>
                <a>Post Anterior</a>
              </Link>
            </div>
          )}

          {nextPage && (
            <div className={`${styles.paginationContent} ${styles.nextPost}`}>
              <p>{formattedTitle(nextPage.data.title)}</p>
              <Link href={nextPage.uid}>
                <a>Próximo Post</a>
              </Link>
            </div>
          )}
        </div>

        {preview && (
          <aside className={styles.buttonModePreview}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </section>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at('document.type', 'posts')
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  if (!response?.data) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const nextPage = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const prevPage = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date]',
    }
  );

  return {
    props: {
      post: response,
      nextPage: nextPage.results[0] || null,
      prevPage: prevPage.results[0] || null,
      preview,
    },
    revalidate: 60 * 30,
  };
};
