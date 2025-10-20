# 🎨 Prometheus - Design Specifications

This document outlines all design elements implemented according to your requirements.

## 📝 Typography Implementation

### Header Font: **Orbitron**
- **Location**: All major headings (H1, H2, H3)
- **Weights**: 400, 700, 900
- **Usage**: 
  - Hero title: 9xl (144px) weight 900
  - Section headings: 7xl (72px) weight 700
  - Feature titles: 2xl (24px) weight 700
- **Effect**: CRT glow with golden text-shadow

### Body Font: **Space Grotesk**
- **Location**: All body text, descriptions, inputs
- **Weights**: 300, 400, 500, 600, 700
- **Usage**:
  - Paragraphs: text-xl (20px) weight 400
  - Button text: text-lg (18px) weight 700
  - Feature descriptions: text-lg weight 400

### Accent Font: **Stylized Greek Inscriptions**
- **Location**: Overlays, watermarks, hover effects
- **Font**: Serif (system Greek fonts)
- **Symbols Used**: Α, Ω, Π, Σ, Φ, Θ, Ψ, α, β, γ, δ, ε, etc.
- **Implementation**: GreekRuneOverlay component + subtle watermarks

---

## 🎨 Color Palette Implementation

### Primary Colors

#### ⚫ Void Black
- **Hex**: `#0a0a0a`
- **Usage**: Main background, button hover text
- **CSS Variable**: `--void-black`
- **Classes**: `bg-void-black`, `text-void-black`

#### 🟡 Molten Gold
- **Hex**: `#FFB800`
- **Usage**: Primary text, borders, glows, veins
- **CSS Variable**: `--molten-gold`
- **Classes**: `text-molten-gold`, `border-molten-gold`
- **Glows**: `0 0 20px #FFB800` (multiple layers)

#### 🟢 Neural Emerald
- **Hex**: `#00FF9F`
- **Usage**: Accents, data streams, special text
- **CSS Variable**: `--neural-emerald`
- **Classes**: `text-neural-emerald`
- **Effect**: Matrix-style coded intelligence

---

## 🌊 Website Concept Implementation

### Black Interface with Molten Gold Lines
✅ **Implemented**:
- Background: `#0a0a0a` (void-black)
- 4 pulsing gold veins (2 horizontal, 2 vertical)
- Veins use `gold-vein` class with pulse animation
- Box shadows create "under the obsidian" effect

### Greek Symbols Glow on Hover
✅ **Implemented**:
- `GreekRuneOverlay.tsx` component
- 30 Greek symbols across viewport
- Glow within 200px of mouse cursor
- Dynamic opacity calculation
- Golden text-shadow on activation

### Ember-like Transitions
✅ **Implemented**:
- `ember-transition` class on all sections
- Smooth scroll behavior
- Framer Motion with cubic-bezier easing
- No hard cuts - all fades and flows
- Section reveals with `useInView` hooks

---

## ⚡ UI Motion Implementation

### 1. Sparks → Data Streams
✅ **Implemented**: `SparkEffect.tsx`
- Sparks follow mouse movement
- Golden particles rise and fade
- `spark-rise` animation (1.5s)
- Transforms position and scale
- Auto-cleanup after animation

### 2. Wallet Address → Greek Runes
✅ **Implemented**: `WalletSection.tsx`
- Input field with transform logic
- Character mapping: `0→Ο`, `1→Ι`, `a→α`, etc.
- Appears above input on focus
- Fades in with motion animation
- Neural emerald glow effect

### 3. Chain Breaking Animation
✅ **Implemented**: `SubscriptionSection.tsx`
- Triggered on "FLAME" plan subscription
- 8 chain emojis explode outward
- Radial distribution pattern
- Scale, opacity, position transforms
- "You've unlocked the flame" message
- 0.8s duration with staggered delays

---

## 🎭 Textures & Aesthetics

### Cassette Futurism / Retro-Tech

#### CRT Glow Effect
✅ **Implemented**: `globals.css`
- Scanline overlay (repeating gradient)
- Applied to entire viewport
- 1px horizontal lines
- Subtle transparency (15%)

#### Static Noise
✅ **Implemented**: `.static-noise`
- SVG fractal noise filter
- Animated opacity (0.05-0.08)
- 0.2s infinite animation
- Fixed positioning, full coverage

#### Vector Grids
✅ **Implemented**: `.vector-grid`
- 50px × 50px grid pattern
- Golden lines at 5% opacity
- Linear gradients (horizontal + vertical)
- Covers entire background

### Greek Runes & Chains

