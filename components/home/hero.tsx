import Image from "next/image";

export default function Hero() {
  return (
    <div className="min-h-screen">
      <Image
        src="/images/hero.png"
        fill
        className="object-cover"
        alt=""
        priority
      />
    </div>
  );
}
