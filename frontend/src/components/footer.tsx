import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 flex justify-center items-center">
        <Image
          src="/images/mix3-2.png"
          alt="CSTOM"
          width={200}
          height={40}
          unoptimized
          className="h-10 w-auto"
        />
      </div>
    </footer>
  );
}
