import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – Nexio",
  robots: { index: false },
};

export default function DatenschutzPage() {
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
        <h1 className="text-base font-semibold text-gray-900">
          Datenschutzerklärung
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6 text-sm text-gray-700">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            1. Verantwortlicher
          </h2>
          <p>
            <strong>Hesselmann Beratung UG (haftungsbeschränkt)</strong>
            <br />
            Schloßstraße 184
            <br />
            46535 Dinslaken
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
            2. Erhobene Daten und Zweck der Verarbeitung
          </h2>
          <p className="mb-2">
            Nexio erhebt und verarbeitet personenbezogene Daten ausschließlich,
            soweit dies zur Erbringung der App-Funktionen erforderlich ist:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Registrierung / Konto:</strong> E-Mail-Adresse,
              Benutzername, Passwort (gehasht) — zur Bereitstellung des
              Nutzerkontos (Art. 6 Abs. 1 lit. b DSGVO)
            </li>
            <li>
              <strong>Nachrichten:</strong> Text- und Medieninhalte werden
              verschlüsselt übertragen und in der EU gespeichert — zur
              Durchführung der Kommunikationsfunktion
            </li>
            <li>
              <strong>KI-Assistent:</strong> Nachrichten im AI-Chat werden
              anonymisiert an die Anthropic API (USA) übermittelt. Es gilt die{" "}
              <a
                href="https://www.anthropic.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#07c160] hover:underline"
              >
                Datenschutzerklärung von Anthropic
              </a>
              .
            </li>
            <li>
              <strong>Push-Benachrichtigungen:</strong> Endpoint-URL des
              Browsers — zur Zustellung von Benachrichtigungen (opt-in)
            </li>
            <li>
              <strong>Server-Logs:</strong> IP-Adresse, Zeitstempel,
              aufgerufene URL — zur Fehlerdiagnose (berechtigtes Interesse,
              Art. 6 Abs. 1 lit. f DSGVO), Löschung nach 7 Tagen
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            3. Speicherort und Drittlandübermittlung
          </h2>
          <p className="mb-2">
            Die Daten werden bei folgenden Auftragsverarbeitern gespeichert:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Supabase Inc.</strong> (Datenbankhosting, Region
              eu-central-1 / Frankfurt) — EU-Daten verbleiben in der EU
            </li>
            <li>
              <strong>Vercel Inc.</strong> (Hosting, USA) — Standardvertragsklauseln
              (SCCs) gemäß Art. 46 Abs. 2 lit. c DSGVO
            </li>
            <li>
              <strong>Anthropic PBC</strong> (KI-API, USA) — nur für
              AI-Assistent-Funktionen, SCCs
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            4. Speicherdauer
          </h2>
          <p>
            Kontodaten werden bis zur Löschung des Nutzerkontos gespeichert.
            Nachrichten und KI-Sessions werden gespeichert, bis der Nutzer sie
            löscht oder das Konto schließt. Stories (Momente) werden automatisch
            nach 24 Stunden gelöscht.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            5. Betroffenenrechte
          </h2>
          <p className="mb-2">
            Sie haben gemäß DSGVO folgende Rechte:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Auskunft (Art. 15 DSGVO)</li>
            <li>Berichtigung (Art. 16 DSGVO)</li>
            <li>Löschung (Art. 17 DSGVO) — „Recht auf Vergessenwerden"</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Widerspruch (Art. 21 DSGVO)</li>
          </ul>
          <p className="mt-2">
            Anfragen richten Sie bitte an:{" "}
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
            6. Beschwerderecht
          </h2>
          <p>
            Sie haben das Recht, sich bei der zuständigen Aufsichtsbehörde zu
            beschweren. Zuständig ist die Landesbeauftragte für Datenschutz und
            Informationsfreiheit Nordrhein-Westfalen (LDI NRW),{" "}
            <a
              href="https://www.ldi.nrw.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#07c160] hover:underline"
            >
              www.ldi.nrw.de
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            7. Cookies und Tracking
          </h2>
          <p>
            Nexio verwendet ausschließlich technisch notwendige Cookies zur
            Session-Verwaltung (Supabase Auth). Es werden keine
            Tracking-Cookies, Analyse-Tools oder Werbenetzwerke eingesetzt.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            8. Aktualität dieser Erklärung
          </h2>
          <p>Stand: April 2026</p>
        </section>

        <div className="pt-4 border-t border-gray-100 text-xs text-gray-400">
          <Link href="/impressum" className="text-[#07c160] hover:underline">
            Impressum
          </Link>
        </div>
      </main>
    </div>
  );
}
