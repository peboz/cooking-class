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

export async function sendInstructorApprovedEmail(email: string, userName: string) {
  const instructorPanelUrl = `${baseUrl}/app/instructor`;
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Vaša prijava za instruktora je odobrena',
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
              background-color: #fff5f0;
              border-radius: 8px;
              padding: 30px;
              margin: 20px 0;
              border: 2px solid #ea580c;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #ea580c;
              margin: 0;
              font-size: 28px;
            }
            .button {
              display: inline-block;
              padding: 14px 28px;
              background-color: #ea580c;
              color: #fff !important;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: 600;
            }
            .info-box {
              background-color: #fff;
              border-left: 4px solid #ea580c;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
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
            <div class="header">
              <h1>🎉 Čestitamo!</h1>
            </div>
            <h2>Dobrodošli u tim Gurmania instruktora!</h2>
            <p>Dragi/a ${userName},</p>
            <p>Radujemo se obavijestiti vas da je vaša prijava za instruktora <strong>odobrena</strong>!</p>
            <p>Sada možete kreirati i voditi tečajeve, organizirati live radionice i dijeliti svoje kulinarske vještine s polaznicima diljem svijeta.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">Kako započeti:</h3>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Pristupite <strong>Instruktorskom panelu</strong> klikom na gumb ispod</li>
                <li>Kreirajte svoj prvi tečaj ili radionicu</li>
                <li>Dodajte lekcije, materijale i recepte</li>
                <li>Objavite i započnite podučavanje!</li>
              </ol>
            </div>

            <div style="text-align: center;">
              <a href="${instructorPanelUrl}" class="button">Otvori Instruktorski panel</a>
            </div>

            <p>Također možete pristupiti instruktorskom panelu klikom na svoj profil u gornjem desnom kutu i odabirom "Instruktorski panel".</p>

            <div class="footer">
              <p>Ako imate bilo kakva pitanja, slobodno nas kontaktirajte.</p>
              <p>Sretno podučavanje!</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendInstructorRejectedEmail(email: string, userName: string, reason: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Vaša prijava za instruktora je ažurirana',
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
            .reason-box {
              background-color: #fff;
              border-left: 4px solid #dc2626;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #ea580c;
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
            <p>Poštovani/a ${userName},</p>
            <p>Hvala Vam što ste pokazali interes za stjecanje pozicije instruktora na Gurmaniji.</p>
            <p>Nakon pregleda vaše prijave, nažalost ne možemo odobriti vaš zahtjev u ovom trenutku.</p>
            
            <div class="reason-box">
              <h3 style="margin-top: 0;">Razlog:</h3>
              <p style="margin: 0;">${reason}</p>
            </div>

            <p>Ne brinite! Možete se ponovno prijaviti nakon što riješite navedene probleme. Trudimo se održati visoku kvalitetu naših instruktora kako bismo pružili najbolje iskustvo našim korisnicima.</p>

            <p>Ako imate dodatnih pitanja ili trebate pojašnjenje, slobodno nas kontaktirajte.</p>

            <div style="text-align: center;">
              <a href="${baseUrl}/app" class="button">Povratak na platformu</a>
            </div>

            <div class="footer">
              <p>Hvala na razumijevanju.</p>
              <p>Tim Gurmania</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendQuestionNotification(
  instructorEmail: string,
  instructorName: string,
  lessonTitle: string,
  courseTitle: string,
  questionContent: string,
  courseId: string,
  lessonId: string
) {
  const lessonUrl = `${baseUrl}/app/courses/${courseId}/lessons/${lessonId}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: instructorEmail,
    subject: `Novo pitanje na lekciji: ${lessonTitle} - Gurmania`,
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
            .question-box {
              background-color: #fff;
              border-left: 4px solid #f97316;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
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
            <h2>Novo pitanje na vašoj lekciji</h2>
            <p>Poštovani/a ${instructorName},</p>
            <p>Polaznik je postavio pitanje na vašoj lekciji <strong>${lessonTitle}</strong> u tečaju <strong>${courseTitle}</strong>.</p>
            
            <div class="question-box">
              <h3 style="margin-top: 0;">Pitanje:</h3>
              <p style="margin: 0;">${questionContent.length > 300 ? questionContent.substring(0, 300) + '...' : questionContent}</p>
            </div>

            <p>Odgovorite na pitanje kako biste pomogli polazniku i poboljšali njihovo iskustvo učenja.</p>

            <div style="text-align: center;">
              <a href="${lessonUrl}" class="button">Pogledaj i odgovori</a>
            </div>

            <div class="footer">
              <p>Možete se odjaviti od obavijesti o pitanjima u postavkama svog računa.</p>
              <p>Tim Gurmania</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendReplyNotification(
  recipientEmail: string,
  recipientName: string,
  replierName: string,
  replyContent: string,
  originalComment: string,
  lessonTitle: string,
  courseTitle: string,
  courseId: string,
  lessonId: string
) {
  const lessonUrl = `${baseUrl}/app/courses/${courseId}/lessons/${lessonId}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: recipientEmail,
    subject: `${replierName} je odgovorio/la na vaš komentar - Gurmania`,
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
            .comment-box {
              background-color: #fff;
              border: 1px solid #ddd;
              padding: 15px;
              margin: 10px 0;
              border-radius: 4px;
            }
            .reply-box {
              background-color: #fff;
              border-left: 4px solid #10b981;
              padding: 15px;
              margin: 10px 0;
              border-radius: 4px;
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
            <h2>Novi odgovor na vaš komentar</h2>
            <p>Poštovani/a ${recipientName},</p>
            <p><strong>${replierName}</strong> je odgovorio/la na vaš komentar u lekciji <strong>${lessonTitle}</strong> (${courseTitle}).</p>
            
            <div class="comment-box">
              <p style="font-size: 12px; color: #666; margin-top: 0;">Vaš komentar:</p>
              <p style="margin: 0;">${originalComment.length > 200 ? originalComment.substring(0, 200) + '...' : originalComment}</p>
            </div>

            <div class="reply-box">
              <p style="font-size: 12px; color: #666; margin-top: 0;">Odgovor:</p>
              <p style="margin: 0;">${replyContent.length > 300 ? replyContent.substring(0, 300) + '...' : replyContent}</p>
            </div>

            <div style="text-align: center;">
              <a href="${lessonUrl}" class="button">Pogledaj odgovor</a>
            </div>

            <div class="footer">
              <p>Možete se odjaviti od obavijesti u postavkama svog računa.</p>
              <p>Tim Gurmania</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendWorkshopReminderEmail({
  recipientEmail,
  recipientName,
  role,
  workshop,
  reminderLabel,
}: {
  recipientEmail: string;
  recipientName: string;
  role: "INSTRUCTOR" | "ATTENDEE";
  workshop: {
    id: string;
    title: string;
    startTime: Date;
    durationMin: number;
    instructorName: string;
  };
  reminderLabel: "24H" | "1H" | "10M";
}) {
  const workshopUrl = `${baseUrl}/app/workshops/${workshop.id}`;
  const calendarUrl = `${baseUrl}/api/workshops/${workshop.id}/calendar`;
  const formattedDate = workshop.startTime.toLocaleString("hr-HR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const reminderText =
    reminderLabel === "24H"
      ? "za 24 sata"
      : reminderLabel === "1H"
      ? "za 1 sat"
      : "za 10 minuta";

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: recipientEmail,
    subject: `Podsjetnik: ${workshop.title} počinje ${reminderText} - Gurmania`,
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
            .details {
              background-color: #fff;
              border-left: 4px solid #f97316;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
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
            <h2>Podsjetnik za radionicu</h2>
            <p>Poštovani/a ${recipientName},</p>
            <p>Radionica <strong>${workshop.title}</strong> počinje ${reminderText}.</p>

            <div class="details">
              <p><strong>Termin:</strong> ${formattedDate}</p>
              <p><strong>Trajanje:</strong> ${workshop.durationMin} min</p>
              <p><strong>Instruktor:</strong> ${workshop.instructorName}</p>
              <p><strong>Vaša uloga:</strong> ${role === "INSTRUCTOR" ? "Instruktor" : "Polaznik"}</p>
            </div>

            <div style="text-align: center;">
              <a href="${workshopUrl}" class="button">Otvori radionicu</a>
            </div>

            <p>Dodajte termin u svoj kalendar:</p>
            <div style="text-align: center;">
              <a href="${calendarUrl}" class="button" style="background-color: #f97316;">Dodaj u kalendar</a>
            </div>

            <div class="footer">
              <p>Vidimo se uskoro!</p>
              <p>Tim Gurmania</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendCertificateEmail(
  email: string,
  userName: string,
  courseTitle: string,
  certificateUrl: string
) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Čestitamo! Vaš certifikat za tečaj "${courseTitle}" - Gurmania`,
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
            .celebration {
              text-align: center;
              font-size: 48px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #FF6B35;
              color: #fff !important;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
            }
            .certificate-box {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
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
            <div class="celebration">🎉 🏆 🎉</div>
            <h2 style="text-align: center; color: #FF6B35;">Čestitamo, ${userName}!</h2>
            <p style="text-align: center; font-size: 18px;">
              Uspješno ste završili tečaj
            </p>
            
            <div class="certificate-box">
              <h3 style="margin: 0; font-size: 24px;">${courseTitle}</h3>
            </div>

            <p>
              Jako smo ponosni na vaš trud i predanost! Vaš certifikat je spreman za preuzimanje.
            </p>

            <div style="text-align: center;">
              <a href="${certificateUrl}" class="button">📥 Preuzmi certifikat (PDF)</a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              💡 <strong>Savjet:</strong> Spremite certifikat na sigurno mjesto ili ga podijeli na društvenim mrežama!
            </p>

            <div style="background-color: #fff; border-left: 4px solid #FF6B35; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;">
                <strong>Što dalje?</strong><br>
                Istražite naše druge tečajeve i nastavite širiti svoje kulinarske vještine!
              </p>
            </div>

            <div class="footer">
              <p>Hvala što ste dio Gurmania zajednice!</p>
              <p>Tim Gurmania</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}
