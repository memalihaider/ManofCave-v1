import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Scissors } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-secondary/10 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 shadow-md">
            <Scissors className="w-5 h-5 text-secondary" />
          </div>
          <span className="text-xl font-serif font-bold text-primary tracking-tight hidden sm:block">
            Man OF <span className="text-secondary">CAVE</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {[
            { name: "Home", href: "/" },
            { name: "Services", href: "/services" },
            { name: "Products", href: "/products" },
            { name: "Branches", href: "/branches" },
          ].map((link) => (
            <Link 
              key={link.name}
              href={link.href} 
              className="text-xs uppercase tracking-widest font-semibold text-primary/70 hover:text-secondary transition-all duration-300 hover:translate-y-[-2px]"
            >
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/customer/login" className="text-xs uppercase tracking-widest font-semibold text-primary/70 hover:text-secondary hidden sm:block transition-colors">
            Sign In
          </Link>
          <Button asChild className="bg-secondary hover:bg-secondary/90 text-primary rounded-lg px-6 py-2 text-xs tracking-widest font-bold shadow-md shadow-secondary/20 transition-all duration-300 hover:scale-105 active:scale-95">
            <Link href="/services">BOOK YOUR SERVICE NOW</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}