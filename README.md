# Mr. NongNong – Homepage mit Shop (Prototyp)

Startseite, Shop, Produktseiten und **eigener Warenkorb** im Design der Seite. Bei „Zur Kasse“ schickt eine kleine
Funktion den ganzen Warenkorb an **Stripe**. Der Kunde zahlt auf der sicheren Stripe-Seite mit Karte oder – je nach
Gerät – Apple Pay / Google Pay und kommt danach auf die Danke-Seite zurück.

**Kosten:** Netlify (kostenloser Tarif) + Stripe-Gebühr pro Zahlung. Keine Monatsgebühr.

> Netlify rechnet im Gratis-Tarif mit einem monatlichen Kontingent (Hochladen, Datenmenge, Kassenaufrufe). Für einen kleinen Shop reicht das normalerweise. Nicht unnötig oft neu hochladen. Falls die Seite einmal pausiert ist: bei Netlify unter **Usage** nachsehen. Aktuelle Grenzen: netlify.com/pricing.

## Was im Paket ist
| Datei / Ordner | Wofür |
|---|---|
| `index.html` | die ganze Seite (Start, Shop, Produkte, Warenkorb, Danke) |
| `img/` | Bilder und Videos |
| `netlify/functions/checkout.js` | die Kassenfunktion (Preise + Übergabe an Stripe) |
| `netlify.toml` | sagt Netlify, wo Seite und Funktion liegen |

> **Wichtig:** Auf GitHub Pages läuft die Kasse NICHT (dort gibt es keine Funktionen). Die Seite kommt auf **Netlify**.

## 1. Stripe vorbereiten
1. Konto auf **stripe.com** anlegen: Firmendaten, IBAN, Ausweis bestätigen.
2. **Entwickler → API-Schlüssel:** den **geheimen Testschlüssel** (`sk_test_…`) kopieren.
   Dieser Schlüssel ist geheim: niemals in `index.html`, auf GitHub oder per E-Mail weitergeben.
3. **Einstellungen → Branding:** Logo und Farben für die Bezahlseite.
4. **Einstellungen → Kunden-E-Mails:** „Erfolgreiche Zahlungen“ einschalten (Kunde bekommt einen Beleg).
5. **Einstellungen → Benachrichtigungen:** „Erfolgreiche Zahlungen“ einschalten (du bekommst bei jeder Bestellung eine E-Mail) – oder die Stripe-App am Handy nutzen.

## 2. Dateien auf GitHub
Den **Inhalt** dieses Ordners in dein Repository `mrnongnong-homepage` hochladen (alte Dateien ersetzen).
Der Ordner `netlify` muss mit hochgeladen werden.

## 3. Netlify einrichten (einmalig)
1. Auf **netlify.com** mit „Sign up with GitHub“ ein kostenloses Konto anlegen.
2. **Add new site → Import an existing project → GitHub** → Repository `mrnongnong-homepage` wählen.
   Build-Einstellungen leer lassen → **Deploy**.
3. **Site configuration → Environment variables** → diese Werte anlegen:
   - `STRIPE_SECRET_KEY` = dein `sk_test_…` Schlüssel
   - `VERSAND_CENT` = Versandkosten in Cent für normale Pakete (aufgeladene Kohle, Dünger, Bonsai), z. B. `690` für 6,90 €. Ohne diesen Wert geht nur Abholung.
   - `VERSAND_GROSS_CENT` = Versandkosten in Cent, sobald PUR-Säcke (20/30/50 l) im Warenkorb sind. Ohne diesen Wert gibt es PUR nur zur Abholung.
   - `VERSAND_LAENDER` = z. B. `AT,DE` (ohne Angabe: nur Österreich). Achtung: alle Länder zahlen denselben Versandpreis.
   - optional `AGB_PFLICHT` = `1`, wenn der Kunde den AGB zustimmen muss (AGB-Link vorher in Stripe unter „Öffentliche Details“ eintragen)
4. **Deploys → Trigger deploy**, damit die Werte gelten.
5. Netlify zeigt dir eine Adresse wie `https://….netlify.app`. Dort testen.
6. In `index.html` nach `VERSAND_INFO` suchen und die Versandkosten als Text eintragen, z. B.
   `'Versand in Österreich: 6,90 €, PUR-Säcke 14,90 €.'` – damit der Kunde sie schon im Warenkorb sieht (gesetzlich vorgeschrieben: Kosten vor der Bestellung nennen).

