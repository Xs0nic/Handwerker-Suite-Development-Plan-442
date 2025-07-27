# E-Mail Service Setup für Meister-Suite

## Übersicht der E-Mail-Optionen

Die Meister-Suite unterstützt mehrere E-Mail-Services für das Versenden von Bestätigungs- und Einladungs-E-Mails:

### 1. EmailJS (Empfohlen - Einfachste Lösung)

**Vorteile:**
- Komplett kostenlos für bis zu 200 E-Mails/Monat
- Läuft direkt im Browser
- Keine Server-Konfiguration nötig
- Sehr einfache Einrichtung

**Setup:**
1. Gehen Sie zu [EmailJS.com](https://www.emailjs.com)
2. Erstellen Sie ein kostenloses Konto
3. Erstellen Sie einen E-Mail-Service (Gmail, Outlook, etc.)
4. Erstellen Sie ein E-Mail-Template
5. Kopieren Sie die IDs in Ihre `.env` Datei

**Template für EmailJS:**
```
Betreff: Willkommen bei Meister-Suite - E-Mail bestätigen

Hallo {{to_name}},

{{message}}

Bestätigungslink: {{confirmation_url}}

Mit freundlichen Grüßen
Ihr Meister-Suite Team
```

### 2. Resend (Professionell)

**Vorteile:**
- Moderne, entwicklerfreundliche API
- Bessere Zustellbarkeit
- Professionelle E-Mail-Templates
- 3.000 kostenlose E-Mails/Monat

**Setup:**
1. Registrieren Sie sich bei [Resend.com](https://resend.com)
2. Verifizieren Sie Ihre Domain (oder nutzen Sie die Test-Domain)
3. Erstellen Sie einen API-Key
4. Fügen Sie den Key zu Ihrer `.env` hinzu

### 3. Supabase Edge Functions (Für fortgeschrittene Nutzer)

**Vorteile:**
- Vollständige Kontrolle
- Server-seitiges Senden
- Bessere Sicherheit
- Integration in bestehende Supabase-Infrastruktur

**Setup:**
Erstellen Sie eine Edge Function in Supabase:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { to, subject, html, text } = await req.json()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'noreply@yourdomain.com',
      to: [to],
      subject,
      html,
      text,
    }),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

## Schnellstart mit EmailJS

1. **EmailJS Account erstellen:**
   - Gehen Sie zu https://www.emailjs.com
   - Registrieren Sie sich kostenlos

2. **E-Mail Service hinzufügen:**
   - Klicken Sie auf "Email Services"
   - Wählen Sie Ihren E-Mail-Provider (Gmail, Outlook, etc.)
   - Folgen Sie den Anweisungen zur Verbindung

3. **E-Mail Template erstellen:**
   - Klicken Sie auf "Email Templates"
   - Erstellen Sie ein neues Template
   - Verwenden Sie diese Variablen:
     - `{{to_email}}` - Empfänger E-Mail
     - `{{to_name}}` - Empfänger Name
     - `{{subject}}` - E-Mail Betreff
     - `{{message}}` - E-Mail Inhalt
     - `{{confirmation_url}}` - Bestätigungslink

4. **Umgebungsvariablen setzen:**
   ```bash
   VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
   VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
   VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxx
   ```

5. **Testen:**
   - Registrieren Sie sich in der App
   - Prüfen Sie Ihr E-Mail-Postfach
   - Die E-Mail sollte automatisch ankommen

## Fallback-System

Das System versucht die E-Mail-Services in dieser Reihenfolge:
1. Supabase Edge Function
2. EmailJS
3. Resend
4. Fallback: Speicherung in Datenbank für manuellen Versand

## Troubleshooting

**E-Mails kommen nicht an:**
- Prüfen Sie Spam-Ordner
- Verifizieren Sie Ihre API-Keys
- Prüfen Sie die Browser-Konsole auf Fehler
- Testen Sie mit einer anderen E-Mail-Adresse

**EmailJS Fehler:**
- Stellen Sie sicher, dass der Service aktiv ist
- Prüfen Sie die Template-ID
- Überprüfen Sie die CORS-Einstellungen

**Rate Limits:**
- EmailJS: 200/Monat kostenlos
- Resend: 3.000/Monat kostenlos
- Bei Überschreitung upgraden oder zusätzliche Services konfigurieren