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
        <p className="text-xs text-gray-400">
          Stand: April 2026 · Betreiber: Hesselmann Beratung UG (haftungsbeschränkt) · Version 2.0
        </p>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 1 Geltungsbereich</h2>
          <p>
            Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die Nutzung der Plattform Nexio,
            betrieben von der Hesselmann Beratung UG (haftungsbeschränkt), Schloßstraße 184, 46535 Dinslaken
            (nachfolgend „Betreiber"). Mit der Registrierung akzeptiert der Nutzer diese AGB in ihrer jeweils
            gültigen Fassung. Die Plattform richtet sich an Nutzer ab 13 Jahren.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 2 Leistungsbeschreibung</h2>
          <p>
            Nexio ist eine Kommunikations- und Kollaborationsplattform. Sie ermöglicht Textnachrichten,
            Medienübertragung, Audio-/Videoanrufe, Kanäle, Stories, einen KI-Assistenten sowie optionale
            Zahlungsfunktionen. Der Betreiber erbringt die Dienste nach eigener technischer Verfügbarkeit
            und behält sich vor, den Funktionsumfang zu ändern, einzuschränken oder zu erweitern.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 3 Registrierung und Nutzerkonto</h2>
          <p className="mb-2">Für die Nutzung ist eine Registrierung erforderlich. Der Nutzer verpflichtet sich:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Wahrheitsgemäße Angaben zu machen</li>
            <li>Zugangsdaten vertraulich zu behandeln</li>
            <li>Den Betreiber unverzüglich zu informieren, wenn ein Missbrauch des Kontos vermutet wird</li>
            <li>Mindestalter: 13 Jahre (bei unter 16-Jährigen ist gemäß DSGVO Art. 8 die Einwilligung eines Erziehungsberechtigten erforderlich)</li>
          </ul>
          <p className="mt-2">
            Konten von Nutzern unter 13 Jahren werden nach Bekanntwerden unverzüglich gelöscht.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 4 Nutzungspflichten und verbotene Inhalte</h2>
          <p className="mb-2">Es ist verboten, über Nexio zu übertragen oder zu veröffentlichen:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Inhalte, die gegen geltendes Recht verstoßen (insb. StGB, UrhG, JMStV, NetzDG)</li>
            <li>Spam, Phishing, Malware oder unaufgeforderte Werbung</li>
            <li>Beleidigungen, Hassrede, Diskriminierung oder Bedrohungen jeder Art</li>
            <li>Inhalte, die Minderjährige gefährden, sexualisieren oder ausbeuten (CSAM)</li>
            <li>Inhalte, die Dritte in ihren Persönlichkeitsrechten, Markenrechten oder sonstigen Rechten verletzen</li>
            <li>Falschinformationen (Desinformation), die geeignet sind, öffentlichen Schaden zu verursachen</li>
            <li>Terroristische Propaganda oder Aufrufe zu Gewalt</li>
          </ul>
          <p className="mt-2">
            Der Betreiber behält sich das Recht vor, rechtswidrige Inhalte ohne vorherige Ankündigung
            zu entfernen und betroffene Konten zu sperren. Im Fall von CSAM wird umgehend das BKA sowie
            die NCMEC Cyberhotline informiert.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 5 Jugendschutz</h2>
          <p className="mb-2">
            Der Betreiber trifft gemäß JuSchG und JMStV besondere Vorkehrungen zum Schutz von
            Minderjährigen:
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Inhalte, die für Minderjährige ungeeignet sind, können durch Nutzer und Administratoren
              als NSFW (Not Safe For Work) markiert werden und werden für Nutzer mit aktiviertem
              Jugendschutzfilter unkenntlich gemacht</li>
            <li>Jeder Nutzer kann in den Einstellungen einen Jugendschutzfilter aktivieren</li>
            <li>Der Betreiber hat einen Jugendschutzbeauftragten benannt (§ 7 JMStV)</li>
            <li>Meldungen über jugendgefährdende Inhalte werden priorisiert bearbeitet</li>
          </ul>
          <p className="mt-2">
            Kontakt Jugendschutzbeauftragter: <a href="mailto:jugendschutz@nexio.app" className="text-[#07c160] hover:underline">jugendschutz@nexio.app</a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 6 Melde- und Abhilfemechanismus (DSA Art. 16)</h2>
          <p className="mb-2">
            Gemäß Verordnung (EU) 2022/2065 (Digital Services Act) stellen wir ein zugängliches
            Meldesystem bereit. Jeder Nutzer kann rechtswidrige oder community-widrige Inhalte
            über das ••• Menü melden. Der Betreiber verpflichtet sich:
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Meldungen innerhalb von 24 Stunden zu sichten</li>
            <li>Den Melder über das Ergebnis zu informieren</li>
            <li>Offensichtlich rechtswidrige Inhalte (illegale Inhalte nach DSA Art. 3) unverzüglich zu entfernen</li>
            <li>Nutzern, gegen deren Inhalte vorgegangen wird, die Möglichkeit zur Stellungnahme zu geben</li>
            <li>Einen jährlichen Transparenzbericht zu veröffentlichen (DSA Art. 15)</li>
          </ul>
          <p className="mt-2">
            Für Meldungen steht auch folgende E-Mail-Adresse bereit:
            <a href="mailto:meldung@nexio.app" className="text-[#07c160] hover:underline ml-1">meldung@nexio.app</a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 7 Verfügbarkeit und Gewährleistung</h2>
          <p>
            Der Betreiber strebt eine hohe Verfügbarkeit an, übernimmt jedoch keine Garantie für
            ununterbrochene Nutzbarkeit. Wartungsarbeiten, technische Störungen oder Ausfälle bei
            Drittanbietern (Supabase, Vercel, LiveKit, Anthropic) können die Verfügbarkeit einschränken.
            Die Kernfunktionen von Nexio sind kostenlos.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 8 Haftungsbeschränkung</h2>
          <p>
            Der Betreiber haftet nicht für Schäden durch die Nutzung von Nexio, sofern diese nicht auf
            Vorsatz oder grober Fahrlässigkeit des Betreibers beruhen. Für nutzergenerierte Inhalte
            übernimmt der Betreiber keine Haftung, solange er nach Kenntnis rechtswidriger Inhalte
            unverzüglich handelt. Der Betreiber haftet nicht für Datenverluste durch technische Fehler,
            Angriffe Dritter oder höhere Gewalt.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 9 Zahlungsfunktionen (optional)</h2>
          <p>
            Sofern Zahlungsfunktionen aktiviert sind, werden diese über zugelassene Zahlungsdienstleister
            abgewickelt. Es gelten zusätzlich deren Nutzungsbedingungen. Der Betreiber tritt nicht als
            Zahlungsdienstleister auf und ist kein Institut im Sinne des ZAG oder KWG.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 10 KI-Assistent</h2>
          <p>
            Der integrierte KI-Assistent wird durch die Anthropic API bereitgestellt. KI-generierte
            Inhalte können fehlerhaft sein und ersetzen keine professionelle Beratung. Eingaben werden
            anonymisiert an Anthropic übermittelt. Der Betreiber ist nicht für KI-Ausgaben verantwortlich,
            soweit der Nutzer diese eigenverantwortlich nutzt.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 11 Urheberrecht und Lizenzen</h2>
          <p>
            Nutzer, die Inhalte (Texte, Bilder, Videos, Audio) auf Nexio veröffentlichen, räumen dem
            Betreiber eine nicht-exklusive, weltweite, vergütungsfreie Lizenz zur technischen Darstellung
            und Übertragung dieser Inhalte ein, soweit dies für den Betrieb der Plattform erforderlich ist.
            Diese Lizenz endet mit der Löschung des Inhalts. Nutzern steht es frei, eigene Inhalte
            jederzeit zu löschen.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 12 Kündigung und Kontolöschung</h2>
          <p>
            Nutzer können ihr Konto jederzeit im Profil-Bereich oder per E-Mail an{" "}
            <a href="mailto:hallo@hesselmann-service.de" className="text-[#07c160] hover:underline">hallo@hesselmann-service.de</a>{" "}
            löschen lassen. Nach der Löschung werden personenbezogene Daten gemäß DSGVO Art. 17
            innerhalb von 30 Tagen unwiderruflich gelöscht. Der Betreiber kann Konten bei Verstößen
            gegen diese AGB ohne Vorankündigung sperren oder löschen und informiert den Nutzer darüber.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 13 Änderungen der AGB</h2>
          <p>
            Der Betreiber behält sich vor, diese AGB jederzeit zu ändern. Nutzer werden über wesentliche
            Änderungen per Benachrichtigung in der App oder per E-Mail informiert. Bei wesentlichen
            Änderungen gilt eine 4-Wochen-Frist zur Ablehnung; danach gilt Zustimmung als erteilt.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">§ 14 Anwendbares Recht und Gerichtsstand</h2>
          <p>
            Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand für Streitigkeiten
            mit Kaufleuten ist Duisburg. EU-Verbraucher können auch vor den Gerichten ihres Wohnsitzlandes
            klagen. Plattform zur Online-Streitbeilegung (EU-KOM):{" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer"
              className="text-[#07c160] hover:underline">ec.europa.eu/consumers/odr</a>
          </p>
        </section>

        <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 flex flex-wrap gap-4">
          <Link href="/impressum" className="text-[#07c160] hover:underline">Impressum</Link>
          <Link href="/datenschutz" className="text-[#07c160] hover:underline">Datenschutz</Link>
          <Link href="/jugendschutz" className="text-[#07c160] hover:underline">Jugendschutz</Link>
          <Link href="/dsa" className="text-[#07c160] hover:underline">DSA Transparenz</Link>
        </div>
      </main>
    </div>
  );
}
