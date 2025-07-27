// E-Mail Service mit mehreren Anbietern
import supabase from '../lib/supabase';

class EmailService {
  constructor() {
    // Konfiguration für verschiedene E-Mail-Anbieter
    this.config = {
      // Option 1: Supabase Edge Functions (empfohlen)
      supabaseFunction: {
        url: 'https://brqqgvvaofimdlrfliba.supabase.co/functions/v1/send-email',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      },
      
      // Option 2: EmailJS (einfachste Lösung)
      emailjs: {
        serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
        templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      },
      
      // Option 3: Resend (moderne Alternative)
      resend: {
        apiKey: import.meta.env.VITE_RESEND_API_KEY,
        url: 'https://api.resend.com/emails'
      }
    };
  }

  // Hauptmethode zum Versenden von Bestätigungs-E-Mails
  async sendConfirmationEmail(email, token, name, companyName) {
    const confirmationUrl = `${window.location.origin}/#/confirm-email/${token}`;
    
    const emailData = {
      to: email,
      subject: 'Willkommen bei Meister-Suite - E-Mail bestätigen',
      html: this.generateConfirmationEmailHTML(name, confirmationUrl, companyName),
      text: this.generateConfirmationEmailText(name, confirmationUrl, companyName)
    };

    // Versuche verschiedene E-Mail-Services in Reihenfolge
    try {
      // Zuerst Supabase Edge Function versuchen
      return await this.sendViaSupabase(emailData);
    } catch (error) {
      console.warn('Supabase email failed, trying EmailJS:', error);
      
      try {
        // Falls Supabase fehlschlägt, EmailJS versuchen
        return await this.sendViaEmailJS(emailData);
      } catch (error) {
        console.warn('EmailJS failed, trying Resend:', error);
        
        try {
          // Als letztes Resend versuchen
          return await this.sendViaResend(emailData);
        } catch (error) {
          console.error('All email services failed:', error);
          // Fallback: In Datenbank speichern für manuellen Versand
          return await this.saveForManualSending(emailData, token);
        }
      }
    }
  }

  // Option 1: Supabase Edge Function (empfohlen)
  async sendViaSupabase(emailData) {
    const response = await fetch(this.config.supabaseFunction.url, {
      method: 'POST',
      headers: this.config.supabaseFunction.headers,
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error(`Supabase email service error: ${response.statusText}`);
    }

    return await response.json();
  }

  // Option 2: EmailJS (Browser-basiert, einfach zu implementieren)
  async sendViaEmailJS(emailData) {
    // EmailJS muss erst geladen werden
    if (!window.emailjs) {
      await this.loadEmailJS();
    }

    const templateParams = {
      to_email: emailData.to,
      to_name: emailData.to.split('@')[0], // Name aus E-Mail extrahieren
      subject: emailData.subject,
      message: emailData.text,
      confirmation_url: emailData.html.match(/href="([^"]*)/)?.[1] || ''
    };

    return await window.emailjs.send(
      this.config.emailjs.serviceId,
      this.config.emailjs.templateId,
      templateParams,
      this.config.emailjs.publicKey
    );
  }

  // Option 3: Resend API
  async sendViaResend(emailData) {
    const response = await fetch(this.config.resend.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.resend.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'noreply@meister-suite.de',
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      })
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`);
    }

    return await response.json();
  }

  // Fallback: In Datenbank speichern
  async saveForManualSending(emailData, token) {
    const { error } = await supabase
      .from('email_confirmations_ms2024')
      .insert([{
        email: emailData.to,
        token: token,
        name: emailData.to.split('@')[0],
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }]);

    if (error) throw error;

    // Zeige dem Benutzer eine alternative Bestätigungsmethode
    return {
      success: true,
      fallback: true,
      message: 'E-Mail-Versand temporär nicht verfügbar. Sie können Ihr Konto alternativ über die Administrationsoberfläche bestätigen.'
    };
  }

  // EmailJS Bibliothek laden
  async loadEmailJS() {
    return new Promise((resolve, reject) => {
      if (window.emailjs) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      script.onload = () => {
        window.emailjs.init(this.config.emailjs.publicKey);
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // HTML E-Mail Template
  generateConfirmationEmailHTML(name, confirmationUrl, companyName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>E-Mail bestätigen - Meister-Suite</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px 20px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Willkommen bei Meister-Suite!</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name},</h2>
            <p>vielen Dank für Ihre Registrierung bei Meister-Suite${companyName ? ` für ${companyName}` : ''}!</p>
            <p>Um Ihr Konto zu aktivieren und mit der kostenlosen 30-Tage-Testversion zu beginnen, bestätigen Sie bitte Ihre E-Mail-Adresse:</p>
            <p style="text-align: center;">
              <a href="${confirmationUrl}" class="button">E-Mail-Adresse bestätigen</a>
            </p>
            <p><small>Oder kopieren Sie diesen Link in Ihren Browser:<br>
            <a href="${confirmationUrl}">${confirmationUrl}</a></small></p>
            <p><strong>Wichtige Hinweise:</strong></p>
            <ul>
              <li>Dieser Link ist 24 Stunden gültig</li>
              <li>Falls Sie sich nicht registriert haben, ignorieren Sie diese E-Mail</li>
              <li>Nach der Bestätigung können Sie sofort mit der Nutzung beginnen</li>
            </ul>
          </div>
          <div class="footer">
            <p>© 2024 Meister-Suite. Alle Rechte vorbehalten.</p>
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Text E-Mail Template
  generateConfirmationEmailText(name, confirmationUrl, companyName) {
    return `
