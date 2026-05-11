
# 3D tisk modelů staveb — landing + objednávkový tok

Web, kam architekti a nadšenci nahrají svůj 3D model budovy a dostanou rychlý odhad ceny za fyzický model. Bez účtů, kontakt přes email. Vizuál technicky-řemeslný (uhlově černá s oranžovým akcentem).

## Stránky

**1. Landing (`/`)**
- Hero: „Váš projekt jako fyzický model na stole" + CTA „Nahrát model"
- Sekce *Jak to funguje*: 1) Nahraj model → 2) Vyber měřítko a barvu → 3) Potvrdíme cenu → 4) Pošleme hotový model
- Sekce *Podporované formáty* — dvě skupiny:
  - **Připraveno k tisku** (rovnou do sliceru): `STL`, `3MF`, `OBJ`, `STEP/STP`
  - **Architektonické** (převedeme za tebe): `IFC`, `SKP` (SketchUp), `3DM` (Rhino), `DAE` (Collada)
- Sekce *Galerie hotových modelů* (placeholder fotky)
- FAQ: měřítka, materiály, dodací lhůta, co když je model dutý / nemá tloušťku stěn, proč nepřijímáme `.dwg`/`.dxf` (jsou typicky 2D), zmínka o výrobě technologií FDM (jednou větou, nenápadně)
- Patička s kontaktem

**2. Objednávka (`/objednavka`)**
- Velký drag-and-drop uploader (max ~100 MB, validace přípon)
- Po nahrání náhled: název souboru, velikost, formát, status („připraveno k tisku" / „převedeme ručně")
- Pro `STL`/`3MF`/`OBJ`: parsování v prohlížeči → spočítá **bounding box a objem** → odhad ceny
  - Vzorec: `cena = fix_setup + objem_cm³ × sazba_za_cm³ × měřítko_faktor`
  - Volby: měřítko (1:100 / 1:200 / 1:500 / vlastní), barva filamentu, kvalita (standard / detail)
- Pro architektonické formáty (IFC/SKP/3DM/DAE) a STEP: nelze spočítat v prohlížeči → zobrazí se „Orientační cena pošleme do 24 h po kontrole modelu"
- Formulář: jméno, email, telefon (volitelně), poznámka, adresa pro doručení
- Souhlas s podmínkami + odeslání

**3. Potvrzení (`/dekujeme`)**
- Shrnutí objednávky + co bude následovat (email do 24 h s finální cenou a platebními údaji)

## Backend (Lovable Cloud)

- **Storage bucket** `models` (privátní) — nahrané soubory
- **Tabulka `orders`**: id, created_at, email, jméno, telefon, file_path, file_format, file_size, bbox_xyz, objem_cm³, měřítko, barva, kvalita, odhad_ceny, finalni_cena, status (`new` / `quoted` / `paid` / `printing` / `shipped`), poznámka, adresa
- **Edge function `submit-order`**: validace, uložení záznamu, poslání emailu tobě (admin notifikace) + potvrzovací email zákazníkovi (Resend)
- RLS: insert open pro anon, select/update jen service role (bez účtů žádný frontend čtecí přístup)

## Technické detaily k formátům (proč co)

```text
Formát   Typ        Slicer-ready?  Poznámka
─────────────────────────────────────────────────────────────
STL      mesh       ANO            Nejběžnější, parsujeme objem
3MF      mesh+meta  ANO            Moderní náhrada STL
OBJ      mesh       ANO            Parsujeme objem
STEP/STP B-rep      ANO*           PrusaSlicer/Bambu umí; objem ručně
IFC      BIM        NE             Konverze přes IfcOpenShell server-side (později)
SKP      SketchUp   NE             Otevřeme v SketchUp → export STL
3DM      Rhino      NE             Otevřeme v Rhino → export STL
DAE      Collada    částečně       Konverze v Blenderu → STL
DWG/DXF  2D CAD     NE             Odmítáme, nelze tisknout půdorys
```

- Parsing v prohlížeči: `three.js` loadery (`STLLoader`, `OBJLoader`, `3MFLoader`) → `BufferGeometry.computeBoundingBox()` + signed-tetrahedron objem
- Manuální převody dělá majitel (ty) mimo web — web jen přijme soubor a oznámí „pošleme cenu do 24 h"

## Vizuál

- Pozadí `#1a1a1a`, povrchy `#2d2d2d`, oddělovače `#4a4a4a`
- Akcent (CTA, hover, progress) `#e85d3a` — barva roztaveného filamentu
- Typografie: Space Grotesk (nadpisy) + Inter (text), monospace detaily u technických údajů (rozměry, objem)
- Subtilní zrnitý/scanline efekt v hero, ostré hrany, žádné měkké stíny
- Mikrointerakce: progress bar uploadu v oranžové, animace „extrudéru" u CTA

## Mimo rozsah (pro pozdější fáze)

- 3D náhled modelu v prohlížeči (only po validaci poptávky)
- Online platba (Stripe/Paddle) — zatím faktura emailem
- Server-side konverze IFC/SKP/3DM přes externí službu
- Účty a historie objednávek
