import React from 'react';
import { Link } from 'react-router-dom';

const Legal = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/" className="text-gray-600 hover:text-[#13B87B] transition-colors">Zurück zur Startseite</Link>
        </div>
        <h1 className="text-4xl font-bold mb-8">Impressum &amp; Rechtliches</h1>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">Impressum</h2>
          <p>Angaben gemäß § 5 TMG / § 24 MedienG / § 18 MStV</p>
          <p>Fabian Jeckel<br />Starkenburggasse 106<br />1160 Wien<br />Österreich</p>
          <p>Tim Teuscher<br />Charlie-Mills-Str. 5<br />22159 Hamburg<br />Deutschland</p>
          <p>Kontakt:<br />contact@financetransformers.ai</p>
          <p>Verantwortlich für den Inhalt gemäß § 18 Abs. 2 MStV:<br />Fabian Jeckel &amp; Tim Teuscher</p>
          <p>Wir sind privat organisiert. Keine gewerbliche Eintragung. Keine Umsatzsteuer-ID.</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">Datenschutzerklärung</h2>
          <p>Der Schutz deiner persönlichen Daten ist uns wichtig. Wir verarbeiten deine Daten ausschließlich auf Grundlage der gesetzlichen Bestimmungen (DSGVO, TKG 2003, BDSG).</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>Verantwortliche Stelle</strong><br />Siehe Impressum.</li>
            <li><strong>Erhebung und Verarbeitung personenbezogener Daten</strong><br />Wir verarbeiten personenbezogene Daten nur, wenn du uns diese aktiv mitteilst, z.&nbsp;B. über E-Mail.</li>
            <li><strong>Server-Logs</strong><br />Beim Besuch dieser Website speichert der Hostinganbieter technische Zugriffsdaten (z.&nbsp;B. IP-Adresse, Browser). Diese Daten werden nicht personenbezogen ausgewertet.</li>
            <li><strong>Cookies</strong><br />Unsere Website verwendet Cookies – siehe Cookie-Richtlinie.</li>
            <li><strong>Eingebettete Inhalte</strong><br />Diese Website kann Inhalte von Drittanbietern wie Spotify oder Apple Podcasts einbetten. Diese Dienste können eigene Cookies setzen und Daten erfassen.</li>
            <li><strong>Deine Rechte</strong><br />Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Bitte melde dich dazu unter: contact@financetransformers.ai</li>
          </ol>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">Nutzungsbedingungen</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>Inhalte</strong><br />Alle Inhalte auf dieser Website und im Podcast WTF?! – Why Transform Finance?! sind urheberrechtlich geschützt. Eine Nutzung außerhalb des gesetzlich Zulässigen bedarf unserer Zustimmung.</li>
            <li><strong>Haftung</strong><br />Die Inhalte auf dieser Website werden sorgfältig erstellt, es besteht jedoch keine Garantie auf Richtigkeit, Vollständigkeit oder Aktualität.</li>
            <li><strong>Verfügbarkeit</strong><br />Wir behalten uns das Recht vor, Inhalte jederzeit zu ändern, zu löschen oder nicht weiterzuführen.</li>
            <li><strong>Externe Links</strong><br />Diese Website enthält Links zu externen Webseiten Dritter. Für diese Inhalte übernehmen wir keine Haftung.</li>
          </ol>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">Cookie-Richtlinie</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>Was sind Cookies?</strong><br />Cookies sind kleine Textdateien, die im Browser gespeichert werden, um die Websitefunktionalität zu verbessern.</li>
            <li><strong>Welche Cookies setzen wir ein?</strong><br />Essenzielle Cookies für Grundfunktionen (z.&nbsp;B. Consent-Management)<br />Drittanbieter-Cookies von Spotify, Apple Podcasts o.&nbsp;ä. für eingebettete Player</li>
            <li><strong>Zustimmung</strong><br />Beim ersten Besuch wirst du um Zustimmung für Cookies gebeten. Du kannst diese Entscheidung jederzeit über deine Browsereinstellungen ändern.</li>
          </ol>
          <p className="text-sm text-gray-500">Letzte Aktualisierung: Juli 2025</p>
        </section>
      </div>
    </div>
  );
};

export default Legal;
