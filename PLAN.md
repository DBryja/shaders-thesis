# Zastosowanie shaderów GPU do tworzenia interaktywnych efektów wizualnych w interfejsach webowych

## Spis treści

### 1. Wstęp

- **1.1.** Rola estetyki i interaktywności w nowoczesnym projektowaniu UI/UX
- **1.2.** Uzasadnienie podjęcia tematu
- **1.3.** Ewolucja renderowania grafiki w przeglądarce: od statycznego CSS do WebGL i WebGPU
- **1.4.** Wybór technologii i analiza rozwiązań alternatywnych: uzasadnienie wyboru stosu technologicznego oraz krótka charakterystyka pozostałych narzędzi
- **1.5.** Cel i zakres pracy: budowa interaktywnego katalogu shaderów prezentujących ich wartość w interfejsach sieciowych oraz pozwalających ich badanie pod kątem wydajności

### 2. Architektura i zasady działania shaderów w środowisku webowym

- **2.1.** Architektura GPU vs CPU: wykorzystanie obliczeń równoległych w generowaniu grafiki
- **2.2.** Potok graficzny (Graphics Pipeline): przepływ danych od wierzchołka do bufora ramki
- **2.3.** Charakterystyka Vertex Shader i Fragment Shader
- **2.4.** Komunikacja między procesami: Uniforms, Attributes i Varyings

### 3. Projekt aplikacji demonstracyjnej

- **3.1.** Założenia projektowe i funkcjonalne aplikacji
- **3.2.** Architektura wejścia i wyjścia (I/O): obsługa zdarzeń użytkownika, tekstur i parametrów wejściowych
- **3.3.** Projekt systemu parametryzacji: mechanizm modyfikacji efektów w czasie rzeczywistym
- **3.4.** Schemat przepływu danych: integracja logiki aplikacji z procesami renderowania

### 4. Implementacja katalogu efektów i wykorzystane narzędzia

- **4.1.** Środowisko programistyczne i biblioteki: wykorzystanie Three.js, React Three Fiber oraz narzędzi pomocniczych (np. TypeGPU, Leva)
- **4.2.** Implementacja efektów operujących na wierzchołkach (Vertex Shaders)
    - Przykłady: dystorsje geometrii, tekstu
    - Aspekt techniczny: wykorzystanie funkcji trygonometrycznych i transformacji macierzowych
- **4.3.** Implementacja efektów rastrowych i SDF (Fragment Shaders)
    - Przykłady: dynamiczne gradienty, generowanie kształtów metodą Signed Distance Functions
    - Aspekt techniczny: normalizacja przestrzeni ekranu (UV mapping) i funkcje skokowe
- **4.4.** Zaawansowane filtry post-processingu i symulacje
    - Przykłady: Liquid Glass, szum proceduralny (Perlin/Simplex), filtry stylizowane (ASCII)
    - Aspekt techniczny: przetwarzanie tekstur i nakładanie warstw obliczeniowych

### 5. Testowanie i optymalizacja

- **5.1.** Metodyka testowania wydajności: narzędzia pomiarowe i wskaźniki (FPS, zużycie pamięci GPU)
- **5.2.** Porównanie wydajności: analiza porównawcza animacji realizowanych przez HTML+CSS, Canvas oraz shadery
- **5.3.** Techniki optymalizacji kodu shaderów: redukcja instrukcji warunkowych i optymalizacja obliczeń

### 6. Podsumowanie i wnioski

- **6.1.** Ocena realizacji założeń projektowych
- **6.2.** Wnioski inżynierskie dotyczące stosowania shaderów w projektach webowych
- **6.3.** Przyszłość rozwiązań graficznych w sieci: potencjał standardu WebGPU
