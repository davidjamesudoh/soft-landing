"use client";
import { NavColorProvider } from "@/context/navColor";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SmoothScroll from "@/components/smoothScroller";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NavColorProvider>
      <SmoothScroll />
      <Header />
      {children}
      <Footer />
    </NavColorProvider>
  );
}
