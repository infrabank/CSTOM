"use client";

import { useState } from "react";
import Image from "next/image";

export default function Footer() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <footer className="border-t bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 flex justify-center items-center">
        <div
          className="relative cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Image
            src={isHovered ? "/images/mix3-2.png" : "/images/2-4.png"}
            alt="CSTOM"
            width={120}
            height={27}
            className="transition-opacity duration-200"
          />
        </div>
      </div>
    </footer>
  );
}
