import { brand, getCopy, type Lang } from "@/data/site";
import s from "./layout.module.css";

export default function SiteFooter({ lang }: { lang: Lang }) {
  const copy = getCopy(lang);
  const year = new Date().getFullYear();

  return (
    <footer className={s.footer}>
      <div className={`${s.container} ${s.footerInner}`}>
        <div>
          <div>
            © {year} {brand.name}
            {brand.foundedYear ? ` · Since ${brand.foundedYear}` : ""}
          </div>
          {copy.footer.note && (
            <div className={s.footerNote}>{copy.footer.note}</div>
          )}
        </div>

        <div className={s.footerLinks}>
          <a href={`mailto:${brand.email}`}>{brand.email}</a>
          <a href={brand.instagram} target="_blank" rel="noopener noreferrer">
            {brand.instagramHandle}
          </a>
        </div>
      </div>
    </footer>
  );
}
