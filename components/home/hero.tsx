import Image from "next/image";

export default function Hero() {
  return (
    <div className="max-h-screen h-screen w-full">
      <Image
        src="/images/hero.png"
        width={608}
        height={2476}
        className="object-cover w-full"
        alt=""
        priority
      />
    </div>
  );
}
