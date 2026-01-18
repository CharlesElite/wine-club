// Wine Club - Reveal Animations Module

const RevealAnimations = {
    // Sound effects (using Web Audio API)
    audioContext: null,

    // Initialize audio context
    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    },

    // Play drumroll sound
    playDrumroll(duration = 3000) {
        try {
            const ctx = this.initAudio();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(100, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration / 1000);

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration / 1000);
        } catch (e) {
            console.log('Audio not supported');
        }
    },

    // Play cork pop sound
    playCorkPop() {
        try {
            const ctx = this.initAudio();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch (e) {
            console.log('Audio not supported');
        }
    },

    // Play fanfare
    playFanfare() {
        try {
            const ctx = this.initAudio();
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            const duration = 0.2;

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.value = freq;

                gain.gain.setValueAtTime(0.3, ctx.currentTime + i * duration);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i + 1) * duration);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(ctx.currentTime + i * duration);
                osc.stop(ctx.currentTime + (i + 1) * duration + 0.1);
            });
        } catch (e) {
            console.log('Audio not supported');
        }
    },

    // Create confetti effect
    createConfetti(container, count = 100) {
        const colors = ['#722F37', '#C9A227', '#4A7C59', '#B76E79', '#F7E7CE', '#FFD700'];

        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.cssText = `
                position: absolute;
                width: ${Math.random() * 10 + 5}px;
                height: ${Math.random() * 15 + 10}px;
                background-color: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}vw;
                top: -20px;
                animation: confettiFall ${Math.random() * 2 + 2}s linear forwards;
                animation-delay: ${Math.random() * 0.5}s;
                transform: rotate(${Math.random() * 360}deg);
            `;

            container.appendChild(confetti);

            // Remove after animation
            setTimeout(() => confetti.remove(), 4500);
        }
    },

    // Animate score counter
    animateScore(element, targetScore, duration = 1500) {
        const startTime = performance.now();
        const startValue = 0;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease out)
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (targetScore - startValue) * eased;

            element.textContent = currentValue.toFixed(1);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },

    // Create typing effect
    typeText(element, text, speed = 50) {
        return new Promise((resolve) => {
            element.textContent = '';
            let index = 0;

            const type = () => {
                if (index < text.length) {
                    element.textContent += text.charAt(index);
                    index++;
                    setTimeout(type, speed);
                } else {
                    resolve();
                }
            };

            type();
        });
    },

    // Animate element with class
    animate(element, animationClass, duration = 1000) {
        return new Promise((resolve) => {
            element.classList.add(animationClass);
            setTimeout(() => {
                resolve();
            }, duration);
        });
    },

    // Create spotlight effect
    createSpotlight(container) {
        const spotlight = document.createElement('div');
        spotlight.className = 'spotlight';
        spotlight.style.cssText = `
            position: absolute;
            width: 400px;
            height: 400px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            pointer-events: none;
            animation: spotlightMove 10s ease-in-out infinite;
        `;
        container.appendChild(spotlight);
        return spotlight;
    },

    // Shake effect
    shake(element, intensity = 5, duration = 500) {
        const originalTransform = element.style.transform;
        const startTime = performance.now();

        const shake = (currentTime) => {
            const elapsed = currentTime - startTime;
            if (elapsed < duration) {
                const x = (Math.random() - 0.5) * intensity * 2;
                const y = (Math.random() - 0.5) * intensity * 2;
                element.style.transform = `translate(${x}px, ${y}px)`;
                requestAnimationFrame(shake);
            } else {
                element.style.transform = originalTransform;
            }
        };

        requestAnimationFrame(shake);
    },

    // Pulse effect
    pulse(element, scale = 1.1, duration = 300) {
        element.style.transition = `transform ${duration / 2}ms ease`;
        element.style.transform = `scale(${scale})`;

        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, duration / 2);
    },

    // Create floating emoji reaction
    createFloatingEmoji(container, emoji, x, y) {
        const emojiEl = document.createElement('div');
        emojiEl.textContent = emoji;
        emojiEl.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            font-size: 2rem;
            pointer-events: none;
            animation: floatUp 2s ease-out forwards;
            z-index: 1000;
        `;

        container.appendChild(emojiEl);

        setTimeout(() => emojiEl.remove(), 2000);
    },

    // Full reveal sequence for a wine
    async runRevealSequence(wine, elements, options = {}) {
        const {
            onDrumroll,
            onBagLift,
            onNameReveal,
            onContributorReveal,
            onScoreReveal,
            onComplete
        } = options;

        // Step 1: Drumroll (3s)
        this.playDrumroll(3000);
        if (onDrumroll) onDrumroll();
        await this.delay(3000);

        // Step 2: Bag lift (2s)
        this.playCorkPop();
        if (onBagLift) onBagLift();
        if (elements.bag) {
            await this.animate(elements.bag, 'bag-lift', 2000);
        }

        // Step 3: Wine reveal (2s)
        if (onNameReveal) onNameReveal();
        if (elements.info) {
            elements.info.style.opacity = '1';
            await this.animate(elements.info, 'info-slide', 800);
        }
        await this.delay(1000);

        // Step 4: Contributor reveal (1s)
        if (onContributorReveal) onContributorReveal();
        if (elements.contributor) {
            elements.contributor.style.opacity = '1';
            await this.animate(elements.contributor, 'contributor-reveal', 600);
        }
        await this.delay(500);

        // Step 5: Score reveal (2s)
        if (onScoreReveal) onScoreReveal();
        if (elements.ratings) {
            elements.ratings.style.opacity = '1';
        }
        if (elements.scoreCounter) {
            this.animateScore(elements.scoreCounter, wine.avgScore);
        }
        await this.delay(1500);

        // Step 6: Show comments
        if (elements.comments && wine.comments) {
            for (const comment of wine.comments.slice(0, 3)) {
                const commentEl = document.createElement('div');
                commentEl.className = 'reveal-comment';
                commentEl.textContent = `"${comment.comment}" - ${comment.user}`;
                elements.comments.appendChild(commentEl);
                await this.delay(400);
            }
        }

        // Step 7: Winner celebration
        if (wine.isWinner && elements.winnerBadge) {
            this.playFanfare();
            elements.winnerBadge.classList.add('winner-badge--show');
            if (elements.confettiContainer) {
                this.createConfetti(elements.confettiContainer, 150);
            }
        }

        if (onComplete) onComplete();
    },

    // Helper delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Add CSS keyframes dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateY(-100px) scale(1.5);
        }
    }
`;
document.head.appendChild(style);

// Export for use in other modules
window.RevealAnimations = RevealAnimations;
