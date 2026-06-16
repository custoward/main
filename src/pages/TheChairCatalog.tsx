import React, { useEffect, useState } from 'react';
import './TheChairCatalog.css';
import { LanguageProvider, useLang } from '../i18n';

interface Manifest {
  count: number;
  pages: string[];
}

const BASE = `${process.env.PUBLIC_URL}/catalog_pages`;

const CatalogInner: React.FC = () => {
  const { t } = useLang();
  const [pages, setPages] = useState<string[]>([]);
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    fetch(`${BASE}/manifest.json`)
      .then((r) => {
        if (!r.ok) throw new Error('manifest not found');
        return r.json();
      })
      .then((m: Manifest) => {
        if (!active) return;
        setPages(m.pages || []);
        setStatus('done');
      })
      .catch((err) => {
        console.error('카탈로그 불러오기 실패:', err);
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="catalog-page">
      <header className="catalog-header">
        <a href="/thechair" className="catalog-back">← The Chair Theory</a>
        <h1 className="catalog-title">The Chair Catalog</h1>
        <span className="catalog-spacer" aria-hidden="true" />
      </header>

      {status === 'loading' && <p className="catalog-msg">{t('catalogLoading')}</p>}
      {status === 'error' && <p className="catalog-msg">{t('catalogError')}</p>}

      <div className="catalog-pages">
        {pages.map((p, i) => (
          <img
            key={p}
            src={`${BASE}/${p}`}
            alt={`The Chair Catalog ${i + 1}`}
            loading="lazy"
            className="catalog-img"
          />
        ))}
      </div>
    </div>
  );
};

const TheChairCatalog: React.FC = () => (
  <LanguageProvider>
    <CatalogInner />
  </LanguageProvider>
);

export default TheChairCatalog;
