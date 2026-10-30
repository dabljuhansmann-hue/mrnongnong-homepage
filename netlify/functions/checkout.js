// Kassenfunktion für Mr. NongNong
// Nimmt den Warenkorb der Homepage entgegen und erstellt eine Stripe-Bezahlseite (Checkout Session).
// Die Preise stehen HIER und nicht im Browser – so kann niemand im Warenkorb einen Preis verändern.
//
// Einstellungen in Netlify (Site configuration → Environment variables):
//   STRIPE_SECRET_KEY  – geheimer Schlüssel aus Stripe (Test: sk_test_…, Live: sk_live_…). Pflicht.
//   VERSAND_CENT       – Versandkosten in Cent für normale Pakete, z. B. 690 für 6,90 €. Ohne diesen Wert ist nur Abholung möglich.
//   VERSAND_GROSS_CENT – Versandkosten in Cent, sobald PUR-Säcke (20/30/50 l) im Warenkorb sind. Ohne diesen Wert: PUR nur zur Abholung.
//   VERSAND_LAENDER    – optional, Länder für den Versand, z. B. "AT,DE". Standard: AT.
//   AGB_PFLICHT        – optional, "1" = Kunde muss den AGB zustimmen (AGB-Link vorher in Stripe hinterlegen).

// Preise in Cent – bei Preisänderungen hier UND in index.html (Objekt P) anpassen.
const PRODUKTE = {
  auf:  { name: 'Pflanzenkohle aufgeladen 5 l', cent: 3250 },
  auf2: { name: 'Pflanzenkohle aufgeladen 2 l', cent: 1690 },
  p20:  { name: 'Pflanzenkohle PUR 20 l', cent: 5590 },
  p30:  { name: 'Pflanzenkohle PUR 30 l', cent: 7990 },
  p50:  { name: 'Pflanzenkohle PUR 50 l', cent: 9000 },
  pd1:  { name: 'Partikeldünger 1 l', cent: 1590 },
  pd2:  { name: 'Partikeldünger 2 l', cent: 2890, ausverkauft: true },
  bon:  { name: 'Bonsai Substrat', cent: 1799 },
  womb: { name: 'WOMB SAI', cent: 1890 },
  buch: { name: 'Der beste Boden (Gratis-Lektüre)', cent: 0 }
};

const ABHOLUNG = 'Abholung in Niederwölz: Mo, Do 9–17 Uhr, Di, Mi nach Vereinbarung.';

function antwort(status, daten) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    body: JSON.stringify(daten)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return antwort(405, { error: 'Nur POST erlaubt.' });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return antwort(500, { error: 'Die Kasse ist noch nicht eingerichtet. Bitte bestell telefonisch: +43 660 874 3416.' });

  let eingabe;
  try { eingabe = JSON.parse(event.body || '{}'); } catch (e) { return antwort(400, { error: 'Ungültige Anfrage.' }); }

  const items = Array.isArray(eingabe.items) ? eingabe.items : [];
  if (!items.length) return antwort(400, { error: 'Der Warenkorb ist leer.' });
  if (items.length > 20) return antwort(400, { error: 'Zu viele verschiedene Artikel. Bitte ruf an: +43 660 874 3416.' });

  const versand = eingabe.ship === 'vs';
  const grossTeile = items.some(it => it && ['p20', 'p30', 'p50'].includes(it.id));
  const versandCent = parseInt(grossTeile ? process.env.VERSAND_GROSS_CENT : process.env.VERSAND_CENT, 10);
  if (versand && !(versandCent >= 0)) {
    return antwort(400, { error: grossTeile
      ? 'PUR-Säcke gibt es derzeit nur zur Abholung in Niederwölz. Bitte wähle Abholung oder ruf an: +43 660 874 3416.'
      : 'Versand ist noch nicht eingerichtet. Bitte wähle Abholung oder ruf an: +43 660 874 3416.' });
  }

  const p = new URLSearchParams();
  let n = 0, gratisLektuere = false;
  for (const it of items) {
    const prod = PRODUKTE[it && it.id];
    const q = Number(it && it.q);
    if (!prod || !Number.isInteger(q) || q < 1 || q > 99) return antwort(400, { error: 'Ein Artikel im Warenkorb ist ungültig. Bitte lade die Seite neu.' });
    if (prod.ausverkauft) return antwort(400, { error: prod.name + ' ist leider ausverkauft. Bitte entferne es aus dem Warenkorb.' });
    if (prod.cent === 0) { gratisLektuere = true; continue; }
    p.append(`line_items[${n}][price_data][currency]`, 'eur');
    p.append(`line_items[${n}][price_data][unit_amount]`, String(prod.cent));
    p.append(`line_items[${n}][price_data][product_data][name]`, prod.name);
    p.append(`line_items[${n}][quantity]`, String(q));
    n++;
  }
  if (!n) return antwort(400, { error: 'Bitte leg mindestens ein Produkt in den Warenkorb.' });

  const basis = (process.env.URL || (event.headers && (event.headers.origin || event.headers.Origin)) || '').replace(/\/$/, '');
  if (!basis) return antwort(500, { error: 'Die Adresse der Website ist unbekannt.' });

  p.append('mode', 'payment');
  p.append('locale', 'de');
  p.append('success_url', basis + '/#danke');
  p.append('cancel_url', basis + '/#warenkorb');
  p.append('billing_address_collection', 'required');
  p.append('phone_number_collection[enabled]', 'true');
  const lieferung = versand ? 'Versand' : 'Abholung';
  const lekt = gratisLektuere ? 'ja' : 'nein';
  // Auf der Bestellung (Session) UND auf der Zahlung, damit es im Stripe-Dashboard unter „Zahlungen“ sichtbar ist
  p.append('metadata[lieferung]', lieferung);
  p.append('metadata[gratis_lektuere]', lekt);
  p.append('payment_intent_data[metadata][lieferung]', lieferung);
  p.append('payment_intent_data[metadata][gratis_lektuere]', lekt);
  p.append('payment_intent_data[description]', 'Mr. NongNong – ' + lieferung + (gratisLektuere ? ' + Gratis-Lektüre' : ''));

  if (versand) {
    const laender = (process.env.VERSAND_LAENDER || 'AT').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    laender.forEach((c, i) => p.append(`shipping_address_collection[allowed_countries][${i}]`, c));
    p.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
    p.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(versandCent));
    p.append('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'eur');
    p.append('shipping_options[0][shipping_rate_data][display_name]', 'Versand');
  } else {
    p.append('custom_text[submit][message]', ABHOLUNG);
  }
  if (gratisLektuere) {
    p.append('custom_text[after_submit][message]', 'Die Gratis-Lektüre „Der beste Boden“ liegt deiner Bestellung bei.');
  }
  if (process.env.AGB_PFLICHT === '1') p.append('consent_collection[terms_of_service]', 'required');

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: p.toString()
    });
    const d = await r.json();
    if (!r.ok || !d.url) {
      console.error('Stripe-Fehler', r.status, d && d.error && d.error.message);
      return antwort(502, { error: 'Die Bezahlseite konnte nicht geöffnet werden. Bitte versuch es noch einmal oder ruf an: +43 660 874 3416.' });
    }
    return antwort(200, { url: d.url });
  } catch (e) {
    console.error('Verbindung zu Stripe fehlgeschlagen', e);
    return antwort(502, { error: 'Die Bezahlseite ist gerade nicht erreichbar. Bitte versuch es gleich noch einmal.' });
  }
};

// Für Tests
exports._PRODUKTE = PRODUKTE;
