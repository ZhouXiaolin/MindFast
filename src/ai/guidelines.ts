export interface SeedWorkspaceFile {
  path: string;
  content: string;
}

export const GUIDELINE_SEED_FILES: SeedWorkspaceFile[] = [
  {
    path: "guidelines/index.md",
    content: `# Widget and artifact guidelines

These files define the generation rules for visual output in this workspace.

Workflow:
1. Read guidelines/manifest.json.
2. Identify the output type you are about to generate.
3. Read every guideline file listed for that type.
4. Only then write or update files under widgets/ or artifacts/.

Guideline files are the source of truth for structure, streaming order, host compatibility, and visual rules.
`,
  },
  {
    path: "guidelines/manifest.json",
    content: `{
  "version": 1,
  "default": [
    "guidelines/core.md"
  ],
  "types": {
    "widget_html": [
      "guidelines/core.md",
      "guidelines/streaming.md",
      "guidelines/interactive.md"
    ],
    "widget_chart": [
      "guidelines/core.md",
      "guidelines/streaming.md",
      "guidelines/interactive.md",
      "guidelines/chart.md"
    ],
    "widget_mockup": [
      "guidelines/core.md",
      "guidelines/mockup.md"
    ],
    "widget_svg_diagram": [
      "guidelines/core.md",
      "guidelines/diagram.md",
      "guidelines/svg-classes.md"
    ],
    "widget_art": [
      "guidelines/core.md",
      "guidelines/art.md"
    ],
    "artifact_html": [
      "guidelines/core.md",
      "guidelines/streaming.md",
      "guidelines/interactive.md"
    ],
    "artifact_svg": [
      "guidelines/core.md",
      "guidelines/diagram.md",
      "guidelines/svg-classes.md"
    ]
  }
}`,
  },
  {
    path: "guidelines/core.md",
    content: `# Core rules

- Widgets live under widgets/. Artifacts live under artifacts/.
- Read the relevant guideline files before writing or updating widget or artifact files.
- The tool output should contain only renderable content. Put explanation in normal assistant text, not inside the visual file.
- Prefer focused outputs. Do not cram multiple unrelated ideas into one widget or one artifact.
- Match the host surface. Avoid decorative chrome that fights the app UI.
- Use transparent or host-friendly outer layout. Do not hardcode a full-page dark background unless the visual itself requires it.
- Keep typography readable. Do not go below 11px.
- Prefer simple HTML, SVG, and vanilla JavaScript. Do not introduce frameworks.
- Use semantic structure and stable IDs only when the script actually needs them.
- Do not modify files under guidelines/ unless the user explicitly asks to change the guideline system.
`,
  },
  {
    path: "guidelines/streaming.md",
    content: `# Streaming HTML rules

- For HTML output, order content as: style, markup, then script last.
- Keep style blocks short. Use inline styles when that improves mid-stream stability.
- Do not rely on JavaScript for the initial visible structure.
- During streaming, the host may show partial HTML before scripts finish.
- Dynamic behavior should be initialized by the final script pass, not by partial intermediate output.
- If the output uses canvas, animation loops, timers, or external libraries, make sure the script can initialize cleanly from the final DOM state.
- Avoid hidden sections, tabs, carousels, and fixed-position overlays in the initial stream.
- External scripts must come from allowed CDNs only when truly needed.
`,
  },
  {
    path: "guidelines/interactive.md",
    content: `# Interactive widget rules

- Build one clear interaction model per widget.
- Use native controls: button, input, select, textarea, canvas, svg.
- Keep controls close to the output they affect.
- Round any number shown to the user. Avoid floating-point noise.
- Keep state local and simple. Prefer a single script block with straightforward event wiring.
- Do not require network access for the core interaction.
- Make the default state meaningful before the user clicks anything.
- For explainers, show the essential visual inline and keep prose outside the widget file.
`,
  },
  {
    path: "guidelines/chart.md",
    content: `# Chart rules

- Wrap each canvas in a container with an explicit height.
- Do not set CSS height directly on the canvas element when using Chart.js responsive mode.
- If you load Chart.js from a CDN, use a named init function plus an onload path and a fallback if window.Chart already exists.
- Keep legends outside the canvas when possible.
- Use readable axis labels and enough vertical space for the number of bars or series shown.
- Favor clarity over decoration. Avoid gradients, glow, and heavy shadows.
- If the chart needs summary metrics, place them above or beside the chart as simple cards.
`,
  },
  {
    path: "guidelines/diagram.md",
    content: `# SVG diagram rules

- Use one svg per file output unless the user explicitly needs a different structure.
- Prefer a stable viewBox and keep content inside safe margins.
- Keep labels short. If a label does not fit, shorten it or split the diagram.
- Do not route arrows through unrelated nodes.
- Use sparse color intentionally. Color should encode meaning, not just variety.
- Default to sentence case labels.
- For complex systems, prefer multiple smaller diagrams over one dense diagram.
- Flowcharts should stay directional and legible. Illustrative diagrams should privilege intuition over exhaustive labeling.
`,
  },
  {
    path: "guidelines/mockup.md",
    content: `# Mockup rules

- Mockups should feel like product UI, not posters.
- Use simple cards, panels, lists, and forms with restrained borders and spacing.
- Contained mockups may sit inside a surface or frame. Full-width dashboards do not need extra framing.
- Avoid decorative effects that distract from hierarchy.
- Keep the hierarchy obvious: title area, content area, secondary metadata.
- If a recommendation or featured state exists, signal it with border emphasis or a small badge, not a radically different card design.
`,
  },
  {
    path: "guidelines/art.md",
    content: `# Art rules

- Art may be more expressive than product UI, but it still needs to render cleanly in the host.
- Favor vector or lightweight HTML/SVG techniques over heavy assets.
- Use bold composition deliberately. Do not add explanation text inside the visual.
- If color is the main idea, ensure contrast still works in the host environment.
- Keep the output self-contained and deterministic when possible.
`,
  },
  {
    path: "guidelines/svg-classes.md",
    content: `# SVG host classes

Use preloaded SVG classes when available:

- t: primary text
- ts: secondary text
- th: stronger label text
- box: neutral node box
- node: interactive or hoverable group
- arr: connector line
- leader: dashed leader line
- c-blue, c-teal, c-amber, c-green, c-red, c-purple, c-coral, c-pink, c-gray: semantic color ramps

When these classes are available, prefer them over re-declaring the same styles in every SVG file.
`,
  },
];

