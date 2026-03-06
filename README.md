# Barber Appointment Backend

Bu repo, berber randevu uygulamasinin backend tarafini icerir. Servis `NestJS` ile yazilmistir, veritabani erisimi `Prisma` uzerinden yapilir ve ana veri kaynagi `PostgreSQL`'dir.

## Genel Bakis

Sistem 4 rol etrafinda sekillenir:

- `customer`: randevu alma, guncelleme, iptal, odul kullanimi
- `barber`: mesai/mola yonetimi, randevu durum islemleri
- `admin`: shop, barber, service, campaign, holiday yonetimi
- `platform`: sistem seviyesinde shop olusturma/aktivasyon

API global prefix'i: `/api`

## Teknoloji Yigini

- Node.js 20
- NestJS 10
- Prisma 5
- PostgreSQL
- Redis
- JWT
- Dayjs
- Cloudinary
- Expo Push
- Brevo

## Proje Yapisi

`backend/src` altinda one cikan moduller:

- `auth`, `admin-auth`, `barber-auth`, `unified-auth`
- `appointment`
- `working-hour`
- `holiday`
- `shop`
- `barber`
- `service`
- `campaign`
- `reward`
- `game`
- `upload`

Yardimci katmanlar:

- `prisma`: DB baglantisi
- `validators`: randevu dogrulama kurallari
- `cron`: zamanlanmis gorevler

## Kimlik Dogrulama

Kullanilan guard'lar:

- `JwtAuthGuard` (customer)
- `JwtBarberGuard` (barber)
- `JwtAdminGuard` (admin)
- `JwtUnifiedGuard` (role aware)
- `PlatformGuard` (platform istekleri)

Tipik header:

```http
Authorization: Bearer <access_token>
```

## API Ozet Rehberi

### Auth Endpointleri

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Unified Auth Endpointleri

- `POST /api/unified-auth/login`
- `POST /api/unified-auth/platform/login`
- `GET /api/unified-auth/me`
- `POST /api/unified-auth/refresh`
- `POST /api/unified-auth/logout`
- `POST /api/unified-auth/forgot`
- `POST /api/unified-auth/verify-reset`
- `POST /api/unified-auth/reset-password`
- `POST /api/unified-auth/change-password`
- `POST /api/unified-auth/push/register`

### Appointment Endpointleri

Customer:

- `GET /api/appointment`
- `GET /api/appointment/:id`
- `GET /api/appointment/last`
- `GET /api/appointment/last-scheduled`
- `POST /api/appointment/preview`
- `POST /api/appointment`
- `PUT /api/appointment/:id`
- `PUT /api/appointment/cancel/:id`

Ortak:

- `GET /api/appointment/available-dates`
- `GET /api/appointment/available-hours/:barberId?date=YYYY-MM-DD`

Barber:

- `GET /api/appointment/barber`
- `GET /api/appointment/barber/today`
- `GET /api/appointment/barber/:id`
- `POST /api/appointment/barber-cancel/:id`
- `POST /api/appointment/barber-mark-completed/:id`
- `POST /api/appointment/barber-mark-no-show/:id`
- `GET /api/appointment/barber-break`
- `POST /api/appointment/barber-break`
- `DELETE /api/appointment/barber-break/:id`

Admin:

- `GET /api/appointment/admin`
- `GET /api/appointment/admin/:id`
- `POST /api/appointment/mark-cancel/:id`
- `POST /api/appointment/mark-completed/:id`
- `POST /api/appointment/mark-no-show/:id`

### Diger Moduller

- `shop`: shop CRUD, image, activity
- `barber`: barber CRUD, image, profile
- `service`: service CRUD, image
- `campaign`: campaign CRUD ve shop bazli listeleme
- `reward`: odul listeleme ve detay
- `game`: cark cevirme ve son oyun kaydi
- `holiday`: tatil gunu CRUD
- `working-hours`: barber mesai saatleri CRUD

## Randevu Is Kurallari

`appointment` servisinde uygulanan temel kurallar:

- Gecmise randevu olusturulamaz.
- Baslangic saati 15 dakikalik slot duzenine uymak zorundadir.
- Musterinin aktif (`SCHEDULED`) bir randevusu varsa yeni randevu acilmaz.
- Berber aktif degilse veya shop pasifse randevu acilmaz.
- Tatil/kapali gunlerde randevu alinmaz.
- Berberin mesai araligi disina tasan randevu reddedilir.
- Cakişan randevuya izin verilmez.
- Odul indirimi sadece kampanyaya uygun hizmetlerde uygulanir.
- Barber mola eklerse cakişan randevular barber iptali durumuna cekilir.

## Ortam Degiskenleri

Ornek `.env.local`:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/barber_db?schema=public

JWT_SECRET=change-me
JWT_EXPIRES_IN=1h
REFRESH_SECRET=change-me
REFRESH_EXPIRES_IN=7d
RESET_SECRET=change-me

PLATFORM_EMAIL=platform@example.com
PLATFORM_PASSWORD=change-me

BREVO_API_KEY=change-me
VENDOR_NAME=Barber App

CLOUDINARY_CLOUD_NAME=change-me
CLOUDINARY_API_KEY=change-me
CLOUDINARY_API_SECRET=change-me
```

`docker-compose.yml` icin ek degiskenler:

```env
POSTGRES_DB=barber_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

## Kurulum

```bash
cd backend
npm install
```

## Calistirma

Gelistirme:

```bash
npm run start:dev
```

Build + production:

```bash
npm run build
npm run start:prod
```

Varsayilan adres: `http://localhost:3001`

## Docker ile Calistirma

Repo kokunden:

```bash
docker compose up --build
```

Servis portlari:

- API: `3001`
- PostgreSQL: `5432`
- Redis: `6379`

## Veritabani ve Prisma Komutlari

`backend` klasoru icinde:

```bash
# migration olustur + uygula
npx prisma migrate dev

# sadece client uret
npx prisma generate

# seed
npx prisma db seed

# studio
npx prisma studio
```

## Test ve Kod Kalitesi

```bash
npm run test
npm run test:e2e
npm run test:cov
npm run lint
```

## Sorun Giderme

- `DATABASE_URL` hatalarinda PostgreSQL erisimi ve schema parametresini kontrol edin.
- `JWT` hatalarinda `JWT_SECRET` ve `REFRESH_SECRET` degerlerini dogrulayin.
- Dosya yukleme hatalarinda Cloudinary degiskenlerini kontrol edin.
- Docker'da API ayaga kalkmiyorsa `backend/.env.local` dosyasinin var oldugundan emin olun.

## Lisans

Bu proje MIT lisansi ile lisanslanmistir. Detaylar icin `LICENSE` dosyasina bakabilirsiniz.
