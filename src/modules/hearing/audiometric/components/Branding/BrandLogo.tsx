// ENT Senses logo in the printed report header (replaces AudiometricReport's logo).
const BrandLogo = (_props: { isPremium?: boolean; size?: 'sm' | 'md' | 'lg' }) => (
  <img src="/brand/entsenses-horizontal.svg" alt="ENT Senses" className="h-4 w-auto" />
);

export default BrandLogo;
