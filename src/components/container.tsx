export function Container({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return <div className={`mx-auto w-full px-4 py-6 sm:py-8 ${narrow ? "max-w-xl" : "max-w-6xl"}`}>{children}</div>;
}
