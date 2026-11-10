import type { ReactNode } from "react";
import { Archive, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";

export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="font-amiri text-3xl font-bold md:text-4xl">{title}</h1>{sub && <p className="mt-1 text-sm text-navy/55">{sub}</p>}</div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
/** تبديل بين «النشطة» و«الأرشيف» */
export function ArchiveSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="no-print inline-flex rounded-xl bg-navy/5 p-1">
      {[[false, "النشطة"], [true, "الأرشيف"]].map(([v, l]) => (
        <button key={String(v)} onClick={() => onChange(v as boolean)} className={cn("flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-bold transition", value === v ? "bg-white text-navy shadow-sm" : "text-navy/55")}>
          {v ? <Archive className="h-3.5 w-3.5" /> : null}{l as string}
        </button>
      ))}
    </div>
  );
}
/** طفرة مع إشعار وتحديث شامل للبيانات */
export function useAction() {
  const utils = trpc.useUtils();
  const toast = useToast();
  return {
    ok: (msg: string) => async () => { await utils.invalidate(); toast(msg); },
    err: (e: { message: string }) => toast(e.message, "err"),
    toast,
  };
}
export function ArchiveButton({ archived, onArchive, onRestore, loading }: { archived: boolean; onArchive: () => void; onRestore: () => void; loading?: boolean }) {
  return archived
    ? <Button size="sm" variant="success" onClick={onRestore} loading={loading}><RotateCcw className="h-3.5 w-3.5" />استرجاع</Button>
    : <Button size="sm" variant="outline" onClick={onArchive} loading={loading} title="أرشفة (لا يوجد حذف نهائي)"><Archive className="h-3.5 w-3.5" />أرشفة</Button>;
}
export const Empty = ({ text = "لا توجد بيانات", icon }: { text?: string; icon?: ReactNode }) => (
  <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-navy/15 bg-white py-14 text-center text-navy/50">{icon}<p>{text}</p></div>
);
export const Loading = () => (
  <div aria-busy="true" aria-label="جارٍ التحميل" className="space-y-5">
    <div className="skeleton h-9 w-56" />
    <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-28" />)}</div>
    <div className="skeleton h-64" />
  </div>
);