Willkommen bei Meister-Suite!

Hallo ${name},

vielen Dank für Ihre Registrierung bei Meister-Suite${companyName ? ` für ${companyName}` : ''}!

Um Ihr Konto zu aktivieren, klicken Sie bitte auf den folgenden Link:
${confirmationUrl}

Dieser Link ist 24 Stunden gültig.
Falls Sie sich nicht registriert haben, ignorieren Sie diese E-Mail.

Mit freundlichen Grüßen
Ihr Meister-Suite Team

---
© 2024 Meister-Suite. Alle Rechte vorbehalten.
Diese E-Mail wurde automatisch generiert.
    `;
  }

  // E-Mail für Einladungen
  async sendInvitationEmail(email, token, companyName, roleName, inviterName) {
    const invitationUrl = `${window.location.origin}/#/invitation/${token}`;
    
    const emailData = {
      to: email,
      subject: `Einladung zu ${companyName} - Meister-Suite`,
      html: this.generateInvitationEmailHTML(email, invitationUrl, companyName, roleName, inviterName),
      text: this.generateInvitationEmailText(email, invitationUrl, companyName, roleName, inviterName)
    };

    return await this.sendConfirmationEmail(email, token, email.split('@')[0], companyName);
  }

  generateInvitationEmailHTML(email, invitationUrl, companyName, roleName, inviterName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Einladung zu ${companyName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px 20px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .info-box { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 15px; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Sie wurden eingeladen!</h1>
          </div>
          <div class="content">
            <h2>Hallo,</h2>
            <p>${inviterName} hat Sie eingeladen, dem Team von <strong>${companyName}</strong> beizutreten.</p>
            
            <div class="info-box">
              <h3>Ihre Einladungsdetails:</h3>
              <ul>
                <li><strong>Unternehmen:</strong> ${companyName}</li>
                <li><strong>Rolle:</strong> ${roleName}</li>
                <li><strong>E-Mail:</strong> ${email}</li>
              </ul>
            </div>

            <p>Um der Einladung zu folgen und Ihr Konto zu erstellen, klicken Sie auf den folgenden Button:</p>
            
            <p style="text-align: center;">
              <a href="${invitationUrl}" class="button">Einladung annehmen</a>
            </p>
            
            <p><small>Oder kopieren Sie diesen Link in Ihren Browser:<br>
            <a href="${invitationUrl}">${invitationUrl}</a></small></p>
            
            <p><strong>Wichtige Hinweise:</strong></p>
            <ul>
              <li>Diese Einladung ist 7 Tage gültig</li>
              <li>Sie benötigen kein bestehendes Konto</li>
              <li>Falls Sie diese Einladung nicht erwartet haben, ignorieren Sie diese E-Mail</li>
            </ul>
          </div>
          <div class="footer">
            <p>© 2024 Meister-Suite. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateInvitationEmailText(email, invitationUrl, companyName, roleName, inviterName) {
    return `
Sie wurden zu ${companyName} eingeladen!

Hallo,

${inviterName} hat Sie eingeladen, dem Team von ${companyName} beizutreten.

Ihre Einladungsdetails:
- Unternehmen: ${companyName}
- Rolle: ${roleName}  
- E-Mail: ${email}

Um der Einladung zu folgen, klicken Sie auf den folgenden Link:
${invitationUrl}

Diese Einladung ist 7 Tage gültig.
Falls Sie diese Einladung nicht erwartet haben, ignorieren Sie diese E-Mail.

Mit freundlichen Grüßen
Ihr Meister-Suite Team
    `;
  }
}

export default new EmailService();