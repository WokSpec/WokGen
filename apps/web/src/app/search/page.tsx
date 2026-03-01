import type { Metadata } from 'next';
import { SearchClient } from './_client';

export const metadata: Metadata = {
  title: 'Search — WokGen',
  description: 'Search tools, pages, and content across WokGen.',
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = '' } = await searchParams;
  return <SearchClient initialQuery={q} />;
}