#### Greek Rune System
✅ **Implemented**:
- Background symbols on all sections
- `.greek-rune` class with opacity transitions
- Appears on `.greek-container:hover`
- Large decorative symbols (text-9xl)
- Strategic placement (corners, centers)

#### Chain Motifs
✅ **Implemented**:
- Chain emoji (⛓️) in subscription unlock
- Breaking animation with rotation
- Symbol represents limitation/freedom theme
- Links to "Chain Liberation" feature

### Data Streams

#### Sparks → Data
✅ **Implemented**:
- Particle system in `SparkEffect.tsx`
- Golden sparks trail cursor
- Rise animation with fade-out
- Box-shadow glow effect

#### Fire → Binary
✅ **Implemented**:
- `HeroSection.tsx` binary background
- 100 random binary digits (0s and 1s)
- `.binary-char` with fire animation
- Color transition: gold → emerald
- Staggered animation delays
- Represents "divine knowledge → technology"

---

## 🎬 Animation Keyframes

### 1. `pulse-glow`
- **Duration**: 2s
- **Effect**: Opacity + shadow intensity
- **Usage**: Molten gold veins

### 2. `spark-rise`
- **Duration**: 1.5s
- **Effect**: translateY(-100px), scale(0)
- **Usage**: Spark particles

### 3. `chain-break`
- **Duration**: 0.8s
- **Effect**: Scale(1.3), rotate(25deg), fade out
- **Usage**: Chain symbols on subscription

### 4. `binary-fire`
- **Duration**: 2s
- **Effect**: translateY, opacity, color shift
- **Usage**: Binary background text

### 5. `data-stream`
- **Duration**: 2s
- **Effect**: translateX(-100% → 100%)
- **Usage**: Emerald lines on feature hover

### 6. `static-noise`
- **Duration**: 0.2s
- **Effect**: Subtle opacity flicker
- **Usage**: Background noise texture

---

## 🎯 Interactive Elements

### Buttons: `.prometheus-button`
- Transparent background
- 2px gold border
- Orbitron font, bold, letter-spacing
- Hover effect:
  - Circular gold fill (::before pseudo-element)
  - Text color → void-black
  - Shadow glow (20px, 40px blur)
  - 0.5s expansion transition

### Hover States

#### Feature Cards
- Border: gold/30 → gold
- Shadow: 0 → 30px gold glow
- Data stream appears (horizontal line)
- Greek runes reveal
- 0.5s ember transition

#### Input Fields
- Border-bottom: gold/30 → gold
- Neural emerald text color
- Text-shadow: emerald glow
- Greek transformation on focus

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: Default (320px+)
- **Tablet**: `md:` (768px+)
- **Desktop**: Automatic scaling

### Typography Scaling
- Hero: `text-8xl` → `md:text-9xl`
- Headings: `text-5xl` → `md:text-7xl`
- Body: `text-lg` → `md:text-xl`

### Layout Adjustments
- Features: 1 column → `md:grid-cols-3`
- Subscription: 1 column → `md:grid-cols-3`
- Padding: Responsive spacing

---

## 🔮 Special Effects Summary

| Effect | Component | Trigger | Duration |
|--------|-----------|---------|----------|
| Greek Glow | GreekRuneOverlay | Mouse proximity | Instant |
| Sparks | SparkEffect | Mouse move | 1.5s |
| Binary Fire | HeroSection | Auto | 2s loop |
| Chain Break | SubscriptionSection | Click | 0.8s |
| Rune Transform | WalletSection | Input focus | 2s |
| Data Stream | FeatureSection | Card hover | 2s loop |
| Gold Veins | Page | Auto | 2s loop |
| Static Noise | Page | Auto | 0.2s loop |

---

## ✅ Requirements Checklist

### Typography
- ✅ Orbitron for headers
- ✅ Space Grotesk for body
- ✅ Greek inscriptions as accents

### Colors
- ✅ Void Black (#0a0a0a)
- ✅ Molten Gold (#FFB800)
- ✅ Neural Emerald (#00FF9F)

### Effects
- ✅ Black interface with gold veins
- ✅ Greek symbols glow on hover
- ✅ Ember transitions
- ✅ Sparks → data streams
- ✅ Wallet → Greek runes
- ✅ Chain breaking animation

### Aesthetics
- ✅ Cassette futurism
- ✅ CRT glow
- ✅ Vector grids
- ✅ Static noise
- ✅ Fire → binary

### Framework
- ✅ Next.js 14
- ✅ TypeScript
- ✅ Component architecture

---

All specifications have been precisely implemented! 🔥

