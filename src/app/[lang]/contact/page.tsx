import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/section";
import { brand, getCopy, isLang, type Lang } from "@/data/site";
import layout from "@/components/layout.module.css";
import s from "./contact.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getCopy(lang).contact.heading };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const copy = getCopy(lang as Lang);

  // 폼 대신 메일. 서버도 DB도 없고 스팸도 안 쌓인다.
  const mailto = `mailto:${brand.email}?subject=${encodeURIComponent(
    copy.contact.mailSubject,
  )}`;

  return (
    <>
      <PageHead title={copy.contact.heading} lead={copy.contact.lead} />

      <section className={layout.pageBody}>
        <div className={layout.container}>
          <a href={mailto} className={s.mailButton}>
            {copy.contact.emailLabel}
          </a>
          <p className={s.address}>{brand.email}</p>

          {copy.contact.checklist.length > 0 && (
            <div className={s.checklist}>
              <h2>{copy.contact.checklistHeading}</h2>
              <ul>
                {copy.contact.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
