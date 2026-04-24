import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum – Nexio",
  robots: { index: false },
};

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <Link
          href="/login"
          className="text-[#07c160] text-sm font-medium hover:underline"
        >
          ← Zurück
        </Link>
        <h1 className="text-base font-semibold text-gray-900">Impressum</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6 text-sm text-gray-700">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Angaben gemäß § 5 TMG
          </h2>
          <p>
            <strong>Hesselmann Beratung UG (haftungsbeschränkt)</strong>
            <br />
            Schloßstraße 184
            <br />
            46535 Dinslaken
            <br />
            Deutschland
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Handelsregister
          </h2>
          <p>
            Amtsgericht Duisburg
            <br />
            HRB 32806
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Vertreten durch
          </h2>
          <p>Christa Hesselmann (Geschäftsführerin)</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Kontakt</h2>
          <p>
            Telefon: +49 (0)2064 39952-99
            <br />
            Fax: +49 (0)2064 39952-97
            <br />
            E-Mail:{" "}
            <a
              href="mailto:hallo@hesselmann-its.de"
              className="text-[#07c160] hover:underline"
            >
              hallo@hesselmann-its.de
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Umsatzsteuer-ID
          </h2>
          <p>
            Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:
            <br />
            DE329261999
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)
          </h2>
          <p>
            Christa Hesselmann
            <br />
            Schloßstraße 184
            <br />
            46535 Dinslaken
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Hosting & technischer Betrieb
          </h2>
          <p>
            Vercel Inc.
            <br />
            340 Pine Street, Suite 701
            <br />
            San Francisco, CA 94104, USA
            <br />
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#07c160] hover:underline"
            >
              vercel.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Streitschlichtung
          </h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur
            Online-Streitbeilegung (OS) bereit:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#07c160] hover:underline"
            >
              https://ec.europa.eu/consumers/odr/
            </a>
            .
          </p>
          <p className="mt-2">
            Wir sind nicht bereit oder verpflichtet, an
            Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        <div className="pt-4 border-t border-gray-100 text-xs text-gray-400">
          <Link href="/datenschutz" className="text-[#07c160] hover:underline">
            Datenschutzerklärung
          </Link>
        </div>
      </main>
    </div>
  );
}
