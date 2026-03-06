# Barber Appointment Backend

Bu servis, berber randevu uygulamasinin backend katmanidir. Proje `NestJS`, `Prisma` ve `PostgreSQL` uzerinde calisir.

## Teknoloji Yigini

- Node.js 20
- NestJS 10
- Prisma 5
- PostgreSQL
- Redis

## Modul Ozeti

`src` altinda asagidaki ana moduller bulunur:

- `auth`, `admin-auth`, `barber-auth`: kimlik dogrulama ve token akislari
- `appointment`: randevu olusturma, iptal, durum guncelleme, onizleme
- `working-hour`, `holiday`: calisma saatleri ve tatil gunleri
- `service`: isletme hizmetleri
- `shop`, `barber`, `customer`: temel is alanlari
- `campaign`, `reward`, `game`: kampanya ve odul yapisi
- `upload`: dosya yukleme ve cloud entegrasyonu

## Gereksinimler

- Node.js 20+
- npm
- Calisan bir PostgreSQL instance'i
- (Opsiyonel) Redis

## Kurulum

Proje kokunden backend klasorune gecin:

```bash
cd backend
npm install
```

`postinstall` asamasinda Prisma Client otomatik uretilir.

## Ortam Degiskenleri

Bu projede `.env.local` dosyasi kullaniliyor (docker-compose da bu dosyayi referans aliyor).

Asagidaki degiskenler backend tarafinda kullaniliyor:

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

Docker ile calisiyorsaniz, proje kokundeki `docker-compose.yml` icin su degiskenler de gereklidir:

```env
POSTGRES_DB=barber_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

## Veritabani Islemleri

`backend` klasoru icindeyken:

```bash
# Migrationlari uygula
npx prisma migrate dev

# Gerekirse seed calistir
npx prisma db seed
```

## Calistirma

```bash
# development
npm run start:dev

# production build
npm run build
npm run start:prod
```

Uygulama varsayilan olarak `http://localhost:3001` adresinde ayaga kalkar.
Global API prefix: `/api`

## Docker ile Calistirma

Proje kokunden:

```bash
docker compose up --build
```

Bu komutla asagidaki servisler ayaga kalkar:

- API: `localhost:3001`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Kullanilabilir Scriptler

`backend/package.json` icindeki temel scriptler:

- `npm run start`
- `npm run start:dev`
- `npm run start:prod`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run test:cov`

## Test

```bash
npm run test
npm run test:e2e
```

## Lisans

Bu depo kokunde bulunan lisans dosyasina tabidir: `../LICENSE`.
