export interface SeedWorkspaceFile {
  path: string;
  content: string;
}

export const GUIDELINE_SEED_FILES: SeedWorkspaceFile[] = [
  {
    path: "guidelines/index.md",
    content: `# Widget Guidelines

Before generating HTML files under widgets/:
1. Read guidelines/meta.json
2. Choose relevant categories based on the widget you are about to generate (core is always required)
3. Read only the guideline files you chose
4. Generate the complete widget in a single write call
`,
  },
  {
    path: "guidelines/meta.json",
    content: `{
  "version": 2,
  "categories": {
    "core": "REQUIRED. Output structure, host adaptation, tool usage, one-shot write rule",
    "layout": "Container sizing, spacing, alignment, flex/grid, responsive containers",
    "color": "Palette constraints, contrast ratios, semantic colors, dark-mode safety",
    "typography": "Font size hierarchy, line height, readability floor, CJK considerations",
    "streaming": "HTML render order, mid-stream stability, script initialization timing",
    "interactive": "Event binding, native controls, local state, default-state design",
    "animation": "CSS transitions, micro-interactions, performance budgets, reduced-motion",
    "chart": "Chart.js setup, canvas containers, axis labels, legend placement",
    "data-display": "Stat cards, KPIs, tables, ranked lists, progress indicators",
    "form": "Input controls, validation feedback, form layout, accessibility",
    "diagram": "SVG viewBox, node/edge layout, label rules, color semantics",
    "mockup": "Product UI fidelity, card/panel hierarchy, restrained decoration",
    "art": "Creative visuals, generative art, bold composition, self-contained output",
    "canvas": "Canvas 2D bindng, pixel ops, render loops, HiDPI scaling",
    "game": "Game loop, collision, scoring, level state, keyboard/touch input",
    "svg-host": "Pre-loaded SVG host classes quick reference"
  }
}`,
  },
  {
    path: "guidelines/core.md",
    content: `# Core

- Widgets go under widgets/
- Widget HTML must be written in a single write call — never split across multiple writes or edits
- Document structure: <html><head><style>...</style></head><body>...markup...<script>...</script></body></html>
- Output only renderable content; put explanations in assistant text, not in the file
- Use transparent or host-friendly outer backgrounds; do not hardcode full-page dark unless the visual requires it
- Prefer vanilla HTML/CSS/JS — no frameworks
- Do not modify files under guidelines/ unless the user explicitly requests it
`,
  },
  {
    path: "guidelines/layout.md",
    content: `# Layout

- Use flex or grid for layout; avoid float and table hacks
- Minimum container width 280px; do not assume full-screen
- Inner padding 12-16px, element gap 8-12px
- Let height grow naturally; avoid fixed heights unless the visual demands it
- Center with margin: 0 auto or flex justify-content
`,
  },
  {
    path: "guidelines/color.md",
    content: `# Color

- Limit palette to 2-3 primary colors plus neutrals
- Maintain 4.5:1 minimum contrast for text
- Use color to encode meaning, not decoration
- Avoid pure black (#000) on pure white (#fff); prefer off-black on off-white
- Test legibility on both light and dark host backgrounds
`,
  },
  {
    path: "guidelines/typography.md",
    content: `# Typography

- Never go below 11px for any visible text
- Heading hierarchy: one h1, use size/weight difference not color alone
- Body line-height 1.4-1.6 for readability
- Use system font stack unless the design specifically calls for a custom font
- For CJK content, add 0.05-0.1em letter-spacing on body text
`,
  },
  {
    path: "guidelines/streaming.md",
    content: `# Streaming

- Order content: <style> first, then markup, then <script> last
- Do not rely on JavaScript for initial visible structure
- Use inline styles where they improve mid-stream visual stability
- Canvas, animations, and timers must initialize cleanly from the final DOM state
- Avoid hidden sections, tabs, carousels, and fixed overlays in the initial stream
- External scripts from CDN only when truly necessary
`,
  },
  {
    path: "guidelines/interactive.md",
    content: `# Interactive

- One clear interaction model per widget
- Use native controls: button, input, select, textarea, canvas, svg
- Keep controls visually close to the output they affect
- Make the default state meaningful before any user interaction
- Keep state in a single script block with straightforward event wiring
- Do not require network access for core interaction
`,
  },
  {
    path: "guidelines/animation.md",
    content: `# Animation

- Use CSS transitions (150-300ms) for state changes; avoid instant flips
- Limit JS-driven animation to canvas or cases CSS cannot handle
- Respect prefers-reduced-motion: disable non-essential motion
- No more than 2 simultaneous animated properties per element
- Avoid layout-triggering animations (top/left/width/height); prefer transform and opacity
`,
  },
  {
    path: "guidelines/chart.md",
    content: `# Chart

- Wrap canvas in a container with explicit height; do not set CSS height on canvas directly in responsive mode
- Load Chart.js via CDN with a named init function + onload guard; fall back if window.Chart exists
- Keep legends outside the canvas when possible
- Use readable axis labels with enough vertical space for bar counts
- Favor clarity over decoration — no gradients, glow, or heavy shadows
- Place summary metrics above or beside the chart as simple cards
`,
  },
  {
    path: "guidelines/data-display.md",
    content: `# Data Display

- Stat cards: large number, small label, optional trend indicator
- Tables: striped rows or subtle borders, sticky header for long lists
- Ranked lists: clear position marker, consistent row height
- KPIs: group related metrics; max 4-6 per row
- Progress: use native <progress> or a simple bar div; label the percentage
`,
  },
  {
    path: "guidelines/form.md",
    content: `# Form

- Label every input; prefer <label> wrapping the control
- Show validation feedback inline, adjacent to the field
- Use appropriate input types: email, number, date, etc.
- Group related fields with fieldset or visual spacing
- Provide a clear primary action button; disable it during submission
- Keep tab order logical; test with keyboard navigation
`,
  },
  {
    path: "guidelines/diagram.md",
    content: `# Diagram

- One SVG per file unless the user needs otherwise
- Set a stable viewBox; keep content within safe margins
- Keep labels short; shorten or split the diagram if labels overflow
- Do not route arrows through unrelated nodes
- Use color sparingly to encode meaning, not variety
- For complex systems, prefer multiple smaller diagrams over one dense diagram
`,
  },
  {
    path: "guidelines/mockup.md",
    content: `# Mockup

- Mockups should look like product UI, not posters
- Use cards, panels, lists, and forms with restrained borders and spacing
- Keep hierarchy obvious: title area, content area, secondary metadata
- Signal recommendations with border emphasis or a small badge, not a different card design
- Avoid decorative effects that distract from hierarchy
`,
  },
  {
    path: "guidelines/art.md",
    content: `# Art

- Art may be more expressive, but must still render cleanly in the host
- Favor vector or lightweight HTML/SVG/Canvas techniques
- Bold composition is encouraged; do not add explanation text inside the visual
- Ensure contrast works in the host environment
- Keep output self-contained and deterministic when possible
`,
  },
  {
    path: "guidelines/canvas.md",
    content: `# Canvas

- Get context once; cache the reference — do not call getContext repeatedly
- Scale for HiDPI: set canvas.width/height to logical size * devicePixelRatio, then CSS size to logical size
- Use requestAnimationFrame for render loops; cancel on cleanup
- Clear the full canvas each frame unless the effect is additive
- Keep the render function pure: read state, draw, done
`,
  },
  {
    path: "guidelines/game.md",
    content: `# Game

- Structure as init / update / render loop using requestAnimationFrame
- Separate game state from rendering — update logic must not depend on draw calls
- Support both keyboard and touch/click input
- Show score and status outside the canvas or as an overlay that does not block play
- Provide a restart mechanism without page reload
- Keep collision detection simple: AABB or circle; avoid pixel-perfect unless necessary
`,
  },
  {
    path: "guidelines/svg-host.md",
    content: `# SVG Host Classes

Pre-loaded classes available in the host environment:

- t: primary text
- ts: secondary text
- th: stronger label text
- box: neutral node box
- node: interactive/hoverable group
- arr: connector line
- leader: dashed leader line
- c-blue, c-teal, c-amber, c-green, c-red, c-purple, c-coral, c-pink, c-gray: semantic colors

Prefer these over re-declaring the same styles in every SVG file.
`,
  },
];