## 4. Testen (kein echtes Geld)
Produkte in den Warenkorb, Abholung oder Versand wählen, „Zur Kasse“.
Testkarte: `4242 4242 4242 4242`, ein beliebiges Ablaufdatum in der Zukunft, beliebige Prüfziffer.
Nach der Zahlung landest du auf der Danke-Seite. Die Bestellung siehst du in Stripe unter **Zahlungen**: Die Beschreibung
zeigt z. B. „Mr. NongNong – Abholung + Gratis-Lektüre“. In der Zahlung findest du Name, Adresse, Telefon, Artikel und die
Felder `lieferung` und `gratis_lektuere`.
Im Testmodus verschickt Stripe **keine** E-Mails an Kunden – das ist normal.

## 5. Live schalten
1. In Stripe den **Live-Schlüssel** (`sk_live_…`) holen und in Netlify bei `STRIPE_SECRET_KEY` eintragen.
2. **Trigger deploy.**
3. Vorher müssen **Impressum, Datenschutz, AGB und Widerrufsbelehrung** fertig sein. Auf der Seite gibt es dafür schon eigene
   Unterseiten (Fußzeile) – derzeit mit Entwurf bzw. Platzhaltern. Texte in `index.html` beim Objekt `LEGAL` eintragen.
4. Einmal echt testen: kleinen Artikel live kaufen und in Stripe wieder erstatten.
5. Steuer: Ob du Kleinunternehmer bist, ob die Preise inkl. USt. sind und ob die Stripe-Quittung als Rechnung reicht, mit dem Steuerberater klären.
6. Mehr Sicherheit (optional): statt `sk_live_…` einen eingeschränkten Schlüssel (`rk_live_…`) nur mit Schreibrecht für „Checkout Sessions“ verwenden.
7. In Stripe unter **Einstellungen → Zahlungsmethoden** prüfen, welche Methoden aktiv sind (Karte, Apple Pay, Google Pay). Weitere Methoden wie Klarna oder EPS erscheinen ebenfalls – mit eigenen Gebühren.

## 6. Eigene Domain (erst wenn alles passt!)
Solange `mrnongnong.at` auf Wix zeigt, bleibt die alte Seite online. Vor dem Umstellen:
- Impressum, Datenschutz, AGB, Widerruf sind fertig (siehe Punkt 5). Die Wix-Seiten (auch `/handel`) sind danach nicht mehr erreichbar – den Händler-Link in der Fußzeile vorher anpassen.
- Bei IONOS prüfen, dass die Domain noch die **IONOS-Nameserver** verwendet. (Falls sie für Wix auf Wix-Nameserver umgestellt wurde, liegen DNS und E-Mail-Einträge gerade bei Wix – dann vorher fragen.)

Dann: Netlify → **Domain management → Add a domain** → `mrnongnong.at`.
- **NICHT** „Netlify DNS“ wählen und **NICHT** die Nameserver ändern.
- Bei IONOS nur den **A-Eintrag** für `mrnongnong.at` auf die von Netlify genannte IP setzen und den **CNAME** für `www` auf deine `….netlify.app`-Adresse. Vorhandene AAAA-Einträge für `@`/`www` löschen.
- **MX- und TXT(SPF)-Einträge nicht anfassen** – sonst kommt keine Post mehr an info@mrnongnong.at.

## Preise ändern
Preise stehen an **zwei** Stellen und müssen gleich sein:
- `index.html` → Objekt `P` (z. B. `price:32.5`)
- `netlify/functions/checkout.js` → `PRODUKTE` (in Cent, z. B. `cent: 3250`)
Versandkosten: Netlify-Werte `VERSAND_CENT` / `VERSAND_GROSS_CENT` **und** den Text `VERSAND_INFO` in `index.html` gleich halten.
Ausverkauft: in beiden Dateien `sold:true` bzw. `ausverkauft: true` setzen.

## Noch offen
- **Google-Maps-Link:** in `index.html` nach `data-maps` suchen, echten Link eintragen, `class="todo"` entfernen.
- **Partikeldünger:** Produktbild zeigt noch das alte Etikett (NPK 4-1-3); richtig ist 6-1-3.
