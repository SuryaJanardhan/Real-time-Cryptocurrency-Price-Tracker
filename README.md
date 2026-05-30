# 🌌 CryptoStream Quantum Dashboard

A high-performance, real-time cryptocurrency ticker dashboard designed with pixel-perfect responsive glassmorphism. It aggregates low-latency WebSocket price quotes, manages reactive states via Zustand, and provides beautiful historical analysis charts with client-side caching and resilient Brownian motion fallbacks. 

Built with **React 18**, **TypeScript**, **Tailwind CSS**, **Chart.js**, and **Vitest** under strict **Node.js 18** constraints. Target WCAG 2.1 AA accessibility compliant.

---

## 🚀 Key Functional Architectures

### 1. Low-Latency Ticker Streams (WebSocket)
Directly maps to the **Binance Multi-Asset Mini-Ticker stream** (`wss://stream.binance.com:9443/ws/!miniTicker@arr`).
- **Resilient Lifecycle:** Automatic exponential backoff connection manager (maximum 10 retries) logs errors gracefully to the console without component crashes.
- **Heartbeat & Status Broadcasts:** Exposes a clean, reactive state listener inside our Zustand store to trigger fallback mock models in case of severe network disturbance.

### 2. Client-Side Caching & Request Deduplication
To respect CoinGecko API rate constraints and maximize performance:
- **5-Minute Client Cache:** Saves historical charts in-memory inside an query Map. Switching back and forth between BTC and ETH occurs instantaneously without network calls.
- **In-flight Deduplication:** Prevents multiple parallel requests for the same token and timeframe by keeping track of outstanding API promises.

### 3. Geometric Brownian Motion (GBM) Fallback
If the CoinGecko public API rate limits us (returns HTTP 429) or the client is offline:
- Instead of showing empty, broken chart grids, the service automatically initiates a **high-fidelity random walk historical simulator**.
- It maps the current live WebSocket price as a **seed point** and simulates a standard GBM historical curve. This guarantees **100% chart availability** and a beautiful, uninterrupted experience.

### 4. Interactive Historical Line Charts
Visualizes timeframe indices (**1 Hour**, **24 Hours**, and **7 Days**) using custom, responsive `react-chartjs-2` elements.
- Custom linear canvas vertical gradients (adjusts dynamically: glowing emerald for positive vectors, ruby rose for negative).
- Fully responsive tooltips that scale smoothly on both mobile aspect ratios and high-resolution monitors.

### 5. Premium Glassmorphic Design & Updates
- **Visual Highlight Flashing:** Component cards briefly trigger high-performance, isolated green (positive tick) or red (negative tick) border flashes and shadow glows using native CSS keyframes to prevent browser thread congestion.
- **Dynamic Market Aggregation:** Displays live, computed metrics like average global 24h shifts, aggregate B-level volumes, top leader nodes, and bottom laggard nodes.

---

## 🎨 Design Tokens & UI System

The interface adheres to modern, premium aesthetics:
- **Primary Canvas Background:** `#090a0f` (Deep space dark canvas).
- **Glass Panel Standard:** Transparent backdrop filter blurs overlaying high-contrast HSL layers.
- **Typography:** `Outfit` (for tech tracking header nodes) and `Inter` (for fast financial tabular values).

---

## ♿ Accessibility First (WCAG 2.1 AA Compliance)

- **Semantic Layout:** Styled using appropriate HTML5 tags (`<header>`, `<main>`, `<section>`, `<footer>`, `<article>`).
- **ARIA Live Announces:** Utilizes `aria-live="polite"` so screen-readers announce real-time ticker quotes without overriding active focus.
- **Keyboard Friendly Navigation:** Full keyboard support. The user can press `Tab` to navigate through cryptocurrency selection cards or chart timeframes and press `Space` or `Enter` to select. Fully supports focus outlines.

---

## 🛠️ Setup & Development Guide

Ensure you are inside the workspace directory. Because of Windows-to-Linux mount structures, all local commands should override global prefixes:

### 1. Install Dependencies
```bash
NPM_CONFIG_PREFIX=/usr/local npm install
```

### 2. Launch Local Dev Server
```bash
NPM_CONFIG_PREFIX=/usr/local npm run dev
```

### 3. Verify Production Bundle Compiles
```bash
NPM_CONFIG_PREFIX=/usr/local npm run build
```

---

## 🧪 Testing Suite (Vitest Hermetic Mode)

The project includes unit tests for key state mechanics (`cryptoStore.ts`) and fetch layers (`CryptoApiService.ts`).
- **Hermetic Mocking:** `global.fetch` is mocked to ensure tests execute offline, deterministically, and in less than **100 milliseconds** without rate-limiting timeouts.
- **Run Tests:**
  ```bash
  NPM_CONFIG_PREFIX=/usr/local npm run test
  ```

---

## 🐳 Production Containerization (Docker)

A fully optimized **multi-stage Docker build** compiles assets in a Node 18 environment and hosts the single-page application under a lightweight Alpine Nginx server.

### 1. Build optimized container
```bash
docker build -t cryptostream-quantum .
```

### 2. Run local container instance (Port 8080)
```bash
docker run -d -p 8080:80 --name crypto-tracker cryptostream-quantum
```
Open your browser and navigate to `http://localhost:8080`.
