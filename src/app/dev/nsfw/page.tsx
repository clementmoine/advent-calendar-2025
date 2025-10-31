'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { isFrenchWord, normalizeFrenchAccents } from '@/lib/word-validation';
import leoProfanity from 'leo-profanity';

export default function NsfwTesterPage() {
  const [value, setValue] = useState('');

  const result = useMemo(() => {
    const raw = value || '';
    const lower = raw.toLowerCase();
    const normalized = normalizeFrenchAccents(raw);
    const normalizedLower = normalized.toLowerCase();

    const isNSFW =
      leoProfanity.check(raw) ||
      leoProfanity.check(lower) ||
      leoProfanity.check(normalizedLower);

    const inDictionary = isFrenchWord(raw);

    return { raw, normalized, isNSFW, inDictionary };
  }, [value]);

  return (
    <div className='max-w-2xl mx-auto p-6 flex flex-col gap-6'>
      <Card>
        <CardContent className='p-6 flex flex-col gap-4'>
          <h1 className='text-2xl font-bold'>Test dictionnaire / NSFW</h1>
          <Input
            placeholder='Tape un mot...'
            value={value}
            onChange={e => setValue(e.target.value)}
          />

          <div className='flex flex-wrap gap-2 items-center'>
            <Badge
              className={
                result.isNSFW
                  ? 'bg-red-100 text-red-800'
                  : 'bg-emerald-100 text-emerald-800'
              }
            >
              {result.isNSFW ? 'NSFW' : 'SAFE'}
            </Badge>
            <Badge
              className={
                result.inDictionary
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-200 text-slate-700'
              }
            >
              {result.inDictionary
                ? 'Dans le dictionnaire (filtré)'
                : 'Hors dictionnaire'}
            </Badge>
          </div>

          <div className='text-sm text-slate-600 flex flex-col gap-1'>
            <div>
              <span className='font-medium'>Brut:</span> {result.raw || '—'}
            </div>
            <div>
              <span className='font-medium'>Normalisé:</span>{' '}
              {result.normalized || '—'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
