// ENT Senses logo in the printed report header (replaces AudiometricReport's logo).
const BrandLogo = (_props: { isPremium?: boolean; size?: 'sm' | 'md' | 'lg' }) => (
  <span className="flex items-center gap-1.5">
    <img src="/brand/entsenses-symbol.png" alt="" className="h-6 w-auto" />
    <img src="/brand/entsenses-wordmark.png" alt="ENT Senses" className="h-[11px] w-auto" />
  </span>
);

export default BrandLogo;
