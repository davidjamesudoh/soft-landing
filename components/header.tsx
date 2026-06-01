"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const desktopNavLinks = [
  { title: "Our Story", link: "#our-story", isExternal: false },
  { title: "RSVP", link: "#rsvp", isExternal: false },
  { title: "Countdown", link: "#countdown", isExternal: false },
  {
    title: "Gift Registry",
    link: "https://www.thingstogetme.com/2274681a67cad",
    isExternal: true,
  },
  { title: "Schedule", link: "#schedule", isExternal: false },
  { title: "FAQ", link: "#faq", isExternal: false },
];

const mobileNavLinks = [
  { title: "Our Story", link: "#our-story", isExternal: false },
  { title: "Countdown", link: "#countdown", isExternal: false },
  {
    title: "Gift Registry",
    link: "https://www.thingstogetme.com/2274681a67cad",
    isExternal: true,
  },
  { title: "Schedule", link: "#schedule", isExternal: false },
  { title: "FAQ", link: "#faq", isExternal: false },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const mobileBarClass = `px-2.5 py-0.5 text-base font-medium text-black`;

  return (
    <>
      {/* Mobile full-screen menu overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-primary flex flex-col">
          {/* Overlay top bar: CLOSE | Logo | RSVP */}
          <div className="flex items-center justify-between px-[25px] py-4">
            <button
              onClick={() => setIsMenuOpen(false)}
              className={`cursor-pointer ${mobileBarClass} text-black`}
            >
              CLOSE
            </button>

            <Link href="/">
              <Image
                src="/images/logo.png"
                alt="logo"
                width={101}
                height={132}
                className="w-[50px]"
              />
            </Link>

            <Link
              href="#rsvp"
              onClick={() => setIsMenuOpen(false)}
              className={`${mobileBarClass} text-black`}
            >
              RSVP
            </Link>
          </div>

          {/* Nav links */}
          <nav className="flex-1 flex flex-col items-center justify-center">
            <ul className="space-y-5 flex flex-col items-center">
              {mobileNavLinks.map((link, index) => (
                <li
                  key={index}
                  className="mobile-nav-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Link
                    href={link.link}
                    onClick={() => setIsMenuOpen(false)}
                    target={link.isExternal ? "_blank" : "_self"}
                    className={`px-2.5 py-0.5 inline-block text-2xl hover:text-3xl hover:italic text-black font-medium`}
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* Main header */}
      <header
        className={`fixed top-0 w-full z-50 flex items-center justify-between py-3`}
      >
        {/* Mobile top bar: MENU | Logo | RSVP (hidden when overlay is open) */}
        {!isMenuOpen && (
          <div className="flex md:hidden items-center justify-between w-full px-[25px]">
            <button
              onClick={() => setIsMenuOpen(true)}
              className={`cursor-pointer ${mobileBarClass}`}
            >
              MENU
            </button>

            <Link href="/">
              <Image
                src="/images/logo.png"
                alt="logo"
                width={101}
                height={132}
                className="w-[50px]"
              />
            </Link>

            <Link href="#rsvp" className={`${mobileBarClass}`}>
              RSVP
            </Link>
          </div>
        )}

        {/* Desktop nav */}
        <nav className="hidden md:flex justify-center w-full items-center gap-3">
          {/* Left — first 3 links */}
          <div className="flex items-center gap-3">
            {desktopNavLinks.slice(0, 3).map((link, index) => (
              <Link
                key={index}
                href={link.link}
                className="text-black px-2.5 py-0.5 inline-block text-lg font-medium"
              >
                {link.title}
              </Link>
            ))}
          </div>

          {/* Logo — center */}
          <Link href="/" className="mx-4">
            <Image
              src="/images/logo.png"
              alt="logo"
              width={101}
              height={132}
              className="w-[50px]"
            />
          </Link>

          {/* Right — last 3 links */}
          <div className="flex items-center gap-3">
            {desktopNavLinks.slice(3).map((link, index) => (
              <Link
                key={index}
                href={link.link}
                target={link.isExternal ? "_blank" : "_self"}
                className="text-black px-2.5 py-0.5 inline-block text-lg font-medium"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </nav>
      </header>
    </>
  );
}
