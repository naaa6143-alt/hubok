import * as React from "react";
import * as DialogP from "@radix-ui/react-dialog";
import * as TabsP from "@radix-ui/react-tabs";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const btn = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold transition disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60", {
  variants: {
    variant: {
      default: "bg-navy text-white hover:bg-navy-700 shadow-sm",
      gold: "bg-gold text-white hover:bg-gold-400 shadow-sm",
      outline: "border border-navy/15 bg-white text-navy hover:bg-navy/5",
      ghost: "text-navy hover:bg-navy/5",
      danger: "bg-red-600 text-white hover:bg-red-700",
      success: "bg-emerald-600 text-white hover:bg-emerald-700",
    },
    size: { default: "h-10 px-4 text-sm", sm: "h-8 px-3 text-xs", lg: "h-12 px-6 text-base", icon: "h-9 w-9" },
  },
  defaultVariants: { variant: "default", size: "default" },
});
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof btn> & { asChild?: boolean; loading?: boolean };
export const Button = React.forwardRef<HTMLButtonElement, BtnProps>(({ className, variant, size, asChild, loading, children, ...p }, ref) => {
  const C = asChild ? Slot : "button";
  return <C ref={ref} className={cn(btn({ variant, size }), className)} {...p}>{asChild ? children : <>{loading && <Loader2 className="h-4 w-4 animate-spin" />}{children}</>}</C>;
});
Button.displayName = "Button";

const field = "w-full rounded-xl border border-navy/15 bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/35 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 disabled:bg-navy/5";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => <input ref={ref} className={cn(field, className)} {...p} />);
Input.displayName = "Input";
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => <textarea ref={ref} className={cn(field, "min-h-[90px]", className)} {...p} />);
Textarea.displayName = "Textarea";
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, ref) => <select ref={ref} className={cn(field, "cursor-pointer pe-3", className)} {...p} />);
Select.displayName = "Select";
export const Label = ({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) => <label className={cn("field-label", className)} {...p} />;
export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><Label>{label}</Label>{children}{hint && <p className="mt-1 text-xs text-navy/50">{hint}</p>}</div>;
}

export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("rounded-2xl border border-navy/10 bg-white p-5 shadow-[0_1px_2px_rgba(19,41,61,.04)]", className)} {...p} />;
export const CardTitle = ({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className={cn("mb-4 flex items-center gap-2 text-base font-extrabold text-navy", className)} {...p} />;

const badge = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", {
  variants: { tone: { gray: "bg-navy/5 text-navy/70", green: "bg-emerald-50 text-emerald-700", red: "bg-red-50 text-red-700", gold: "bg-gold-100 text-[#8a6a14]", blue: "bg-sky-50 text-sky-700", navy: "bg-navy text-white" } },
  defaultVariants: { tone: "gray" },
});
export const Badge = ({ tone, className, ...p }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) => <span className={cn(badge({ tone }), className)} {...p} />;

export function Dialog({ open, onOpenChange, title, children, wide }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <DialogP.Root open={open} onOpenChange={onOpenChange}>
      <DialogP.Portal>
        <DialogP.Overlay className="fixed inset-0 z-50 bg-navy-900/50 backdrop-blur-[2px]" />
        <DialogP.Content dir="rtl" aria-describedby={undefined} className={cn("fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[94vw] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl outline-none", wide ? "max-w-3xl" : "max-w-lg")}>
          <div className="mb-5 flex items-center justify-between">
            <DialogP.Title className="text-lg font-extrabold">{title}</DialogP.Title>
            <DialogP.Close className="rounded-lg p-1 text-navy/50 hover:bg-navy/5" aria-label="إغلاق"><X className="h-5 w-5" /></DialogP.Close>
          </div>
          {children}
        </DialogP.Content>
      </DialogP.Portal>
    </DialogP.Root>
  );
}

export const Tabs = TabsP.Root;
export const TabsList = ({ className, ...p }: TabsP.TabsListProps) => <TabsP.List className={cn("inline-flex rounded-xl bg-navy/5 p-1", className)} {...p} />;
export const TabsTrigger = ({ className, ...p }: TabsP.TabsTriggerProps) => <TabsP.Trigger className={cn("rounded-lg px-4 py-1.5 text-sm font-bold text-navy/60 transition data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:shadow-sm", className)} {...p} />;
export const TabsContent = TabsP.Content;

export function Table({ head, children, empty }: { head: React.ReactNode[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead><tr className="bg-navy/[.03] text-right text-xs font-bold text-navy/60">{head.map((h, i) => <th key={i} className="whitespace-nowrap px-4 py-3">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-navy/5 [&_td]:px-4 [&_td]:py-3 [&_tr:hover]:bg-navy/[.02]">{children}</tbody>
      </table>
      {empty && <div className="py-12 text-center text-sm text-navy/50">لا توجد بيانات</div>}
    </div>
  );
}

/* إشعارات بسيطة */
type T = { id: number; text: string; tone: "ok" | "err" };
const ToastCtx = React.createContext<(text: string, tone?: "ok" | "err") => void>(() => {});
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = React.useState<T[]>([]);
  const push = React.useCallback((text: string, tone: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, text, tone }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="no-print fixed inset-x-4 bottom-5 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:left-5 sm:items-start">
        {list.map((t) => <div key={t.id} role="status" className={cn("animate-rise rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg", t.tone === "ok" ? "bg-navy" : "bg-red-600")}>{t.text}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => React.useContext(ToastCtx);
