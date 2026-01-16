import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Uvjeti korištenja | Gurmania",
  description: "Uvjeti korištenja za Gurmania platformu za tečajeve kuhanja",
}

export default function TermsOfServicePage() {
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
            <h1 className="text-4xl font-bold tracking-tight">Uvjeti korištenja</h1>
            <p className="text-muted-foreground">
              Posljednje ažurirano: {new Date().toLocaleDateString("hr-HR", { 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Prihvaćanje uvjeta</h2>
              <p>
                Dobrodošli na Gurmania platformu za online tečajeve kuhanja (&quot;Platforma&quot;, &quot;mi&quot;, &quot;nas&quot;, &quot;naš&quot;). 
                Korištenjem naše Platforme pristajete biti vezani ovim Uvjetima korištenja (&quot;Uvjeti&quot;). 
                Molimo vas da pažljivo pročitate ove Uvjete prije korištenja Platforme.
              </p>
              <p className="mt-3">
                Ako se ne slažete s bilo kojim dijelom ovih Uvjeta, nemate dopuštenje za pristup ili 
                korištenje Platforme. Registracijom računa ili korištenjem Platforme potvrđujete da ste 
                pročitali, razumjeli i pristali biti vezani ovim Uvjetima.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Opis usluge</h2>
              <p>
                Gurmania je online platforma koja pruža pristup kuharskim tečajevima, lekcijama, receptima, 
                radionicama i povezanim edukativnim sadržajima. Platforma omogućava:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pristup kuharskim tečajevima i lekcijama</li>
                <li>Interakciju s instruktorima i drugim korisnicima</li>
                <li>Praćenje napretka i postignuća</li>
                <li>Stvaranje i dijeljenje kuharskog sadržaja (za instruktore)</li>
                <li>Sudjelovanje u live radionicama i događajima</li>
                <li>Pristup receptima i kupovnim listama</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Registracija računa</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-4">3.1 Uvjeti za registraciju</h3>
              <p>
                Za korištenje određenih funkcija Platforme morate kreirati račun. Registracijom se slažete da:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Imate najmanje 16 godina</li>
                <li>Pružite točne, potpune i ažurirane informacije</li>
                <li>Održavate sigurnost svojeg računa i lozinke</li>
                <li>Prihvatite odgovornost za sve aktivnosti na vašem računu</li>
                <li>Obavijestite nas odmah o bilo kakvoj neovlaštenoj upotrebi vašeg računa</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">3.2 Sigurnost računa</h3>
              <p>
                Vi ste odgovorni za očuvanje povjerljivosti podataka za prijavu u svoj račun. Gurmania 
                neće biti odgovorna za gubitke ili štete nastale zbog vašeg neuspjeha u zaštiti 
                pristupnih podataka.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Korisničko ponašanje</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-4">4.1 Dopušteno korištenje</h3>
              <p>
                Slažete se koristiti Platformu samo u zakonite svrhe i na način koji ne krši prava drugih 
                ili ograničava njihovo korištenje Platforme.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">4.2 Zabranjeno ponašanje</h3>
              <p>
                Prilikom korištenja Platforme, NE smijete:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Kršiti bilo koje lokalne, državne, nacionalne ili međunarodne zakone</li>
                <li>Prenositi bilo kakav nezakonit, prijeteći, uvredljiv, klevetničkim ili neprikladan sadržaj</li>
                <li>Uznemiravanje, zlostavljanje ili nanošenje štete drugim korisnicima</li>
                <li>Izdavati se za drugu osobu ili organizaciju</li>
                <li>Koristiti automatizirane skripte za prikupljanje informacija s Platforme</li>
                <li>Prenositi viruse, malware ili bilo kakav štetan kod</li>
                <li>Pokušavati neovlaštenog pristupa sustavima ili mrežama</li>
                <li>Reproducirati, kopirati ili prenositi sadržaj s Platforme bez dozvole</li>
                <li>Koristiti Platformu u komercijalne svrhe bez našeg pisanog dopuštenja</li>
                <li>Uklanjati ili mijenjati obavijesti o autorskim pravima ili vlasništvu</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Sadržaj korisnika</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-4">5.1 Vaš sadržaj</h3>
              <p>
                &quot;Korisnički sadržaj&quot; označava sve informacije, materijale ili sadržaj koje prenesete, 
                objavite ili podijelite na Platformi, uključujući komentare, fotografije, recenzije i 
                odgovore na kvizove.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">5.2 Licenca za sadržaj</h3>
              <p>
                Zadržavate sva vlasnička prava na svoj Korisnički sadržaj. Međutim, objavljivanjem 
                sadržaja na Platformi, dajete Gurmania neisključivo, besplatno, svjetsko pravo na korištenje, 
                reproduciranje, mijenjanje, prilagođavanje i prikazivanje tog sadržaja u svrhu pružanja i 
                promocije naših usluga.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">5.3 Odgovornost za sadržaj</h3>
              <p>
                Vi ste isključivo odgovorni za svoj Korisnički sadržaj. Jamčite da:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Posjedujete ili imate pravo koristiti sadržaj koji prenosite</li>
                <li>Vaš sadržaj ne krši prava intelektualnog vlasništva ili druga prava trećih strana</li>
                <li>Vaš sadržaj ne sadrži nezakonit ili neprikladan materijal</li>
                <li>Vaš sadržaj je točan i nije obmanjujući</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Intelektualno vlasništvo</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-4">6.1 Vlasništvo nad Platformom</h3>
              <p>
                Platforma i sav njezin izvorni sadržaj (osim Korisničkog sadržaja), značajke i 
                funkcionalnost su i ostat će isključivo vlasništvo Gurmania. Platforma je zaštićena 
                autorskim pravima, žigovima i drugim zakonima.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">6.2 Ograničena licenca</h3>
              <p>
                Gurmania vam dodjeljuje ograničenu, neisključivu, neprenosivu licencu za pristup i 
                korištenje Platforme u osobne, nekomercijalne svrhe. Ova licenca ne uključuje pravo na:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Prodaju ili preprodaju Platforme ili njenog sadržaja</li>
                <li>Javno prikazivanje ili izvođenje sadržaja</li>
                <li>Modificiranje ili prilagođavanje Platforme</li>
                <li>Dekompiliranje ili pokušaj izvlačenja izvornog koda</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Instruktori</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-4">7.1 Postanak instruktorom</h3>
              <p>
                Korisnici mogu aplicirati za status instruktora. Svi instruktorski zahtjevi podliježu 
                pregledu i odobrenju od strane Gurmania. Zadržavamo pravo odbiti ili povući instruktorski 
                status prema vlastitoj prosudbi.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">7.2 Obveze instruktora</h3>
              <p>
                Instruktori se slažu da će:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pružiti točne podatke o svojim kvalifikacijama i iskustvu</li>
                <li>Kreirati originalni, kvalitetan edukativni sadržaj</li>
                <li>Održavati profesionalne standarde u komunikaciji sa studentima</li>
                <li>Poštivati autorska prava i prava intelektualnog vlasništva</li>
                <li>Ne dijeliti povjerljive informacije o studentima</li>
                <li>Pridržavati se svih primjenjivih zakona i propisa</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">7.3 Sadržaj tečajeva</h3>
              <p>
                Instruktori zadržavaju autorska prava na svoje tečajeve i lekcije, ali daju Gurmania 
                licencu za hostanje, distribuciju i promociju njihovog sadržaja na Platformi.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Plaćanja i povrati (rezervirano za buduću upotrebu)</h2>
              <p>
                Trenutno su svi tečajevi na Platformi besplatni. U budućnosti možemo uvesti plaćene 
                tečajeve. Ako uvedemo plaćene usluge, ažurirat ćemo ove Uvjete s relevantnim informacijama 
                o cijenama, načinima plaćanja i politikama povrata.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Prekid i suspenzija</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-4">9.1 Prekid od strane korisnika</h3>
              <p>
                Možete prekinuti svoj račun u bilo kojem trenutku putem postavki profila. Nakon brisanja 
                računa, sav vaš Korisnički sadržaj i osobni podaci bit će trajno izbrisani (osim ako 
                postoje zakonske obveze čuvanja).
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">9.2 Prekid od strane Gurmania</h3>
              <p>
                Možemo suspendirati ili prekinuti vaš pristup Platformi odmah, bez prethodne obavijesti 
                ili odgovornosti, iz bilo kojeg razloga, uključujući ali ne ograničavajući se na kršenje 
                ovih Uvjeta. Razlozi za prekid mogu uključivati:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Kršenje ovih Uvjeta korištenja</li>
                <li>Nezakonito ili neprikladno ponašanje</li>
                <li>Zahtjev pravnih ili regulatornih tijela</li>
                <li>Produžena neaktivnost</li>
                <li>Tehničke ili sigurnosne probleme</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Odricanje jamstva</h2>
              <p>
                Platforma se pruža &quot;kako jest&quot; i &quot;kako je dostupna&quot; bez jamstava bilo koje vrste, bilo 
                izričitih ili implicitnih. Gurmania ne jamči da će:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Platforma biti neprekinuto dostupna ili bez grešaka</li>
                <li>Pogreške biti ispravljene</li>
                <li>Platforma ili serveri biti bez virusa ili drugih štetnih komponenti</li>
                <li>Rezultati korištenja Platforme biti točni ili pouzdani</li>
              </ul>
              <p className="mt-3">
                <strong>VAŽNO:</strong> Sadržaj na Platformi služi isključivo u edukativne svrhe. 
                Gurmania ne preuzima odgovornost za bilo kakve ozljede, alergijske reakcije ili probleme 
                koji mogu nastati prilikom pripreme jela prema uputama s Platforme. Korisnici su sami 
                odgovorni za provjeru alergena i sigurnost u kuhinji.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Ograničenje odgovornosti</h2>
              <p>
                U najvećoj mjeri dopuštenoj zakonom, Gurmania i njegove podružnice, direktori, zaposlenici 
                ili agenti neće biti odgovorni za:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Bilo kakvu neizravnu, slučajnu, posebnu, posljedičnu ili kaznenu štetu</li>
                <li>Gubitak profita, prihoda, podataka ili druge nematerijalne imovine</li>
                <li>Štetu nastalu korištenjem ili nemogućnosti korištenja Platforme</li>
                <li>Neovlašteni pristup ili promjenu vaših prijenosa ili podataka</li>
                <li>Izjave ili ponašanje trećih strana na Platformi</li>
                <li>Bilo kakve druge stvari povezane s Platformom</li>
              </ul>
              <p className="mt-3">
                Ova ograničenja će se primjenjivati čak i ako je Gurmania bio obaviješten o mogućnosti 
                takve štete.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Naknada štete</h2>
              <p>
                Slažete se braniti, nadoknaditi štetu i ne smatrati odgovornim Gurmania i njegove 
                podružnice, direktore, zaposlenike i agente od bilo kakvih zahtjeva, odgovornosti, 
                šteta, gubitaka i troškova, uključujući razumne odvjetničke troškove, koji proizlaze iz:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Vašeg kršenja ovih Uvjeta</li>
                <li>Vašeg Korisničkog sadržaja</li>
                <li>Vašeg korištenja Platforme</li>
                <li>Vašeg kršenja prava trećih strana, uključujući autorska prava</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Izmjene uvjeta</h2>
              <p>
                Gurmania zadržava pravo, prema vlastitoj prosudbi, modificirati ili zamijeniti ove 
                Uvjete u bilo kojem trenutku. Ako je izmjena značajna, pružit ćemo obavijest od najmanje 
                30 dana prije stupanja na snagu novih uvjeta.
              </p>
              <p className="mt-3">
                Nastavak korištenja Platforme nakon stupanja na snagu izmjena znači prihvaćanje izmijenjenih 
                Uvjeta. Ako se ne slažete s novim Uvjetima, molimo vas da prestanete koristiti Platformu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Mjerodavno pravo</h2>
              <p>
                Ovi Uvjeti će se tumačiti i provesti u skladu sa zakonima Republike Hrvatske, bez obzira 
                na odredbe o sukobu zakona. Svi sporovi koji proizlaze iz ili u vezi s ovim Uvjetima ili 
                Platformom bit će predani nadležnosti sudova u Hrvatskoj.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">15. Razdvojivost odredbi</h2>
              <p>
                Ako bilo koja odredba ovih Uvjeta bude smatrana nevažećom ili neizvršivom, ta odredba će 
                biti uklonjena ili ograničena u minimalnoj potrebnoj mjeri, a preostale odredbe ovih 
                Uvjeta ostat će na snazi.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">16. Cjelokupni sporazum</h2>
              <p>
                Ovi Uvjeti, zajedno s našom Politikom privatnosti, čine cjelokupni sporazum između vas i 
                Gurmania u vezi s Platformom i zamjenjuju sve prethodne sporazume između vas i Gurmania.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">17. Odricanje</h2>
              <p>
                Neuspjeh Gurmania da ostvari ili provede bilo koje pravo ili odredbu ovih Uvjeta neće 
                predstavljati odricanje od tog prava ili odredbe.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">18. Kontakt</h2>
              <p>
                Za pitanja o ovim Uvjetima korištenja, molimo kontaktirajte nas na:
              </p>
              <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="font-semibold mb-2">Gurmania - Platforma za tečajeve kuhanja</p>
                <p>Email: <a href="mailto:privacy@gurmania.gorstaci.org" className="text-orange-600 hover:text-orange-700 underline">privacy@gurmania.gorstaci.org</a></p>
              </div>
            </section>

            <section className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="font-semibold mb-2">Prihvaćanje uvjeta</p>
              <p className="text-sm">
                Korištenjem Gurmania platforme potvrdujete da ste pročitali, razumjeli i pristali biti 
                vezani ovim Uvjetima korištenja. Ako se ne slažete s ovim Uvjetima, molimo vas da ne 
                koristite našu Platformu.
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
