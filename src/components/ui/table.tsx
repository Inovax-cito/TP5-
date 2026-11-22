import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Columnas secundarias ocultas en pantallas chicas: `ocultar={{ md: [4, 5] }}` oculta la
 * 4.ª y la 5.ª columna por debajo de md. Las clases están escritas completas para Tailwind.
 */
const OCULTAR = {
  sm: { 1: "max-sm:[&_tr>*:nth-child(1)]:hidden", 2: "max-sm:[&_tr>*:nth-child(2)]:hidden", 3: "max-sm:[&_tr>*:nth-child(3)]:hidden", 4: "max-sm:[&_tr>*:nth-child(4)]:hidden", 5: "max-sm:[&_tr>*:nth-child(5)]:hidden", 6: "max-sm:[&_tr>*:nth-child(6)]:hidden", 7: "max-sm:[&_tr>*:nth-child(7)]:hidden", 8: "max-sm:[&_tr>*:nth-child(8)]:hidden" },
  md: { 1: "max-md:[&_tr>*:nth-child(1)]:hidden", 2: "max-md:[&_tr>*:nth-child(2)]:hidden", 3: "max-md:[&_tr>*:nth-child(3)]:hidden", 4: "max-md:[&_tr>*:nth-child(4)]:hidden", 5: "max-md:[&_tr>*:nth-child(5)]:hidden", 6: "max-md:[&_tr>*:nth-child(6)]:hidden", 7: "max-md:[&_tr>*:nth-child(7)]:hidden", 8: "max-md:[&_tr>*:nth-child(8)]:hidden" },
  lg: { 1: "max-lg:[&_tr>*:nth-child(1)]:hidden", 2: "max-lg:[&_tr>*:nth-child(2)]:hidden", 3: "max-lg:[&_tr>*:nth-child(3)]:hidden", 4: "max-lg:[&_tr>*:nth-child(4)]:hidden", 5: "max-lg:[&_tr>*:nth-child(5)]:hidden", 6: "max-lg:[&_tr>*:nth-child(6)]:hidden", 7: "max-lg:[&_tr>*:nth-child(7)]:hidden", 8: "max-lg:[&_tr>*:nth-child(8)]:hidden" },
  xl: { 1: "max-xl:[&_tr>*:nth-child(1)]:hidden", 2: "max-xl:[&_tr>*:nth-child(2)]:hidden", 3: "max-xl:[&_tr>*:nth-child(3)]:hidden", 4: "max-xl:[&_tr>*:nth-child(4)]:hidden", 5: "max-xl:[&_tr>*:nth-child(5)]:hidden", 6: "max-xl:[&_tr>*:nth-child(6)]:hidden", 7: "max-xl:[&_tr>*:nth-child(7)]:hidden", 8: "max-xl:[&_tr>*:nth-child(8)]:hidden" },
} as const;

type Columna = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type Ocultar = Partial<Record<keyof typeof OCULTAR, Columna[]>>;

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement> & { ocultar?: Ocultar }>(
  ({ className, ocultar, ...props }, ref) => {
    const clases = Object.entries(ocultar ?? {}).flatMap(([bp, columnas]) =>
      (columnas ?? []).map((n) => OCULTAR[bp as keyof typeof OCULTAR][n]),
    );
    return (
      <div className="scrollbar-thin relative w-full overflow-auto">
        <table ref={ref} className={cn("w-full caption-bottom text-sm", clases, className)} {...props} />
      </div>
    );
  },
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn("sticky top-0 z-[1] bg-muted/70 backdrop-blur [&_tr:hover]:bg-transparent [&_tr]:border-b", className)} {...props} />,
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
);
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b border-border/70 transition-colors hover:bg-primary/[0.035] data-[state=selected]:bg-muted", className)}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn("h-10 whitespace-nowrap px-3 text-left align-middle text-micro uppercase text-muted-foreground first:pl-4 last:pr-4 sm:px-4 sm:first:pl-5 sm:last:pr-5", className)}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("px-3 py-3 align-middle first:pl-4 last:pr-4 sm:px-4 sm:first:pl-5 sm:last:pr-5", className)} {...props} />
  ),
);
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
