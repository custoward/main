import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/section";
import { getCopy, isLang, type Lang } from "@/data/site";
import { works } from "@/data/work";
import layout from "@/components/layout.module.css";
import s from "../home.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getCopy(lang).work.heading };
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const copy = getCopy(lang as Lang);

  return (
    <>
      <PageHead title={copy.work.heading} lead={copy.work.lead} />
      <section className={layout.pageBody}>
        <div className={layout.container}>
          {works.length === 0 ? (
            <p className={layout.empty}>{copy.work.empty}</p>
          ) : (
            <ul className={s.workGrid}>
              {works.map((w) => (
                <li key={w.slug} className={s.workItem}>
                  <span className={s.workMeta}>
                    {w.category[lang as Lang]} · {w.year}
                  </span>
                  <span className={s.workTitle}>{w.title[lang as Lang]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
