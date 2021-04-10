import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { useCallback, useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import styles from './home.module.scss';
import { getPrismicClient } from '../services/prismic';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const handleLoadMorePost = useCallback(async () => {
    const response = await fetch(nextPage);
    const responseJSON = await response.json();

    const morePost = responseJSON.results.map((post: Post) => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts([...posts, ...morePost]);
    setNextPage(responseJSON.next_page);
  }, [nextPage, posts]);

  return (
    <>
      <Head>
        <title>Home - Space Travelling</title>
      </Head>

      <main className={styles.container}>
        <header className={styles.header}>
          <img src="/Logo.svg" alt="logo" />
        </header>

        <section className={styles.postsList}>
          {posts.map(post => (
            <Link href={`post/${post.uid}`} key={post.uid}>
              <a>
                <div className={styles.post}>
                  <h1>{post.data.title}</h1>
                  <p>{post.data.subtitle}</p>

                  <div className={styles.infoContainer}>
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
                  </div>
                </div>
              </a>
            </Link>
          ))}

          {nextPage && (
            <button type="button" onClick={handleLoadMorePost}>
              Carregar mais posts
            </button>
          )}
        </section>

        {preview && (
          <aside className={styles.buttonModePreview}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 2,
      orderings: '[document.last_publication_date desc]',
      ref: previewData?.ref ?? null,
    }
  );

  const postsList = postResponse.results.map((post: Post) => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const { next_page } = postResponse;

  return {
    props: {
      postsPagination: {
        results: postsList,
        next_page,
      },
      preview,
    },
    revalidate: 60 * 30,
  };
};
