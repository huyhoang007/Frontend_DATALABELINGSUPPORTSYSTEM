/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', // Manual dark mode (though we default to dark)
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['ui-mono', 'monospace'], // Placeholder for ui-mono
            },
            colors: {
                // Semantic roles - UNIFIED to Soft Indigo (Primary) for calm look
                // We keep keys for backward compatibility but map them to the same calm source
                annotator: {
                    primary: "hsl(var(--primary) / <alpha-value>)",
                },
                reviewer: {
                    primary: "hsl(var(--primary) / <alpha-value>)",
                },
                manager: {
                    primary: "hsl(var(--primary) / <alpha-value>)",
                },
                admin: {
                    primary: "hsl(var(--primary) / <alpha-value>)",
                },

                // 2. Semantic Token System (Shadcn-compatible naming)
                background: "hsl(var(--background) / <alpha-value>)",
                foreground: "hsl(var(--foreground) / <alpha-value>)",

                card: {
                    DEFAULT: "hsl(var(--card) / <alpha-value>)",
                    foreground: "hsl(var(--card-foreground) / <alpha-value>)",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover) / <alpha-value>)",
                    foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
                },
                primary: {
                    DEFAULT: "hsl(var(--primary) / <alpha-value>)",
                    foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
                    foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted) / <alpha-value>)",
                    foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent) / <alpha-value>)",
                    foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
                    foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
                },
                border: "hsl(var(--border) / <alpha-value>)",
                input: "hsl(var(--input) / <alpha-value>)",
                ring: "hsl(var(--ring) / <alpha-value>)",


                dark: {
                    bg: {
                        base: '#0b0e14',
                        canvas: '#0b0e14',
                    },
                    surface: {
                        panel: '#1c212b',
                        toolbar: '#111318',
                    },
                    text: {
                        primary: '#ffffff',
                        secondary: '#9da6b9',
                        muted: '#64748b',
                    },
                    border: {
                        base: '#2d3544',
                        muted: 'rgba(255,255,255,0.08)',
                    }
                },
            },
            borderRadius: {
                sm: '6px',
                md: '8px',
                lg: '12px',
                xl: '16px',
                pill: '9999px',
            },
            spacing: {
                // Extended spacing if needed, but Tailwind default covers many 4px intervals (1=4px)
            },
            fontSize: {
                h1: ['32px', { lineHeight: '40px', fontWeight: '800' }],
                h2: ['24px', { lineHeight: '32px', fontWeight: '800' }],
                h3: ['16px', { lineHeight: '24px', fontWeight: '700' }],
                body: ['14px', { lineHeight: '20px', fontWeight: '500' }],
                caption: ['12px', { lineHeight: '16px', fontWeight: '600' }],
                micro: ['10px', { lineHeight: '14px', fontWeight: '600' }],
            },
            letterSpacing: {
                wide: '0.05em', // Tracking for uppercase
            },
            transitionDuration: {
                fast: '150ms',
                base: '200ms',
                slow: '250ms',
            },
            transitionTimingFunction: {
                'ease-out': 'ease-out',
            }
        },
    },
    plugins: [],
}
