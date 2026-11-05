import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-4 text-center">
      <div>
        <p className="text-7xl font-black text-brand">404</p>
        <h1 className="mt-2 text-2xl font-bold">Offside! Page not found</h1>
        <p className="mt-2 text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Link href="/" className="btn-primary mt-6">Back to sports</Link>
      </div>
    </div>
  );
}
