import s from "./layout.module.css";

/**
 * 섹션 하나.
 *
 * **제목도 본문도 자식도 없으면 아무것도 그리지 않는다.** 문구를 아직 안 채운
 * 자리가 빈 상자로 노출되지 않게 하려는 것이다. 채운 만큼만 화면에 나타난다.
 */
export default function Section({
  heading,
  lead,
  children,
}: {
  heading?: string;
  lead?: readonly string[];
  children?: React.ReactNode;
}) {
  const hasLead = Boolean(lead?.length);
  if (!heading && !hasLead && !children) return null;

  return (
    <section className={s.section}>
      <div className={s.container}>
        {heading && <h2 className={s.sectionHeading}>{heading}</h2>}
        {hasLead && (
          <div className={s.lead}>
            {lead!.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

/** 페이지 맨 위 제목 + 도입 문단 */
export function PageHead({
  title,
  lead,
}: {
  title: string;
  lead?: readonly string[];
}) {
  return (
    <div className={s.pageHead}>
      <div className={s.container}>
        <h1 className={s.pageTitle}>{title}</h1>
        {lead && lead.length > 0 && (
          <div className={s.lead} style={{ marginTop: "var(--sp-6)" }}>
            {lead.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
