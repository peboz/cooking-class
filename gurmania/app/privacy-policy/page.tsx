import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Politika privatnosti | Gurmania",
  description: "Politika privatnosti za Gurmania platformu za tečajeve kuhanja",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6 gap-2">
            <ChevronLeft className="w-4 h-4" />
            Natrag na početnu
          </Button>
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 md:p-12 space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Politika privatnosti</h1>
            <p className="text-muted-foreground">
              Posljednje ažurirano: 20. 1. 2026.
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Uvod</h2>
              <p>
                Dobro došli na Gurmaniju. Ova Politika privatnosti objašnjava kako prikupljamo, 
                koristimo, čuvamo i štitimo vaše osobne podatke kada koristite našu platformu za online 
                tečajeve kuhanja. Pridajemo veliku važnost zaštiti vaše privatnosti i posvećeni smo 
                transparentnosti u vezi s vašim osobnim podacima.
              </p>
              <p>
                Korištenjem naše platforme pristajete na prikupljanje i korištenje informacija u skladu 
                s ovom politikom. Ako se ne slažete s bilo kojim dijelom ove politike, molimo vas da ne 
                koristite našu platformu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Podaci koje prikupljamo</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-4">2.1 Podaci koje nam direktno pružate</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Podaci o računu:</strong> Ime, email adresa, lozinka (šifrirana), profilna fotografija</li>
                <li><strong>Profilni podaci:</strong> Razina vještine u kuhanju, prehrambene preferencije, alergije, omiljene kuhinje</li>
                <li><strong>Instruktorski podaci:</strong> Biografija, specijalizacije, verifikacijska dokumentacija (za instruktore)</li>
                <li><strong>Sadržaj:</strong> Komentari, pitanja, recenzije, odgovori na kvizove, učitane fotografije</li>
                <li><strong>Komunikacija:</strong> Poruke koje nam šaljete putem emaila ili kontakt obrazaca</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Podaci koje automatski prikupljamo</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Podaci o korištenju:</strong> Napredak u tečajevima, lekcije koje ste pogledali, rezultati kvizova, vrijeme provedeno na platformi</li>
                <li><strong>Tehnički podaci:</strong> IP adresa, tip preglednika, operativni sustav, identifikatori uređaja</li>
                <li><strong>Kolačići i slične tehnologije:</strong> Koristimo kolačiće za autentifikaciju sesije i poboljšanje vašeg iskustva</li>
                <li><strong>Audit logovi:</strong> Zapisi akcija za sigurnosne i administrativne svrhe (prijave, promjene postavki)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">2.3 Podaci od trećih strana</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>OAuth autentifikacija:</strong> Ako se prijavite putem Google računa, primamo vaše ime, email adresu i profilnu fotografiju</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Kako koristimo vaše podatke</h2>
              <p>Vaše osobne podatke koristimo u sljedeće svrhe:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Pružanje usluge:</strong> Omogućavanje pristupa tečajevima, praćenje napretka, izdavanje certifikata</li>
                <li><strong>Personalizacija:</strong> Prilagodba sadržaja prema vašim preferencijama, alergenima i razini vještine</li>
                <li><strong>Komunikacija:</strong> Slanje email notifikacija o novim lekcijama, radionicama, podsjetnike, potvrde</li>
                <li><strong>Sigurnost računa:</strong> Zaštita vašeg računa, sprječavanje zlouporabe, verifikacija identiteta</li>
                <li><strong>Poboljšanje platforme:</strong> Analiza korištenja kako bi poboljšali funkcionalnost i korisničko iskustvo</li>
                <li><strong>Podrška korisnicima:</strong> Odgovaranje na vaše upite i rješavanje problema</li>
                <li><strong>Pravne obveze:</strong> Poštivanje zakona, rješavanje sporova, izvršavanje naših uvjeta korištenja</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Dijeljenje podataka s trećim stranama</h2>
              <p>
                Vaše osobne podatke ne prodajemo trećim stranama. Dijelimo ih samo u sljedećim slučajevima:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Pružatelji usluga:</strong> Koristimo pouzdane pružatelje usluga koji nam pomažu u poslovanju:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Amazon Web Services (AWS S3) - za pohranu medija (slike, videa, dokumenti)</li>
                    <li>Email pružatelji - za slanje transakcijskih emailova</li>
                    <li>PostgreSQL hosting - za bazu podataka</li>
                  </ul>
                </li>
                <li><strong>Pravne obveze:</strong> Ako to zahtijevaju zakoni ili sudski nalozi</li>
                <li><strong>Zaštita prava:</strong> Za zaštitu naših prava, imovine ili sigurnosti korisnika</li>
                <li><strong>S vašom privolomom:</strong> U bilo kojim drugim slučajevima uz vašu izričitu suglasnost</li>
              </ul>
              <p className="mt-3">
                Svi pružatelji usluga moraju poštivati standarde zaštite podataka i ne smiju koristiti 
                vaše podatke u vlastite svrhe.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Čuvanje podataka</h2>
              <p>
                Vaše osobne podatke čuvamo samo dok je to potrebno za svrhe navedene u ovoj politici:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Aktivni računi:</strong> Dok vaš račun ostaje aktivan</li>
                <li><strong>Izbrisani računi:</strong> Podaci se trajno brišu nakon potvrde brisanja računa (osim ako postoje pravne obveze čuvanja)</li>
                <li><strong>Audit logovi:</strong> Čuvaju se do 12 mjeseci za sigurnosne svrhe</li>
                <li><strong>Zakonske obveze:</strong> Neki podaci mogu biti zadržani duže ako to zahtijevaju zakoni</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Sigurnost podataka</h2>
              <p>
                Koristimo industrijsko standardne mjere zaštite za osiguranje sigurnosti vaših podataka:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Šifriranje:</strong> Sve lozinke se pohranjuju koristeći bcrypt hash algoritam</li>
                <li><strong>HTTPS:</strong> Sva komunikacija između vašeg preglednika i naših servera je šifrirana</li>
                <li><strong>Kontrola pristupa:</strong> Stroga kontrola pristupa podacima unutar naše organizacije</li>
                <li><strong>Redovite sigurnosne provjere:</strong> Pratimo i ažuriramo sigurnosne protokole</li>
                <li><strong>Backup sustav:</strong> Redovite sigurnosne kopije baze podataka</li>
              </ul>
              <p className="mt-3">
                Međutim, nijedna metoda prijenosa preko interneta ili elektroničke pohrane nije 100% sigurna. 
                Iako nastojimo koristiti komercijalno prihvatljiva sredstva za zaštitu vaših osobnih podataka, 
                ne možemo garantirati apsolutnu sigurnost.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Vaša prava (GDPR)</h2>
              <p>
                U skladu s Općom uredbom o zaštiti podataka (GDPR) i hrvatskim zakonima, imate sljedeća prava:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Pravo pristupa:</strong> Možete zatražiti kopiju svih osobnih podataka koje čuvamo o vama</li>
                <li><strong>Pravo na ispravak:</strong> Možete ažurirati ili ispraviti netočne podatke</li>
                <li><strong>Pravo na brisanje:</strong> Možete zatražiti brisanje svojih osobnih podataka (&quot;pravo na zaborav&quot;)</li>
                <li><strong>Pravo na ograničenje obrade:</strong> Možete zatražiti ograničenje načina na koji koristimo vaše podatke</li>
                <li><strong>Pravo na prenosivost podataka:</strong> Možete zatražiti izvoz vaših podataka u strojno čitljivom formatu</li>
                <li><strong>Pravo na prigovor:</strong> Možete se usprotiviti obradi vaših podataka u određenim situacijama</li>
                <li><strong>Pravo na povlačenje pristanka:</strong> Možete povući pristanak u bilo kojem trenutku</li>
              </ul>
              <p className="mt-3">
                Za ostvarivanje bilo kojeg od ovih prava, možete koristiti opcije u postavkama profila 
                (izvoz podataka, brisanje računa) ili nas kontaktirati na{" "}
                <a href="mailto:privacy@gurmania.gorstaci.org" className="text-orange-600 hover:text-orange-700 underline">
                  privacy@gurmania.gorstaci.org
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Kolačići (Cookies)</h2>
              <p>
                Naša platforma koristi kolačiće i slične tehnologije za praćenje aktivnosti i čuvanje 
                određenih informacija:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Nužni kolačići:</strong> Potrebni za autentifikaciju i osnovnu funkcionalnost platforme</li>
                <li><strong>Funkcionalni kolačići:</strong> Pamte vaše preferencije (npr. tema, jezik)</li>
                <li><strong>Analitički kolačići:</strong> Pomažu nam razumjeti kako korisnici koriste platformu</li>
              </ul>
              <p className="mt-3">
                Možete kontrolirati i/ili izbrisati kolačiće po želji. Međutim, to može utjecati na 
                funkcionalnost platforme. Detalje o upravljanju kolačićima možete pronaći u postavkama 
                vašeg preglednika.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Maloljetnici</h2>
              <p>
                Naša platforma nije namijenjena djeci mlađoj od 18 godina. Ne prikupljamo svjesno osobne 
                podatke od djece mlađe od 18 godina. Ako ste roditelj ili skrbnik i znate da je vaše dijete 
                pružilo osobne podatke, molimo vas kontaktirajte nas kako bismo mogli poduzeti potrebne radnje.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Međunarodni prijenosi podataka</h2>
              <p>
                Vaši podaci mogu biti pohranjeni i obrađivani u Europskoj uniji i drugim zemljama gdje se 
                nalaze naši serveri i pružatelji usluga. Osiguravamo da svi prijenosi podataka izvan EU-a 
                budu u skladu s GDPR-om i ostalim primjenjivim zakonima o zaštiti podataka.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Promjene politike privatnosti</h2>
              <p>
                Možemo povremeno ažurirati ovu Politiku privatnosti. O svim promjenama ćemo vas obavijestiti 
                objavljivanjem nove verzije na ovoj stranici i, ako su promjene značajne, poslat ćemo vam 
                obavijest putem emaila.
              </p>
              <p className="mt-3">
                Savjetujemo vam da povremeno pregledate ovu stranicu kako biste bili informirani o tome kako 
                štitimo vaše podatke. Datum posljednjeg ažuriranja nalazi se na vrhu ove stranice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Kontakt</h2>
              <p>
                Ako imate pitanja ili primjedbe u vezi s ovom Politikom privatnosti ili našim postupanjem 
                s vašim osobnim podacima, možete nas kontaktirati na:
              </p>
              <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="font-semibold mb-2">Gurmania - Platforma za tečajeve kuhanja</p>
                <p>Email za pitanja o privatnosti: <a href="mailto:privacy@gurmania.gorstaci.org" className="text-orange-600 hover:text-orange-700 underline">privacy@gurmania.gorstaci.org</a></p>
              </div>
              <p className="mt-4">
                Također imate pravo podnijeti pritužbu nadležnom nadzornom tijelu za zaštitu podataka u 
                vašoj zemlji ako smatrate da vaši podaci nisu obrađivani u skladu sa zakonom.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Pristanak</h2>
              <p>
                Korištenjem naše platforme pristajete na ovu Politiku privatnosti i pristajete na prikupljanje 
                i korištenje informacija u skladu s ovim dokumentom.
              </p>
            </section>
          </div>

          <div className="pt-8 border-t">
            <Link href="/">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Natrag na početnu stranicu
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
