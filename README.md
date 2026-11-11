# 🚀 AstroPress CMS — संपूर्ण बिगिनर सेटअप एवं डिप्लॉयमेंट गाइड

> **Astro 5, React 19, Cloudflare Pages, Cloudflare D1, Resend Email और GitHub Git-Backed Publishing पर आधारित एक आधुनिक, हाई-स्पीड और सुरक्षित पब्लिशिंग प्लेटफॉर्म।**

---

## 📑 विषय-सूची (Table of Contents)

1. [अध्याय 1 — प्रोजेक्ट परिचय और आर्किटेक्चर (Project Introduction & Architecture)](#अध्याय-1--प्रोजेक्ट-परिचय-और-आर्किटेक्चर)
2. [अध्याय 2 — सेटअप से पहले आवश्यक टूल्स और अकाउंट्स (Requirements Before Setup)](#अध्याय-2--सेटअप-से-पहले-आवश्यक-टूल्स-और-अकाउंट्स)
3. [अध्याय 3 — GitHub से सोर्स कोड डाउनलोड करना (Getting the Source Code)](#अध्याय-3--github-से-सोर्स-कोड-डाउनलोड-करना)
4. [अध्याय 4 — अपने कंप्यूटर पर AstroPress चलाना (Running AstroPress Locally)](#अध्याय-4--अपने-कंप्यूटर-पर-astropress-चलाना)
5. [अध्याय 5 — Cloudflare Pages पर फ्री डिप्लॉयमेंट (Cloudflare Pages Setup)](#अध्याय-5--cloudflare-pages-पर-फ्री-डिप्लॉयमेंट)
6. [अध्याय 6 — Cloudflare D1 डेटाबेस सेटअप (Database Setup)](#अध्याय-6--cloudflare-d1-डेटाबेस-सेटअप)
7. [अध्याय 7 — ईमेल सिस्टम सेटअप (Resend Email Setup)](#अध्याय-7--ईमेल-सिस्टम-सेटअप)
8. [अध्याय 8 — एनवायरनमेंट वेरिएबल्स और सीक्रेट्स (Environment Variables & Secrets)](#अध्याय-8--एनवायरनमेंट-वेरिएबल्स-और-सीक्रेट्स)
9. [अध्याय 9 — GitHub इंटीग्रेशन और कंटेंट पब्लिशिंग (GitHub Integration & Publishing)](#अध्याय-9--github-इंटीग्रेशन-और-कंटेंट-पब्लिशिंग)
10. [अध्याय 10 — एडमिन पैनल पहली बार सेटअप (Admin Panel First-Time Setup)](#अध्याय-10--एडमिन-पैनल-पहली-बार-सेटअप)
11. [अध्याय 11 — एडमिन पैनल संपूर्ण यूजर गाइड (Admin Panel User Guide)](#अध्याय-11--एडमिन-पैनल-संपूर्ण-यूजर-गाइड)
12. [अध्याय 12 — पहली बार वेबसाइट लाइव लॉन्च चेकलिस्ट (First Live Launch Checklist)](#अध्याय-12--पहली-बार-वेबसाइट-लाइव-लॉन्च-चेकलिस्ट)
13. [अध्याय 13 — बैकअप, अपडेट्स और मेंटेनेंस (Backup, Updates & Maintenance)](#अध्याय-13--बैकअप-अपडेट्स-और-मेंटेनेंस)
14. [अध्याय 14 — ट्रबलशूटिंग गाइड (Troubleshooting Guide)](#अध्याय-14--ट्रबलशूटिंग-गाइड)
15. [अध्याय 15 — फाइनल कॉन्फ़िगरेशन रेफरेंस (Final Configuration Reference)](#अध्याय-15--फाइनल-कॉन्फ़िगरेशन-रेफरेंस)

---

## अध्याय 1 — प्रोजेक्ट परिचय और आर्किटेक्चर

### AstroPress क्या है?
**AstroPress** एक आधुनिक, सुपरफास्ट डिजिटल पब्लिशिंग वेबसाइट और हेडलेस सीएमएस (Headless CMS) है। यह पारंपरिक वर्डप्रेस (WordPress) की जटिलताओं और भारी सर्वर खर्च को खत्म करता है। 

AstroPress में विजिटर्स को वेबसाइट पढ़ने के लिए किसी डेटाबेस या भारी जावास्क्रिप्ट का इंतजार नहीं करना पड़ता। सभी आर्टिकल्स पहले से ही **Astro 5** के जरिए बिजली की रफ्तार वाले स्टैटिक HTML वेबपेज के रूप में तैयार हो जाते हैं।

### प्रमुख विशेषताएं (Key Features):
* **100/100 Core Web Vitals:** गूगल सर्च के सभी मानकों (LCP, CLS, INP) पर 100% ऑप्टिमाइज्ड।
* **Gutenberg-Style विजुअल ब्लॉक एडिटर:** हेडिंग्स, पैराग्राफ, टेबल्स, 2-3 कॉलम लेआउट, और प्रोस-कॉन्स (Pros & Cons) कार्ड्स के साथ लाइव राइटिंग एक्सपीरियंस।
* **Git-Backed पब्लिशिंग:** आपका सारा कंटेंट सुरक्षित Markdown (.md) फाइलों के रूप में सीधे आपके GitHub रिपॉजिटरी में स्टोर होता है।
* **Cloudflare D1 सिक्योरिटी इंजन:** एडमिन ऑथेंटिकेशन, सेशन्स और रिकवरी कोड्स को Cloudflare के सर्वरलेस SQL डेटाबेस में सुरक्षित रखा जाता है।
* **Resend ईमेल इंटीग्रेशन:** पासवर्ड भूलने पर 15-मिनट सुरक्षित रीसेट लिंक भेजने की सुविधा।
* **100% फ्री-टियर पर चलने योग्य:** आपको किसी भी पेड सर्वर की जरूरत नहीं है।

### सिस्टम आर्किटेक्चर (Architecture Diagram)

```text
[ एडमिन / राइटर ] 
       │
       ▼ (लेख लिखना / अपडेट करना)
[ Gutenberg Editor (/wpadmin/) ]
       │
       ├──────────────────────────────────────────────┐
       ▼ (सुरक्षित सर्वर-साइड टोकन)                    ▼ (एडमिन लॉगिन, सेशन्स, पासवर्ड)
[ Cloudflare Worker (/api/github/*) ]      [ Cloudflare D1 Database (astropress-db) ]
       │                                              │
       ▼ (कमिट Markdown .md फाइल्स)                   │ (PBKDF2 Hashing, 8 Recovery Codes)
[ GitHub Repository (main branch) ]                   │
       │                                              │
       ▼ (ऑटोमैटिक बिल्ड ट्रिगर)                     ▼ (पासवर्ड रीसेट ईमेल)
[ Cloudflare Pages CI/CD ] ──────────────► [ Resend Email API ]
       │
       ▼ (Astro 5 Static Build: 47+ HTML Pages)
[ ग्लोबल एज CDN (https://astro-press.pages.dev/) ] ◄── [ आम पाठक / Googlebot ]
```

---

## अध्याय 2 — सेटअप से पहले आवश्यक टूल्स और अकाउंट्स

AstroPress को शुरू करने के लिए आपको नीचे दिए गए फ्री अकाउंट्स और सॉफ्टवेयर की जरूरत होगी:

### 1. जरूरी फ्री अकाउंट्स:
1. **GitHub अकाउंट:** (https://github.com/) — अपना कोड और आर्टिकल्स स्टोर करने के लिए।
2. **Cloudflare अकाउंट:** (https://dash.cloudflare.com/) — वेबसाइट होस्ट करने और D1 डेटाबेस के लिए।
3. **Resend अकाउंट:** (https://resend.com/) — पासवर्ड रीसेट ईमेल भेजने के लिए (फ्री में 3,000 ईमेल/महीना)।

### 2. कंप्यूटर सॉफ्टवेयर (अगर आप लोकल टेस्ट करना चाहते हैं):
* **Node.js:** वर्जन **22.22.0** या इससे नया (LTS रेकमेंडेड)। जांचने के लिए टर्मिनल में टाइप करें: `node -v`
* **npm:** वर्जन **10.0.0** या नया। जांचने के लिए: `npm -v`
* **Git:** (वैकल्पिक लेकिन अनुशंसित) — कोड क्लोन और पुश करने के लिए।
* **कोड एडिटर:** VS Code या कोई भी टेक्स्ट एडिटर।

---

## अध्याय 3 — GitHub से सोर्स कोड डाउनलोड करना

कोड प्राप्त करने के दो आसान तरीके हैं:

### तरीका A: ZIP फाइल डाउनलोड करना (शुरुआती लोगों के लिए सबसे आसान)
1. GitHub रिपॉजिटरी पेज पर जाएं: `https://github.com/ipritamsingh/astro-press`
2. हरे रंग के **`<> Code`** बटन पर क्लिक करें।
3. ड्रॉपडाउन में **`Download ZIP`** पर क्लिक करें।
4. डाउनलोड पूरी होने के बाद उस ZIP फाइल पर राइट-क्लिक करें और **Extract All** (अनजिप) करें।
5. अनजिप हुए फोल्डर का नाम `astro-press` रखें।

### तरीका B: Git Clone के जरिए (टर्मिनल कमांड)
अगर आपके कंप्यूटर में Git इंस्टॉल है, तो अपने टर्मिनल (Command Prompt / PowerShell / Terminal) में यह कमांड चलाएं:

```bash
git clone https://github.com/ipritamsingh/astro-press.git
cd astro-press
```

---

## अध्याय 4 — अपने कंप्यूटर पर AstroPress चलाना (Local Setup)

अपने कंप्यूटर पर वेबसाइट को टेस्ट करने के लिए ये स्टेप्स फॉलो करें:

### स्टेप 1: फोल्डर में टर्मिनल खोलें
टर्मिनल खोलें और `astro-press` फोल्डर के अंदर जाएं:
```bash
cd astro-press
```

### स्टेप 2: डिपेंडेंसीज इंस्टॉल करें
सभी जरूरी लाइब्रेरीज डाउनलोड करने के लिए चलाएं:
```bash
npm install
```
*(अपेक्षित परिणाम: `node_modules` फोल्डर बन जाएगा और सभी 187+ पैकेजेस इंस्टॉल हो जाएंगे।)*

### स्टेप 3: एनवायरनमेंट फाइल बनाएं
प्रोजेक्ट में दी गई `.env.example` फाइल की कॉपी बनाकर `.env` नाम दें:
```bash
cp .env.example .env
```
*(विंडोज़ पर आप कॉपी-पेस्ट करके फाइल का नाम `.env` रख सकते हैं।)*

### स्टेप 4: लोकल डेवलपमेंट सर्वर शुरू करें
```bash
npm run dev
```
अब अपने ब्राउज़र में खोलें:
* 🌐 **पब्लिक वेबसाइट:** `http://localhost:3000/`
* 🛠️ **एडमिन पैनल:** `http://localhost:3000/wpadmin/`

### स्टेप 5: प्रोडक्शन बिल्ड टेस्ट करें
वेबसाइट सही तरीके से बिल्ड हो रही है या नहीं, यह चेक करने के लिए:
```bash
npm run build
```
*(अपेक्षित परिणाम: टर्मिनल में `47 page(s) built in ~6s` और `dist/` फोल्डर में फाइल्स जनरेट होंगी।)*

### स्टेप 6: ऑटोमेटेड टेस्ट्स रन करें
```bash
npm run test:git
npm run lint
```
*(अपेक्षित परिणाम: `56 PASSED, 0 FAILED` और `tsc --noEmit` में 0 एरर आएंगे।)*

---

## अध्याय 5 — Cloudflare Pages पर फ्री डिप्लॉयमेंट

Cloudflare Pages आपकी वेबसाइट को 100% फ्री में होस्ट करता है और हर बार GitHub पर बदलाव होने पर ऑटोमैटिकली नया वर्जन पब्लिश करता है।

### स्टेप-बाय-स्टेप डिप्लॉयमेंट:

1. **Cloudflare में लॉगिन करें:** [Cloudflare Dashboard](https://dash.cloudflare.com/) पर जाएं।
2. **Pages सेक्शन खोलें:** लेफ्ट साइडबार में **Compute (Workers & Pages)** पर क्लिक करें, फिर **Create application** > **Pages** टैब > **Connect to Git** चुनें।
3. **GitHub अकाउंट कनेक्ट करें:** अपना GitHub अकाउंट ऑथराइज करें और अपनी रिपॉजिटरी `astro-press` को सेलेक्ट करके **Begin setup** पर क्लिक करें।
4. **बिल्ड सेटिंग्स भरें (Build Settings):**
   * **Project Name:** `astro-press` (या अपनी पसंद का नाम)
   * **Production branch:** `main`
   * **Framework preset:** `Astro`
   * **Build command:** `npm run build`
   * **Build output directory:** `dist`
5. **Environment Variables (बिल्ड के लिए):**
   * **Add variable** पर क्लिक करें:
     * **Variable name:** `NODE_VERSION`
     * **Value:** `22`
6. **Save and Deploy पर क्लिक करें:**
   * Cloudflare आपकी वेबसाइट को क्लोन करेगा, `npm run build` चलाएगा और कुछ ही पलों में आपकी लाइव वेबसाइट तैयार हो जाएगी।
   * आपको ऐसा URL मिलेगा: `https://astro-press.pages.dev`

---

## अध्याय 6 — Cloudflare D1 डेटाबेस सेटअप

AstroPress में विजिटर्स का कंटेंट Markdown फाइल्स में रहता है, लेकिन **एडमिन लॉगिन, पासवर्ड्स, एक्टिव सेशन्स और रिकवरी कोड्स** को स्टोर करने के लिए **Cloudflare D1** (सर्वरलेस SQL डेटाबेस) की आवश्यकता होती है।

### स्टेप 1: D1 डेटाबेस बनाएं
1. Cloudflare Dashboard में लेफ्ट मेन्यू से **Storage & Databases** > **D1 SQL Database** पर जाएं।
2. **Create database** बटन दबाएं।
3. डेटाबेस का नाम लिखें: `astropress-db`
4. **Create** पर क्लिक करें।
5. स्क्रीन पर दिख रहे **Database ID** (UUID) को कॉपी कर लें।

### स्टेप 2: डेटाबेस स्कीमा (Tables) इम्पोर्ट करें
AstroPress में `migrations/0001_auth_schema.sql` फाइल में सारे टेबल्स लिखे हुए हैं। इसे D1 में डालने के 2 तरीके हैं:

#### विकल्प A (Cloudflare Dashboard से):
1. अपने डेटाबेस `astropress-db` पर क्लिक करें और **Console** टैब में जाएं।
2. प्रोजेक्ट की `migrations/0001_auth_schema.sql` फाइल के पूरे कोड को कॉपी करें।
3. कंसोल में पेस्ट करके **Execute** बटन दबाएं।

#### विकल्प B (कंप्यूटर टर्मिनल / Wrangler से):
```bash
npx wrangler d1 execute astropress-db --file=./migrations/0001_auth_schema.sql --remote
```
*(अपेक्षित परिणाम: `admin_users`, `admin_sessions`, `password_reset_tokens`, `recovery_codes`, `auth_audit_logs` टेबल्स सफलतापूर्वक बन जाएंगे।)*

### स्टेप 3: डेटाबेस को Cloudflare Pages से लिंक (Bind) करें
यह सबसे जरूरी स्टेप है ताकि आपकी वेबसाइट डेटाबेस से बात कर सके:
1. Cloudflare Dashboard में **Workers & Pages** > अपने प्रोजेक्ट **`astro-press`** पर क्लिक करें।
2. **Settings** टैब > **Functions** (या **Bindings**) पर जाएं।
3. नीचे स्क्रॉल करके **D1 Database Bindings** सेक्शन में **Add binding** पर क्लिक करें:
   * **Variable name:** `DB` *(ध्यान रहे: यह बड़े अक्षरों में `DB` ही होना चाहिए)*
   * **D1 database:** ड्रॉपडाउन से `astropress-db` चुनें।
4. **Save** पर क्लिक करें।

---

## अध्याय 7 — ईमेल सिस्टम सेटअप (Resend Email)

यदि एडमिन अपना पासवर्ड भूल जाता है, तो उसे 15 मिनट वाला सुरक्षित रीसेट लिंक भेजने के लिए **Resend** का उपयोग किया जाता है।

### स्टेप 1: Resend अकाउंट और API Key बनाएं
1. [Resend.com](https://resend.com/) पर जाएं और फ्री अकाउंट बनाएं।
2. लेफ्ट साइडबार में **API Keys** पर क्लिक करें और **Create API Key** बटन दबाएं।
3. Key का नाम `AstroPress` रखें, Permission को **Full Access** दें और **Add** पर क्लिक करें।
4. जनरेट हुई की को कॉपी करें (यह `re_...` से शुरू होती है)।

### स्टेप 2: Sender Verification (ईमेल भेजने की पुष्टि)
* **टेस्टिंग के लिए:** Resend डिफ़ॉल्ट रूप से `onboarding@resend.dev` से ईमेल भेजने की अनुमति देता है, जिससे आप अपने रजिस्टर्ड ईमेल पर तुरंत पासवर्ड रीसेट लिंक प्राप्त कर सकते हैं।
* **कस्टम डोमेन ईमेल के लिए:** Resend डैशबोर्ड में **Domains** > **Add Domain** में जाकर अपने ईमेल डोमेन के DNS रिकॉर्ड्स (DKIM, SPF) जोड़कर वेरिफाई कर सकते हैं।

### स्टेप 3: Cloudflare Pages में Resend Key जोड़ें
1. Cloudflare Pages में अपने प्रोजेक्ट की **Settings** > **Environment variables** पर जाएं।
2. **Add variable** पर क्लिक करें:
   * **Variable name:** `RESEND_API_KEY`
   * **Value:** `re_आपकी_Resend_Key`
   * **Type:** इसे **Encrypt** (Secret) सेलेक्ट करें।
3. एक और वेरिएबल जोड़ें:
   * **Variable name:** `RESEND_FROM_EMAIL`
   * **Value:** `AstroPress <onboarding@resend.dev>` (या आपका वेरिफाइड ईमेल)
4. **Save** करें।

---

## अध्याय 8 — एनवायरनमेंट वेरिएबल्स और सीक्रेट्स

Cloudflare Pages में आपकी वेबसाइट को सुरक्षित रूप से चलाने के लिए निम्नलिखित वेरिएबल्स सेट होने चाहिए:

| Variable Name | Purpose (उद्देश्य) | Required? | Type | Example / Value |
| :--- | :--- | :---: | :---: | :--- |
| `NODE_VERSION` | बिल्ड के समय Node.js 22 का उपयोग करने के लिए | **जरूरी** | Plain Text | `22` |
| `SITE_URL` | कैनोनिकल SEO और ईमेल लिंक्स के लिए लाइव वेबसाइट URL | **जरूरी** | Plain Text | `https://astro-press.pages.dev` |
| `GITHUB_PAT` | एडमिन पैनल से GitHub में आर्टिकल्स कमिट करने के लिए टोकन | **जरूरी** | **Secret (Encrypted)** | `github_pat_11A...` |
| `RESEND_API_KEY` | पासवर्ड रीसेट ईमेल भेजने के लिए API की | ऐच्छिक | **Secret (Encrypted)** | `re_123456789...` |
| `RESEND_FROM_EMAIL` | किस ईमेल आईडी से रीसेट मेल जाएगा | ऐच्छिक | Plain Text | `AstroPress <onboarding@resend.dev>` |

> ⚠️ **सुरक्षा नियम (Security Rule):** `GITHUB_PAT` या `RESEND_API_KEY` को कभी भी अपने GitHub कोड में कमिट न करें और न ही ब्राउज़र के `localStorage` में रखें। इन्हें हमेशा Cloudflare Pages के **Settings > Environment variables** में **Encrypt** मोड में ही सुरक्षित रखें।

---

## अध्याय 9 — GitHub Integration और Content Publishing

AstroPress आपके नए और एडिट किए गए आर्टिकल्स को सीधे GitHub पर कमिट करता है। इसके लिए आपको एक GitHub Personal Access Token (PAT) चाहिए।

### स्टेप 1: GitHub Personal Access Token बनाएं
1. अपने GitHub अकाउंट में लॉगिन करें और ऊपर दाईं ओर अपनी प्रोफाइल फोटो > **Settings** पर जाएं।
2. बिल्कुल नीचे लेफ्ट साइडबार में **Developer settings** पर क्लिक करें।
3. **Personal access tokens** > **Fine-grained tokens** चुनें और **Generate new token** पर क्लिक करें।
4. फॉर्म भरें:
   * **Token name:** `AstroPress Publishing Token`
   * **Expiration:** 90 days ya 1 year
   * **Repository access:** **Only select repositories** चुनें और अपनी `astro-press` रिपॉजिटरी सेलेक्ट करें।
   * **Permissions (Repository permissions):**
     * **Contents:** इसे **Read and write** सेट करें।
5. नीचे **Generate token** पर क्लिक करें और जनरेट हुए टोकन (जो `github_pat_...` से शुरू होता है) को कॉपी कर लें।

### स्टेप 2: Cloudflare में GITHUB_PAT जोड़ें
1. Cloudflare Dashboard > **Workers & Pages** > `astro-press` > **Settings** > **Environment variables** पर जाएं।
2. **Add variable** पर क्लिक करें:
   * **Variable name:** `GITHUB_PAT`
   * **Value:** आपका कॉपी किया गया GitHub टोकन
   * **Encrypt** बटन पर टिक करें (ताकि टोकन हमेशा एन्क्रिप्टेड रहे)।
3. **Save** करें।

---

## अध्याय 10 — एडमिन पैनल पहली बार सेटअप (First-Time Admin Setup)

जब आपकी वेबसाइट पहली बार डिप्लॉय हो जाती है, तो एडमिन अकाउंट कैसे बनाना है:

1. अपने ब्राउज़र में एडमिन URL खोलें:
   ```
   https://astro-press.pages.dev/wpadmin/
   ```
2. सिस्टम D1 डेटाबेस चेक करेगा। चूंकि अभी तक कोई एडमिन नहीं बना है, आपके सामने **"Initial Administrator Setup"** स्क्रीन आएगी।
3. फॉर्म भरें:
   * **Admin Username:** कम से कम 3 अक्षर (उदा. `admin` या आपका नाम)
   * **Recovery Email:** आपका असली ईमेल (उदा. `yourname@gmail.com`)
   * **Password:** मजबूत पासवर्ड (कम से कम 8 अक्षर)
   * **Confirm Password:** वही पासवर्ड दोबारा लिखें।
4. **Initialize Primary Administrator** पर क्लिक करें।
5. 🛡️ **8 Emergency Recovery Codes स्क्रीन पर दिखेंगे:**
   * सिस्टम आपको `ZG3U-XB8H-JLTV` जैसे 8 सिंगल-यूज़ रिकवरी कोड देगा।
   * इन्हें **Copy & Save** करके किसी सुरक्षित जगह पर नोट कर लें। यदि कभी आप पासवर्ड और ईमेल दोनों भूल जाएं, तो इन कोड्स से लॉगिन हो सकता है।
6. आपका सेटअप पूरा हो गया! अब `/api/auth/setup` रूट हमेशा के लिए लॉक हो चुका है — कोई दूसरा व्यक्ति दोबारा एडमिन नहीं बना सकता।

---

## अध्याय 11 — एडमिन पैनल संपूर्ण यूजर गाइड

लॉगिन करने के बाद आप AstroPress के पावरफुल टूल्स का उपयोग कर सकते हैं:

* **Posts Manager:**
  * **Create New Post:** नया आर्टिकल लिखें।
  * **Draft / Published:** आर्टिकल को ड्राफ्ट रखें या पब्लिश करें।
  * **Trash & Restore:** अनचाहे आर्टिकल्स को ट्रैश में भेजें या जरूरत पड़ने पर दोबारा रिस्टोर करें।
* **Gutenberg-Style Visual Block Editor:**
  * **Add Block:** `+` बटन दबाकर पैराग्राफ, हेडिंग (H2, H3), कोड ब्लॉक, इमेज, और कोट्स जोड़ें।
  * **Interactive Tables:** पंक्तियां (rows) और कॉलम जोड़ें; मोबाइल पर टेबल्स ऑटोमैटिकली स्मूथली स्क्रॉल होती हैं।
  * **2-Column & 3-Column Blocks:** आधुनिक ग्रिड लेआउट बनाएं जो डेस्कटॉप पर साथ-साथ और मोबाइल पर एक के नीचे एक सुंदर दिखते हैं।
  * **Pros & Cons Cards:** रिव्यू आर्टिकल्स के लिए हरे (फायदे) और लाल (नुकसान) वाले आकर्षक लिस्ट कार्ड्स बनाएं।
  * **Live Permalink Preview:** हेडिंग के नीचे अपने आर्टिकल का असली लाइव URL (`/my-story/`) तुरंत चेक करें।
* **Explore by Topic (Category Showcase):**
  * **Taxonomies & Categories** में जाकर टेक्नोलॉजी, डिज़ाइन आदि के कलर्स और आइकन्स सेट करें। यह होमपेज पर 5-कॉलम रेस्पॉन्सिव ग्रिड में दिखते हैं।
* **SEO Inspector:**
  * फोकस कीवर्ड, कस्टम मेटा टाइटल, मेटा डिस्क्रिप्शन और सोशल शेयरिंग (OG Image) सेट करें।
* **AdSense & Monetization:**
  * हेडर, आर्टिकल के बीच में और फुटर में गूगल एडसेंस के ऑटो-रेस्पॉन्सिव कोड्स लगाएं।
* **Git Deployment View:**
  * अपने द्वारा किए गए बदलावों को एक क्लिक में GitHub पर कमिट और पुश करें।

---

## अध्याय 12 — पहली बार वेबसाइट लाइव लॉन्च चेकलिस्ट

अपनी वेबसाइट को पब्लिक करने से पहले यह चेकलिस्ट देख लें:

- [x] GitHub रिपॉजिटरी में सोर्स कोड मौजूद है।
- [x] Cloudflare Pages में प्रोजेक्ट कनेक्टेड है और बिल्ड पास (`Success`) हो चुका है।
- [x] `NODE_VERSION = 22` और `SITE_URL` एनवायरनमेंट वेरिएबल्स सेट हैं।
- [x] Cloudflare D1 डेटाबेस (`astropress-db`) बना हुआ है और `DB` बाइंडिंग जुड़ी हुई है।
- [x] D1 स्कीमा माइग्रेशन चला दिया गया है (सभी 5 टेबल्स मौजूद हैं)।
- [x] `GITHUB_PAT` सीक्रेट एन्क्रिप्टेड रूप में Cloudflare में सेव है।
- [x] `/wpadmin/` पर जाकर प्राइमरी एडमिन अकाउंट बना लिया गया है और रिकवरी कोड्स सेव कर लिए हैं।
- [x] पहला टेस्ट आर्टिकल पब्लिश करके होमपेज पर चेक कर लिया गया है।
- [x] `https://astro-press.pages.dev/sitemap.xml` और `/robots.txt` ब्राउज़र में सही खुल रहे हैं।

---

## अध्याय 13 — बैकअप, अपडेट्स और मेंटेनेंस

1. **कंटेंट का बैकअप:**
   * आपका सारा कंटेंट GitHub पर Markdown फाइलों के रूप में है। GitHub रिपॉजिटरी को अपने कंप्यूटर पर `git pull` करके या ZIP डाउनलोड करके कभी भी सुरक्षित बैकअप रख सकते हैं।
2. **डेटाबेस का बैकअप:**
   * Cloudflare Dashboard > **Storage & Databases** > **D1** > `astropress-db` > **Backups** टैब में जाकर आप कभी भी 1-क्लिक बैकअप डाउनलोड कर सकते हैं।
3. **कोड अपडेट करना:**
   * जब भी प्रोजेक्ट में कोई नया फीचर या बग-फिक्स आए:
     ```bash
     git pull origin main
     npm install
     npm run test:git
     git push origin main
     ```
   * Cloudflare Pages अपने आप नया वर्जन बिल्ड और लाइव कर देगा।

---

## अध्याय 14 — ट्रबलशूटिंग गाइड (Troubleshooting)

### 1. Cloudflare Build Failed: "Node version mismatch"
* **कारण:** Cloudflare डिफ़ॉल्ट रूप से पुराना Node.js इस्तेमाल कर रहा है।
* **समाधान:** Cloudflare Pages > Settings > Environment variables में जाएं और `NODE_VERSION` को `22` पर सेट करें।

### 2. Admin Login पर "Database binding missing" एरर
* **कारण:** Cloudflare D1 डेटाबेस Pages प्रोजेक्ट के साथ बाउंड नहीं है।
* **समाधान:** Cloudflare Pages > Settings > Functions > D1 Database Bindings में जाएं, Variable name में `DB` लिखें और `astropress-db` सेलेक्ट करके सेव करें। फिर प्रोजेक्ट को Redeploy करें।

### 3. GitHub Publish Failed (401 Unauthorized / Bad Credentials)
* **कारण:** `GITHUB_PAT` एक्सपायर हो गया है या गलत टोकन पेस्ट हुआ है।
* **समाधान:** GitHub Developer Settings में जाकर नया Fine-grained PAT बनाएं (Contents: Read & write परमिशन के साथ) और Cloudflare में `GITHUB_PAT` की वैल्यू अपडेट करें।

### 4. आर्टिकल पब्लिश होने के बाद लाइव साइट पर तुरंत नहीं दिख रहा
* **कारण:** Git-backed आर्किटेक्चर में GitHub कमिट के बाद Cloudflare Pages को नया स्टैटिक HTML बिल्ड करने में 30 से 60 सेकंड लगते हैं।
* **समाधान:** Cloudflare Pages डैशबोर्ड में **Deployments** टैब देखें। जब स्टेटस हरा चेक (`Success`) हो जाए, तो पेज को हार्ड-रिफ्रेश (`Ctrl + Shift + R` या `Cmd + Shift + R`) करें।

---

## अध्याय 15 — फाइनल कॉन्फ़िगरेशन रेफरेंस

* **वेबसाइट यूआरएल:** `https://astro-press.pages.dev/`
* **एडमिन यूआरएल:** `https://astro-press.pages.dev/wpadmin/`
* **बिल्ड कमांड:** `npm run build`
* **आउटपुट डायरेक्टरी:** `dist`
* **नोड वर्जन:** `22.x`
* **डेटाबेस इंजन:** Cloudflare D1 (Binding: `DB`)
* **ईमेल प्रोवाइडर:** Resend (Key: `RESEND_API_KEY`)
* **कंटेंट स्टोरेज पाथ:** `src/content/posts/*.md`

---
*AstroPress CMS — हाई-परफॉर्मेंस, मॉडर्न और सुरक्षित डिजिटल पब्लिशिंग का भविष्य।*
