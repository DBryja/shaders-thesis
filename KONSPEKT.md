# Konspekt pracy

## 1. Wstęp

- **1.1.** Rola estetyki i interaktywności w nowoczesnym projektowaniu UI/UX
- **1.2.** Ewolucja renderowania grafiki w przeglądarce: od statycznego CSS do WebGL i WebGPU
- **1.3.** Cel i zakres pracy
- **1.4.** Teza pracy: shadery jako narzędzie optymalizacji wydajności i unikalności interfejsów
  - *Uwaga: czy potrzebujemy takiej tezy? Czy można z niej zrezygnować?*

## 2. Architektura i zasady działania shaderów w środowisku webowym

- **2.1.** Architektura GPU vs CPU – dlaczego shadery są wydajne?
- **2.2.** Potok graficzny (Graphics Pipeline) w przeglądarce
  - *Opis kroków: input → vertex shader → rasteryzacja → fragment shader → frame buffer*
- **2.3.** Charakterystyka Vertex Shader i Fragment Shader
- **2.4.** Języki programowania shaderów: GLSL (WebGL) vs WGSL (WebGPU)
- **2.5.** Komunikacja między CPU a GPU: Uniforms, Attributes i Varyings

## 3. Matematyczne i logiczne podstawy tworzenia efektów wizualnych

- **3.1.** Układy współrzędnych i normalizacja przestrzeni ekranu (UV mapping)
- **3.2.** Wykorzystanie funkcji matematycznych (`sin`, `cos`, `step`, `smoothstep`) do animacji
- **3.3.** Analiza wybranego efektu wizualnego – od wzoru matematycznego do kodu (analiza w Desmos)
  - *Np. prosta „symulacja” fal morskich lub flagi na wietrze*
- **3.4.** Szum proceduralny (Perlin, Simplex) jako podstawa naturalnych efektów
- **3.5.** Przekształcenia macierzowe w służbie deformacji wierzchołków

## 4. Narzędzia i biblioteki wspierające implementację shaderów w Webie

- **4.1.** Czyste API (Vanilla WebGL/WebGPU) – wady i zalety
- **4.2.** Ekosystem Three.js i react-three-fiber
- **4.3.** Nowoczesne podejście: TypeGPU i Node Based Shaders
  - *Raczej tylko opisowo, z przykładem z internetu*

## 5. Projekt i implementacja katalogu interaktywnych efektów (część praktyczna)

- **5.1.** Założenia projektowe aplikacji demonstracyjnej
  - *Uwaga: czy potrzebne? Opis aplikacji/strony, na której będą implementowane efekty*
- **5.2.** Implementacja efektów operujących na wierzchołkach (Vertex Shaders): fale, dystorsje tekstu
- **5.3.** Implementacja efektów rastrowych (Fragment Shaders): gradienty dynamiczne i SDF (Signed Distance Functions)
- **5.4.** Zaawansowane efekty post-processingu: filtry obrazu (ASCII, Lego, Overlay)
- **5.5.** Efekty materiałowe i symulacje: Liquid Glass (light diffraction)
- **5.6.** Shadery proceduralne (chmury, teren) — *jeśli czas pozwoli*
- **5.7.** Oświetlenie i interakcja z modelami 3D w czasie rzeczywistym — *jeśli czas pozwoli*

## 6. Analiza wydajności i użyteczności rozwiązań

- **6.1.** Metodyka testowania wydajności (klatki na sekundę, zużycie pamięci GPU)
- **6.2.** Porównanie wydajności: animacje CSS/Canvas vs shadery GPU
  - *Np. renderowanie x node’ów w HTML, Canvasie i przez shadery*
- **6.3.** Wpływ skomplikowanych shaderów na urządzenia mobilne

## 7. Podsumowanie i wnioski

- **7.1.** Ocena realizacji założonych celów
- **7.2.** Przyszłość shaderów w sieci – kierunek rozwoju WebGPU
- **7.3.** Wnioski końcowe
