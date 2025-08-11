import { Navbar } from "@/components/navbar";
import { Link } from "@heroui/link";


export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen">
      <Navbar/>
      <main className="container mx-auto max-w-7xl px-6 flex-grow pt-10">
        {children}
      </main>
      <footer className="w-full flex items-center justify-center py-3">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="https://www.instagram.com/zidni_mufti/"
        >
          <span className="text-default-600">Powered by</span>
          <p className="text-primary">Orang Ganteng</p>
        </Link>
      </footer>
    </div>
  );
}
