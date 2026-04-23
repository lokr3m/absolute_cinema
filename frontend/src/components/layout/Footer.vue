<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <section class="footer-block footer-app">
          <h3>Mobilirakendus</h3>
          <p>
            Apollo mobilirakendused muudavad kinokogemuse
            veelgi mugavamaks.
          </p>
          <div class="store-buttons">
            <a href="#" class="store-button app-store" aria-label="Download on the App Store">
              <span>Download on the</span>
              <strong>App Store</strong>
            </a>
            <a href="#" class="store-button google-play" aria-label="Get it on Google Play">
              <span>Get it on</span>
              <strong>Google Play</strong>
            </a>
          </div>
          <p class="copyright">© 2024 Absolute Cinema OÜ</p>
        </section>

        <section class="footer-block">
          <h3>Info</h3>
          <ul class="footer-list">
            <li><a href="#">Apollo Klubi</a></li>
            <li><a href="#">KKK</a></li>
            <li><a href="#">Kinode turvalisus</a></li>
            <li><a href="#">Vanusepiirangud</a></li>
            <li><a href="#">Kodukord</a></li>
            <li><a href="#">Privaatsus</a></li>
            <li><a href="#">Müügi- ja kasutustingimused</a></li>
            <li><a href="#">Pay app</a></li>
            <li><a href="#">Ettevõttest</a></li>
            <li><a href="#">Jätkusuutlik ettevõtlus</a></li>
            <li><a href="#">Tule tööle</a></li>
            <li><a href="#">Pühade lahtiolekuajad</a></li>
            <li><a href="#">Anna meile tagasisidet!</a></li>
          </ul>

          <h3 class="social-title">Sotsiaalmeedia</h3>
          <ul class="footer-list">
            <li><a href="#">Instagram</a></li>
            <li><a href="#">Facebook</a></li>
            <li><a href="#">TikTok</a></li>
            <li><a href="#">LinkedIn</a></li>
          </ul>
        </section>

        <section class="footer-block">
          <h3>Klienditugi</h3>
          <p class="support-hours">E–R 10:00 – 16:00<br />L, P ja riigipühadel suletud</p>
          <p class="support-text">
            Kinod avatakse enne esimese seansi algust, kuid mitte
            enne kella 10:00 ja suletakse 15 minutit pärast viimase
            seansi algust. Täpsem info iga kino kodukorras.
          </p>
          <p class="support-contact">
            Infotelefon:
            <a class="accent" href="tel:+3726800700">+372 6 800 700</a>
          </p>
          <p class="support-contact">
            <a class="accent" href="mailto:info@absolute-cinema.ee">info@absolute-cinema.ee</a>
          </p>

          <p class="support-text">
            Kinokava koostatakse ette üheks kinonädalaks, sama nädala
            reedest järgmise nädala neljapäevani. Uue nädala kava
            avaldatakse hiljemalt teisipäeva õhtuks. Kino jätab endale
            õiguse teha kinokavas jooksvalt muudatusi.
          </p>

          <p class="support-contact">
            Absoluutne turundus:
            <a class="accent" href="mailto:turundus@absolute-cinema.ee">turundus@absolute-cinema.ee</a>
          </p>
          <a class="preferences accent" href="#">Küpsiste eelistused</a>
        </section>

        <section class="footer-block">
          <h3>Apollo kinod</h3>
          <ul class="footer-list">
            <li><a href="#">Apollo Kino Solaris</a></li>
            <li><a href="#">Apollo Kino Ülemiste</a></li>
            <li><a href="#">Apollo Kino Mustamäe</a></li>
            <li><a href="#">Apollo Kino Plaza</a></li>
            <li><a href="#">Apollo Kino Saaremaa</a></li>
            <li><a href="#">Apollo Kino Pärnu</a></li>
            <li><a href="#">Apollo Kino Lõunakeskus</a></li>
            <li><a href="#">Apollo Kino Tasku</a></li>
            <li><a href="#">Apollo Kino Astri</a></li>
            <li><a href="#">Apollo Kino Jõhvi</a></li>
            <li><a href="#">Apollo Kino Viljandi</a></li>
            <li><a href="#">Apollo Kino Rakvere</a></li>
          </ul>
        </section>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'Footer'
}
</script>

<style scoped>
.footer {
  background: #0b0b0b;
  color: #b8b8b8;
  padding: 48px 0 40px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 32px;
}

.footer-block h3 {
  color: #b8b8b8;
  font-size: 18px;
  margin-bottom: 16px;
  font-weight: 400;
}

.footer-block p,
.footer-block li {
  font-size: 14px;
  line-height: 1.6;
  color: #b8b8b8;
  font-weight: 400;
}

.footer-list {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
}

.footer-list li {
  margin-bottom: 8px;
}

.footer-list a,
.support-contact a,
.preferences {
  color: #b8b8b8;
  text-decoration: none;
  transition: color 0.2s ease;
  font-weight: 400;
}

.footer-list a:hover,
.support-contact a:hover,
.preferences:hover {
  color: #d0d0d0;
}

.footer-app p {
  margin-bottom: 18px;
}

.store-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.store-button {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 10px 14px;
  background: #111111;
  color: #b8b8b8;
  text-decoration: none;
  font-size: 12px;
  max-width: 180px;
  font-weight: 400;
}

.store-button strong {
  font-size: 16px;
  margin-top: 2px;
  font-weight: 400;
}

.support-hours {
  margin-bottom: 12px;
}

.support-text {
  margin: 12px 0;
}

.support-contact {
  margin: 6px 0;
}

.preferences {
  display: inline-block;
  margin-top: 12px;
  font-weight: 400;
}

.social-title {
  margin-top: 8px;
}

.copyright {
  margin-top: 12px;
  color: #7a7a7a;
  font-size: 13px;
  font-weight: 400;
}

.accent {
  color: #ff9b2f;
}

.accent:hover {
  color: #ffc27a;
}

@media (max-width: 1024px) {
  .footer-grid {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
}

@media (max-width: 640px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
}
</style>