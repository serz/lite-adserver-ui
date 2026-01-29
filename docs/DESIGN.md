# Design system

## Primary colors (Electric violet → blue gradient)

Tenant primary palette for buttons, links, active states, and accents.

| Token   | Hex       | Usage                          |
|---------|-----------|--------------------------------|
| Primary | `#7C3AED` | Buttons, links, active states  |
| Hover   | `#6D28D9` | Hover state for primary UI     |
| Glow    | —         | Subtle violet shadow (see CSS) |

### CSS variables

Defined in `app/globals.css` and available via Tailwind:

- **Light:** `--primary` (Electric violet), `--primary-hover`
- **Dark:** Same hue with adjusted lightness for contrast
- **Glow:** `--glow-primary` — subtle violet box-shadow for focus/active

### Usage in components

- **Primary buttons:** `bg-primary text-primary-foreground hover:bg-primary-hover` (or use `primary` variant)
- **Active nav item:** `bg-primary/15` (pill at 15% opacity)
- **Focus/glow:** `shadow-[var(--glow-primary)]` or utility class `shadow-glow-primary`
- **Links:** `text-primary hover:text-primary-hover`

### Tailwind

Primary and primary-foreground are wired in `tailwind.config.ts`. Use `bg-primary`, `text-primary`, `bg-primary/15`, etc. Hover uses the same primary with darker shade via CSS.
