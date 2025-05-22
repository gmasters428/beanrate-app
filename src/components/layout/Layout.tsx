
import Head from "next/head";
import Navbar from "./Navbar";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function Layout({ children, title = "BeanRate - Coffee Rating App", description = "Rate and discover coffee beans with BeanRate" }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pb-20 pt-4 md:pt-20 md:pb-4 px-4 max-w-screen-xl mx-auto">
          {children}
        </main>
      </div>
    </>
  );
}
