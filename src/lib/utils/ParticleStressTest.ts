/**
 * Particle Pool Stress Test Suite
 * Finds the breaking point of the ParticlePool under various load conditions
 */

import { ParticlePool } from './ParticlePool';

export interface StressTestResult {
    testName: string;
    particleCount: number;
    avgFrameTime: number;
    minFrameTime: number;
    maxFrameTime: number;
    fps: number;
    droppedFrames: number;
    gcEvents: number;
    memoryUsed: number;
    passed: boolean;
    notes: string;
}

export class ParticleStressTest {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private results: StressTestResult[] = [];
    private performanceObserver: PerformanceObserver | null = null;
    private gcEventCount = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.setupGCMonitoring();
    }

    /**
     * Monitor garbage collection events (Chrome only)
     */
    private setupGCMonitoring() {
        if ('PerformanceObserver' in window) {
            try {
                this.performanceObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.entryType === 'measure' && entry.name.includes('gc')) {
                            this.gcEventCount++;
                        }
                    }
                });
                this.performanceObserver.observe({ entryTypes: ['measure'] });
            } catch (e) {
                console.warn('GC monitoring not available:', e);
            }
        }
    }

    /**
     * Test 1: Baseline - Normal Load (500 particles)
     */
    async testBaseline(): Promise<StressTestResult> {
        const pool = new ParticlePool(500, 1000);
        const particleCount = 250; // 50% utilization

        return this.runTest('Baseline (50% Utilization)', pool, particleCount, 3000);
    }

    /**
     * Test 2: High Load (95% utilization)
     */
    async testHighLoad(): Promise<StressTestResult> {
        const pool = new ParticlePool(500, 1000);
        const particleCount = 475; // 95% utilization

        return this.runTest('High Load (95% Utilization)', pool, particleCount, 3000);
    }

    /**
     * Test 3: Overload (150% utilization - triggers FIFO eviction)
     */
    async testOverload(): Promise<StressTestResult> {
        const pool = new ParticlePool(500, 1000);
        const particleCount = 750; // 150% - should trigger eviction

        return this.runTest('Overload (FIFO Eviction)', pool, particleCount, 3000);
    }

    /**
     * Test 4: Extreme Load (1000 particles)
     */
    async testExtreme(): Promise<StressTestResult> {
        const pool = new ParticlePool(1000, 2000);
        const particleCount = 1000;

        return this.runTest('Extreme Load (1000 particles)', pool, particleCount, 3000);
    }

    /**
     * Test 5: GPU Bottleneck (2000 particles)
     */
    async testGPUBottleneck(): Promise<StressTestResult> {
        const pool = new ParticlePool(2000, 4000);
        const particleCount = 2000;

        return this.runTest('GPU Bottleneck (2000 particles)', pool, particleCount, 3000);
    }

    /**
     * Test 6: Burst Load (rapid acquire/release cycles)
     */
    async testBurstLoad(): Promise<StressTestResult> {
        const pool = new ParticlePool(500, 1000);

        return this.runBurstTest('Burst Load (Rapid Cycles)', pool, 3000);
    }

    /**
     * Test 7: Memory Leak Detection (long-running stability)
     */
    async testMemoryLeak(): Promise<StressTestResult> {
        const pool = new ParticlePool(500, 1000);
        const particleCount = 400;

        return this.runTest('Memory Leak Detection (10s)', pool, particleCount, 10000);
    }

    /**
     * Run a standard particle test
     */
    private async runTest(
        testName: string,
        pool: ParticlePool,
        particleCount: number,
        durationMs: number
    ): Promise<StressTestResult> {
        console.log(`\n🧪 Running: ${testName}`);

        // Reset metrics
        this.gcEventCount = 0;
        const frameTimes: number[] = [];
        let droppedFrames = 0;
        const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

        // Spawn particles
        for (let i = 0; i < particleCount; i++) {
            pool.acquire({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                text: ['A', 'B', 'C', 'Δ', 'Σ'][Math.floor(Math.random() * 5)],
                life: 2.0 + Math.random() * 2.0,
                size: 12 + Math.random() * 12,
                color: '#ffffff',
                type: 'word',
                active: true,
            });
        }

        // Run animation loop
        const startTime = performance.now();
        let lastFrameTime = startTime;
        let frameCount = 0;

        return new Promise((resolve) => {
            const animate = () => {
                const now = performance.now();
                const deltaTime = (now - lastFrameTime) / 1000;
                const frameTime = now - lastFrameTime;

                frameTimes.push(frameTime);
                lastFrameTime = now;
                frameCount++;

                // Track dropped frames (>16.67ms = below 60fps)
                if (frameTime > 16.67) {
                    droppedFrames++;
                }

                // Update particles
                pool.update(deltaTime, 0.25);

                // Render particles
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                const activeParticles = pool.getActive();

                activeParticles.forEach((p) => {
                    this.ctx.save();
                    this.ctx.globalAlpha = p.life / 4.0; // Normalize to 0-1
                    this.ctx.font = `${p.size}px monospace`;
                    this.ctx.fillStyle = p.color;
                    this.ctx.fillText(p.text, p.x, p.y);
                    this.ctx.restore();
                });

                // Continue or finish
                if (now - startTime < durationMs) {
                    requestAnimationFrame(animate);
                } else {
                    // Calculate metrics
                    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
                    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
                    const minFrameTime = Math.min(...frameTimes);
                    const maxFrameTime = Math.max(...frameTimes);
                    const fps = 1000 / avgFrameTime;
                    const memoryUsed = endMemory - startMemory;

                    const result: StressTestResult = {
                        testName,
                        particleCount,
                        avgFrameTime: parseFloat(avgFrameTime.toFixed(2)),
                        minFrameTime: parseFloat(minFrameTime.toFixed(2)),
                        maxFrameTime: parseFloat(maxFrameTime.toFixed(2)),
                        fps: parseFloat(fps.toFixed(2)),
                        droppedFrames,
                        gcEvents: this.gcEventCount,
                        memoryUsed,
                        passed: fps >= 55 && droppedFrames < frameCount * 0.05, // 55fps minimum, <5% dropped
                        notes: this.generateNotes(fps, droppedFrames, frameCount, pool),
                    };

                    this.results.push(result);
                    this.logResult(result);
                    resolve(result);
                }
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Run burst test (rapid acquire/release)
     */
    private async runBurstTest(
        testName: string,
        pool: ParticlePool,
        durationMs: number
    ): Promise<StressTestResult> {
        console.log(`\n🧪 Running: ${testName}`);

        this.gcEventCount = 0;
        const frameTimes: number[] = [];
        let droppedFrames = 0;
        const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

        const startTime = performance.now();
        let lastFrameTime = startTime;
        let frameCount = 0;
        let burstCycle = 0;

        return new Promise((resolve) => {
            const animate = () => {
                const now = performance.now();
                const deltaTime = (now - lastFrameTime) / 1000;
                const frameTime = now - lastFrameTime;

                frameTimes.push(frameTime);
                lastFrameTime = now;
                frameCount++;

                if (frameTime > 16.67) droppedFrames++;

                // Burst pattern: spawn 50 particles every 10 frames
                if (frameCount % 10 === 0) {
                    for (let i = 0; i < 50; i++) {
                        pool.acquire({
                            x: Math.random() * this.canvas.width,
                            y: Math.random() * this.canvas.height,
                            vx: (Math.random() - 0.5) * 15,
                            vy: (Math.random() - 0.5) * 15,
                            text: '💥',
                            life: 0.5,
                            size: 16,
                            color: '#ff6b6b',
                            type: 'word',
                            active: true,
                        });
                    }
                    burstCycle++;
                }

                pool.update(deltaTime, 0.25);

                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                const activeParticles = pool.getActive();

                activeParticles.forEach((p) => {
                    this.ctx.save();
                    this.ctx.globalAlpha = p.life / 2.0;
                    this.ctx.font = `${p.size}px monospace`;
                    this.ctx.fillStyle = p.color;
                    this.ctx.fillText(p.text, p.x, p.y);
                    this.ctx.restore();
                });

                if (now - startTime < durationMs) {
                    requestAnimationFrame(animate);
                } else {
                    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
                    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
                    const fps = 1000 / avgFrameTime;

                    const result: StressTestResult = {
                        testName,
                        particleCount: burstCycle * 50,
                        avgFrameTime: parseFloat(avgFrameTime.toFixed(2)),
                        minFrameTime: parseFloat(Math.min(...frameTimes).toFixed(2)),
                        maxFrameTime: parseFloat(Math.max(...frameTimes).toFixed(2)),
                        fps: parseFloat(fps.toFixed(2)),
                        droppedFrames,
                        gcEvents: this.gcEventCount,
                        memoryUsed: endMemory - startMemory,
                        passed: fps >= 55 && droppedFrames < frameCount * 0.1,
                        notes: `${burstCycle} burst cycles, peak utilization: ${pool.getStats().utilization.toFixed(1)}%`,
                    };

                    this.results.push(result);
                    this.logResult(result);
                    resolve(result);
                }
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Generate diagnostic notes
     */
    private generateNotes(fps: number, droppedFrames: number, totalFrames: number, pool: ParticlePool): string {
        const stats = pool.getStats();
        const dropRate = ((droppedFrames / totalFrames) * 100).toFixed(1);

        if (fps >= 60) return `Excellent performance. Drop rate: ${dropRate}%`;
        if (fps >= 55) return `Good performance. Drop rate: ${dropRate}%`;
        if (fps >= 45) return `Acceptable performance. Drop rate: ${dropRate}%`;
        if (fps >= 30) return `Poor performance. Drop rate: ${dropRate}%. Consider reducing particles.`;
        return `Critical performance issues. Drop rate: ${dropRate}%. GPU bottleneck likely.`;
    }

    /**
     * Log result to console
     */
    private logResult(result: StressTestResult) {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${result.testName}`);
        console.log(`  Particles: ${result.particleCount}`);
        console.log(`  FPS: ${result.fps} (min: ${(1000 / result.maxFrameTime).toFixed(1)}, max: ${(1000 / result.minFrameTime).toFixed(1)})`);
        console.log(`  Dropped Frames: ${result.droppedFrames}`);
        console.log(`  GC Events: ${result.gcEvents}`);
        console.log(`  Memory: ${(result.memoryUsed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Notes: ${result.notes}`);
    }

    /**
     * Run all tests
     */
    async runAllTests(): Promise<StressTestResult[]> {
        console.log('🚀 Starting Particle Pool Stress Test Suite\n');
        console.log('='.repeat(60));

        await this.testBaseline();
        await this.testHighLoad();
        await this.testOverload();
        await this.testExtreme();
        await this.testGPUBottleneck();
        await this.testBurstLoad();
        await this.testMemoryLeak();

        console.log('\n' + '='.repeat(60));
        console.log('📊 Test Suite Complete\n');
        this.printSummary();

        return this.results;
    }

    /**
     * Print summary table
     */
    private printSummary() {
        console.log('Summary:');
        console.table(
            this.results.map((r) => ({
                Test: r.testName,
                Particles: r.particleCount,
                FPS: r.fps,
                'Dropped %': ((r.droppedFrames / (r.avgFrameTime * 60)) * 100).toFixed(1),
                'GC Events': r.gcEvents,
                'Memory (MB)': (r.memoryUsed / 1024 / 1024).toFixed(2),
                Status: r.passed ? '✅' : '❌',
            }))
        );

        const passCount = this.results.filter((r) => r.passed).length;
        const totalCount = this.results.length;
        console.log(`\nPassed: ${passCount}/${totalCount}`);

        // Find breaking point
        const failedTests = this.results.filter((r) => !r.passed);
        if (failedTests.length > 0) {
            const breakingPoint = failedTests[0];
            console.log(`\n⚠️  Breaking Point: ${breakingPoint.particleCount} particles (${breakingPoint.fps} fps)`);
        } else {
            console.log('\n✅ All tests passed! System is highly performant.');
        }
    }

    /**
     * Get results
     */
    getResults(): StressTestResult[] {
        return this.results;
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
    }
}
