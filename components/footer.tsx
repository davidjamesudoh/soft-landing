"use client";

import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative space-y-10 py-10">
      <Image
        className="w-[92%] mx-auto"
        src={"/images/footer.png"}
        alt="Logo"
        width={1000}
        height={1000}
      />
    </footer>
  );
}
