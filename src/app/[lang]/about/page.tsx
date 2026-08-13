import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Section, { PageHead } from "@/components/section";
import { getCopy, isLang, type Lang } from "@/data/site";
import s from "../home.module.css";
import about from "./about.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getCopy(lang).about.heading };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const copy = getCopy(lang as Lang);

  return (
    <>
      <PageHead title={copy.about.heading} lead={copy.about.lead} />

      {/* 하는 일 · 진행 방식 — 각각 내용이 있을 때만 나온다 */}
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

      {copy.about.process.length > 0 && (
        <Section heading={copy.about.processHeading}>
          <ol className={about.process}>
            {copy.about.process.map((step, i) => (
              <li key={step.title}>
                <span className={about.step}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}
    </>
  );
}
