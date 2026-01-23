import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 flex justify-center items-center">
        <Image
          src="/images/2-4.png"
          alt="CSTOM"
          width={120}
          height={27}
        />
      </div>
    </footer>
  );
}
