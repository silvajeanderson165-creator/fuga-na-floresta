# 🌿 Fuga na Floresta

> Um jogo 2D *endless runner* ambientado na **Floresta Amazônica**, construído com HTML5 Canvas e JavaScript puro.

[![Play Now](https://img.shields.io/badge/🎮_Jogar_Agora-00C853?style=for-the-badge&logo=vercel&logoColor=white)](https://fuga-na-floresta.vercel.app)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript_ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](#)
[![Canvas API](https://img.shields.io/badge/Canvas_API-FF6F00?style=flat-square)](#)
[![Web Audio](https://img.shields.io/badge/Web_Audio_API-7B1FA2?style=flat-square)](#)

---

## 🎮 Sobre o Jogo

Um explorador corre por uma trilha na floresta amazônica e precisa desviar de animais selvagens que aparecem no caminho. Quanto mais longe ele vai, mais rápido o jogo fica!

### ✨ Features

- 🏃 **Endless Runner** com dificuldade progressiva
- 🐗 **4 tipos de obstáculos** — Javali, Cobra, Arara e Onça-Pintada
- 🍌 **Power-ups** — Banana (Invencibilidade) e Coco (Slow-Motion)
- 🏆 **10 Achievements** desbloqueáveis com persistência
- 🌅 **Transição dia→noite gradual** com cores interpoladas
- 🦋 **Cenário vivo** — Folhas caindo, borboletas, cipós, vaga-lumes
- 🔊 **Áudio 100% procedural** via Web Audio API (zero assets externos)
- 📱 **Responsivo** — Funciona em desktop e mobile (toque na tela)
- 🎬 **Visual premium** — Parallax 5 camadas, partículas, screen shake, fade entre telas

### 🕹️ Controles

| Ação | Desktop | Mobile |
|------|---------|--------|
| Pular | `↑` / `Espaço` | Toque na metade inferior |
| Agachar | `↓` | Segurar na metade inferior |
| Pausar | `Enter` | Toque na metade superior |
| Mute | Clique no 🔊 | Toque no 🔊 |

---

## 🛠️ Tecnologias

| Tech | Uso |
|------|-----|
| **HTML5 Canvas** | Renderização de todos os sprites e cenários via API nativa |
| **JavaScript ES6+** | Lógica de jogo, física, estado e animações |
| **Web Audio API** | Síntese sonora procedural (OscillatorNode + GainNode) |
| **CSS3** | Responsividade e prevenção de comportamentos mobile |
| **localStorage** | Persistência de high score, achievements e configurações |

> **Zero dependências externas.** Todo o jogo é desenhado programaticamente — sem imagens, sem bibliotecas, sem frameworks.

---

## 📁 Estrutura

```
├── index.html      # Estrutura HTML5 + meta tags SEO/OG
├── style.css       # Estilos responsivos + prevenção mobile
├── engine.js       # Background (parallax), AudioManager, UI (HUD/menus)
├── entities.js     # Player (animações) + Obstacle (4 tipos de animais)
├── game.js         # Loop principal, colisões, power-ups, achievements
└── favicon.png     # Ícone temático
```

---

## 🚀 Rodar Localmente

```bash
# Clone o repositório
git clone https://github.com/silvajeanderson165/fuga-na-floresta.git

# Entre na pasta
cd fuga-na-floresta

# Inicie um servidor local (necessário para módulos)
npx http-server . -p 8080

# Abra no navegador
# http://localhost:8080
```

---

## 🏆 Achievements

| Conquista | Condição |
|-----------|----------|
| 🥾 Primeiros Passos | Alcance 100 pontos |
| 🧭 Explorador | Alcance 500 pontos |
| ⚔️ Aventureiro | Alcance 1000 pontos |
| 🎖️ Veterano | Alcance 2500 pontos |
| 👑 Lendário | Alcance 5000 pontos |
| 💪 Persistente | Jogue 10 partidas |
| 🐆 Esquiva Felina | Desvie de uma onça |
| 🦁 Domador | Desvie de 5 onças |
| 🎁 Coletor | Pegue um power-up |
| 🔥 Combo Master | 10 desvios seguidos |

---

## 📄 Licença

MIT License — Sinta-se livre para usar, modificar e distribuir.

---

<p align="center">
  Feito com 💚 e muita floresta 🌿
</p>
