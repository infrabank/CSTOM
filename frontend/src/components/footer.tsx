import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-border-light bg-surface mt-auto print:hidden">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <Image
          src="/images/mix3-2.png"
          alt="CSTOM"
          width={160}
          height={32}
          unoptimized
          className="h-8 w-auto"
        />
        <span className="text-xs text-text-muted">
          KRIHS 국토연구원 CSTOM
        </span>
      </div>
    </footer>
  );
}
