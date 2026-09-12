tailwind.config = {
    theme: {
        extend: {
            colors: {
                brand: {
                    base: '#030712',
                    surface: '#0f172a',
                    cyan: '#06b6d4',
                    cyanGlow: '#22d3ee',
                }
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'float-delayed': 'float 6s ease-in-out 3s infinite',
                'data-stream': 'dataStream 20s linear infinite',
                'pulse-glow': 'pulseGlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0) rotate(0)' },
                    '50%': { transform: 'translateY(-12px) rotate(1deg)' },
                },
                dataStream: {
                    '0%': { transform: 'translateY(0)' },
                    '100%': { transform: 'translateY(-100%)' }
                },
                pulseGlow: {
                    '0%, 100%': { filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.5))' },
                    '50%': { filter: 'drop-shadow(0 0 25px rgba(6,182,212,0.8))' }
                },
                fadeInUp: {
                    from: { opacity: 0, transform: 'translateY(16px)' },
                    to: { opacity: 1, transform: 'translateY(0)' }
                }
            }
        }
    }
}
