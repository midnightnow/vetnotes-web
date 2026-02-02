/**
 * Particle Pool Manager
 * Reuses particle objects to reduce garbage collection pressure
 */

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    text: string;
    life: number;
    size: number;
    color: string;
    type: "word" | "symbol" | "trigram";
    active: boolean;
}

export class ParticlePool {
    private pool: Particle[] = [];
    private activeParticles: Particle[] = [];
    private maxParticles: number;
    private poolSize: number;

    constructor(maxParticles: number = 500, poolSize: number = 1000) {
        this.maxParticles = maxParticles;
        this.poolSize = poolSize;
        this.initializePool();
    }

    /**
     * Pre-allocate particle objects
     */
    private initializePool() {
        for (let i = 0; i < this.poolSize; i++) {
            this.pool.push(this.createParticle());
        }
    }

    /**
     * Create a new particle object
     */
    private createParticle(): Particle {
        return {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            text: "",
            life: 0,
            size: 0,
            color: "#fff",
            type: "word",
            active: false
        };
    }

    /**
     * Get a particle from the pool
     */
    acquire(config: Partial<Particle>): Particle | null {
        // Enforce max particles limit
        if (this.activeParticles.length >= this.maxParticles) {
            // Remove oldest particle (FIFO)
            const oldest = this.activeParticles.shift();
            if (oldest) {
                this.release(oldest);
            }
        }

        // Get particle from pool or create new one
        let particle = this.pool.pop();
        if (!particle) {
            particle = this.createParticle();
        }

        // Configure particle
        Object.assign(particle, config, { active: true });
        this.activeParticles.push(particle);

        return particle;
    }

    /**
     * Return particle to pool
     */
    release(particle: Particle) {
        particle.active = false;
        particle.life = 0;

        // Return to pool if under size limit
        if (this.pool.length < this.poolSize) {
            this.pool.push(particle);
        }
    }

    /**
     * Update all active particles
     */
    update(deltaTime: number, gravity: number = 0.25) {
        const deadParticles: Particle[] = [];

        for (const particle of this.activeParticles) {
            if (!particle.active) continue;

            // Update position
            particle.x += particle.vx * deltaTime * 60; // Normalize to 60fps
            particle.y += particle.vy * deltaTime * 60;
            particle.vy += gravity * deltaTime * 60;

            // Update life
            particle.life -= 0.015 * deltaTime * 60;

            // Mark dead particles
            if (particle.life <= 0) {
                deadParticles.push(particle);
            }
        }

        // Remove dead particles
        for (const dead of deadParticles) {
            const index = this.activeParticles.indexOf(dead);
            if (index > -1) {
                this.activeParticles.splice(index, 1);
                this.release(dead);
            }
        }
    }

    /**
     * Get all active particles
     */
    getActive(): Particle[] {
        return this.activeParticles.filter(p => p.active);
    }

    /**
     * Clear all particles
     */
    clear() {
        for (const particle of this.activeParticles) {
            this.release(particle);
        }
        this.activeParticles = [];
    }

    /**
     * Get pool statistics
     */
    getStats() {
        return {
            active: this.activeParticles.length,
            pooled: this.pool.length,
            maxParticles: this.maxParticles,
            poolSize: this.poolSize,
            utilization: (this.activeParticles.length / this.maxParticles) * 100
        };
    }
}
