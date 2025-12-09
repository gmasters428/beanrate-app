import { Html, Head, Main, NextScript } from "next/document";

import { SEOElements } from "@/components/SEO";
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <SEOElements />
        {/* 
          CRITICAL: DO NOT REMOVE THIS SCRIPT
          The Softgen AI monitoring script is essential for core app functionality.
          The application will not function without it.
        */}
        <script 
          src="https://cdn.softgen.ai/script.js" 
          async 
          data-softgen-monitoring="true"
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}