import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen – Nexio",
  robots: { index: false },
};

export default function AgbPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <Link href="/login" className="text-[#07c160] text-sm font-medium hover:underline">
          ← Zurück
        </Link>
        <h1 className="text-base font-semibold text-gray-900">
          Allgemeine Geschäftsbedingungen
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6 text-sm text-gray-700">
        <p className="text-xs text-gray-400">Stand: April 2026 · Betreiber: Hesselmann Beratung UG (haftungsbeschränkt)</p>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 1 Geltungsbereich</h2>
          <p>Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die Nutzung der Plattform Nexio, betrieben von der Hesselmann Beratung UG (haftungsbeschränkt), Schloßstraße 184, 46535 Dinslaken (nachfolgend „Betreiber"). Mit der Registrierung akzeptiert der Nutzer diese AGB.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 2 Leistungsbeschreibung</h2>
          <p>Nexio ist eine Kommunikations- und Kollaborationsplattform. Sie ermöglicht Textnachrichten, Medienübertragung, Kanäle, Stories, einen KI-Assistenten sowie optionale Zahlungsfunktionen. Der Betreiber erbringt die Dienste nach eigener technischer Verfügbarkeit und behält sich vor, den Funktionsumfang zu ändern oder zu erweitern.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 3 Registrierung und Nutzerkonto</h2>
          <p className="mb-2">Für die Nutzung ist eine Registrierung erforderlich. Der Nutzer verpflichtet sich:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Wahrheitsgemäße Angaben zu machen</li>
            <li>Zugangsdaten vertraulich zu behandeln</li>
            <li>Den Betreiber unverzüglich zu informieren, wenn ein Missbrauch des Kontos vermutet wird</li>
            <li>Mindestalter 16 Jahre (§ 8 DSGVO)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 4 Nutzungspflichten und verbotene Inhalte</h2>
          <p className="mb-2">Es ist verboten, über Nexio zu übertragen:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Inhalte, die gegen geltendes Recht verstoßen (insb. StGB, UrhG, JMStV)</li>
            <li>Spam, Phishing, Malware oder unaufgeforderte Werbung</li>
            <li>Beleidigungen, Hassrede, Diskriminierung oder Bedrohungen</li>
            <li>Inhalte, die Minderjährige gefährden</li>
            <li>Inhalte, die Dritte in ihren Rechten verletzen</li>
          </ul>
          <p className="mt-2">Der Betreiber behält sich das Recht vor, rechtswidrige Inhalte ohne vorherige Ankündigung zu entfernen und betroffene Konten zu sperren.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 5 Verfügbarkeit und Gewährleistung</h2>
          <p>Der Betreiber strebt eine hohe Verfügbarkeit von Nexio an, übernimmt jedoch keine Garantie für eine ununterbrochene Nutzbarkeit. Wartungsarbeiten, technische Störungen oder Ausfälle bei Drittanbietern können die Verfügbarkeit einschränken. Die Nutzung von Nexio ist kostenlos und erfolgt auf eigenes Risiko des Nutzers.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 6 Haftungsbeschränkung</h2>
          <p>Der Betreiber haftet nicht für Schäden, die durch die Nutzung von Nexio entstehen, sofern diese nicht auf Vorsatz oder grober Fahrlässigkeit des Betreibers beruhen. Für Inhalte, die von Nutzern eingestellt werden, übernimmt der Betreiber keine Haftung. Der Betreiber haftet nicht für Datenverluste, die durch technische Fehler, Angriffe Dritter oder höhere Gewalt verursacht werden.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 7 Zahlungsfunktionen (optional)</h2>
          <p>Sofern Zahlungsfunktionen aktiviert sind, werden diese über Stripe Inc. abgewickelt. Es gelten zusätzlich die Nutzungsbedingungen von Stripe. Der Betreiber tritt nicht als Zahlungsdienstleister auf und ist kein Institut im Sinne des ZAG oder KWG.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 8 KI-Assistent</h2>
          <p>Der in Nexio integrierte KI-Assistent wird durch die Anthropic API bereitgestellt. Nutzer sollten sich bewusst sein, dass KI-generierte Inhalte nicht immer korrekt oder vollständig sind und keine professionelle Beratung ersetzen. Eingaben werden anonymisiert an Anthropic übermittelt.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 9 Kündigung und Kontolöschung</h2>
          <p>Nutzer können ihr Konto jederzeit im Profil-Bereich oder per E-Mail an <a href="mailto:hallo@hesselmann-its.de" className="text-[#07c160] hover:underline">hallo@hesselmann-its.de</a> löschen lassen. Der Betreiber kann Konten bei Verstößen gegen diese AGB ohne Vorankündigung sperren oder löschen.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 10 Änderungen der AGB</h2>
          <p>Der Betreiber behält sich vor, diese AGB jederzeit zu ändern. Nutzer werden über wesentliche Änderungen per Benachrichtigung in der App oder per E-Mail informiert. Die fortgesetzte Nutzung nach der Benachrichtigung gilt als Zustimmung zu den geänderten AGB.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 11 Anwendbares Recht und Gerichtsstand</h2>
          <p>Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand für Streitigkeiten mit Kaufleuten ist Duisburg.</p>
        </section>

        <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 flex gap-4">
          <Link href="/impressum" className="text-[#07c160] hover:underline">Impressum</Link>
          <Link href="/datenschutz" className="text-[#07c160] hover:underline">Datenschutz</Link>
        </div>
      </main>
    </div>
  );
}
