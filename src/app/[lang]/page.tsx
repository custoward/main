import Link from "next/link";
import { notFound } from "next/navigation";
import Section from "@/components/section";
import { brand, getCopy, isLang, type Lang } from "@/data/site";
import { works } from "@/data/work";
import layout from "@/components/layout.module.css";
import s from "./home.module.css";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const copy = getCopy(lang as Lang);

  return (
    <>
      {/* 첫 화면. headline 을 아직 안 채웠으면 브랜드 이름만 크게 둔다 —
          자리표시자 문구가 노출되는 것보다 낫다. */}
      <section className={s.hero}>
        <div className={layout.container}>
          <h1 className={s.headline}>
            {copy.home.headline || (lang === "ko" ? brand.nameKo : brand.name)}
          </h1>
          {copy.home.lead.length > 0 && (
            <div className={s.heroLead}>
              {copy.home.lead.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
          <Link href={`/${lang}/contact`} className={s.cta}>
            {copy.home.ctaLabel}
          </Link>
        </div>
      </section>

      {/* 작업 — 아직 없으면 빈 격자 대신 한 줄만 */}
      <Section heading={copy.work.heading}>
        {works.length === 0 ? (
          <p className={layout.empty}>{copy.work.empty}</p>
        ) : (
          <>
            <ul className={s.workGrid}>
              {works.slice(0, 4).map((w) => (
                <li key={w.slug} className={s.workItem}>
                  <span className={s.workMeta}>
                    {w.category[lang as Lang]} · {w.year}
                  </span>
                  <span className={s.workTitle}>{w.title[lang as Lang]}</span>
                </li>
              ))}
            </ul>
            <Link href={`/${lang}/work`} className={s.more}>
              {copy.nav.work} →
            </Link>
          </>
        )}
      </Section>

      {/* 하는 일 — 아직 안 채웠으면 섹션 자체가 안 나온다 */}
      {copy.about.services.length > 0 && (
        <Section heading={copy.about.servicesHeading}>
          <ul className={s.serviceList}>
            {copy.about.services.map((sv) => (
              <li key={sv.title}>
                <h3>{sv.title}</h3>
                <p>{sv.body}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
