// Link to a pack's assessment form (new or editing ?id=), with typed routes per pack. Forwards its
// props and ref so it works as the child of <Button asChild>.
import { Link } from "@tanstack/react-router";
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import type { Pack } from "@/modules/scales/lib/assessments";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { pack: Pack; id?: string; label?: string; children: ReactNode };

export const PackLink = forwardRef<HTMLAnchorElement, Props>(function PackLink({ pack, id, label, children, ...rest }, ref) {
  const search = { ...(id ? { id } : {}), ...(label ? { label } : {}) };
  if (pack === "larynx")
    return (
      <Link ref={ref} to="/scales/laringe" search={search} {...rest}>
        {children}
      </Link>
    );
  if (pack === "sleep")
    return (
      <Link ref={ref} to="/scales/sueno" search={search} {...rest}>
        {children}
      </Link>
    );
  if (pack === "otology")
    return (
      <Link ref={ref} to="/scales/otologia" search={search} {...rest}>
        {children}
      </Link>
    );
  return (
    <Link ref={ref} to="/scales/rinologia" search={search} {...rest}>
      {children}
    </Link>
  );
});
