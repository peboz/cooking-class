import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}`;
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Potvrdite svoj e-mail - Gurmania',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 30px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #000;
              color: #fff !important;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Dobrodošli u Gurmaniju!</h2>
            <p>Hvala na registraciji! Nadamo se da ćete uživati na našoj platformi.</p>
            <p>Molimo potvrdite svoj e-mail kako biste aktivirali račun klikom na gumb ispod:</p>
            <a href="${verifyUrl}" class="button">Potvrdi e-mail</a>
            <p>Kopirajte i zalijepite ovaj link u svoj preglednik ako gumb ne radi:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">${verifyUrl}</p>
            <div class="footer">
              <p>Link ističe za 24 sata.</p>
              <p>Ako niste registrirali račun, možete ignorirati ovu poruku.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Resetirajte svoju lozinku - Gurmania',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 30px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #000;
              color: #fff !important;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Resetirajte svoju lozinku</h2>
            <p>Primili smo zahtjev za resetiranje lozinke za vaš račun na Gurmaniji.</p>
            <p>Kliknite gumb ispod za resetiranje lozinke:</p>
            <a href="${resetUrl}" class="button">Resetiraj lozinku</a>
            <p>Kopirajte i zalijepite ovaj link u svoj preglednik ako gumb ne radi:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
            <div class="footer">
              <p>Link ističe za 24 sata.</p>
              <p>Ako niste zatražili resetiranje lozinke, možete ignorirati ovu poruku.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendSetPasswordEmail(email: string, token: string) {
  const setPasswordUrl = `${baseUrl}/auth/set-password?token=${token}`;
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Postavite svoju lozinku - Gurmania',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 30px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #000;
              color: #fff !important;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Postavite svoju lozinku</h2>
            <p>Prijavili ste se s Googleom, ali možete postaviti lozinku za prijavu s e-mailom i lozinkom.</p>
            <p>Kliknite gumb ispod za postavljanje lozinke:</p>
            <a href="${setPasswordUrl}" class="button">Postavi lozinku</a>
            <p>Kopirajte i zalijepite ovaj link u svoj preglednik ako gumb ne radi:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">${setPasswordUrl}</p>
            <div class="footer">
              <p>Link ističe za 24 sata.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

