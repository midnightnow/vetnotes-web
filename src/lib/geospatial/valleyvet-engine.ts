/**
 * VALLEY VET: GEOSPATIAL BIOSECURITY ENGINE
 * ==========================================
 * 
 * Google Maps integration with biosecurity risk visualization,
 * zoonotic alerting, and VR holodeck transitions.
 * 
 * Connects to VetNotes API backend for real-time geo-risk assessment.
 */

import { Loader } from '@googlemaps/js-api-loader';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type BiomeType = 'urban' | 'rural' | 'high_density_farm' | 'wilderness' | 'coastal';

// ============================================================================
// MIDDLE-LAYER™ EARTHMAP: Adventure Game Mechanics
// ============================================================================

/**
 * Three aesthetic modes for the same geographic data
 * - COZY_CLINIC: Kids/casual - Pokemon Go style, colorful, XP rewards
 * - MIDDLE_EARTH: Explorers - Lord of the Rings parchment, fog of war, tokens
 * - BIO_TACTICAL: Sovereign - High-res satellite, heatmaps, career certs
 */
export type GameLens = 'cozy' | 'adventure' | 'tactical';

/**
 * Reward tiers for gamification
 */
export interface RewardTier {
    xp: number;
    coins: number;
    badge?: string;
    certificationPoints?: number;  // For Northern Shield career progression
}

/**
 * Point of Discovery - citizen science observations
 * Used for invasive pest reporting, infrastructure faults, wildlife sightings
 */
export interface PointOfDiscovery {
    id: string;
    type: 'invasive_pest' | 'infrastructure_fault' | 'wildlife_sighting' | 'biosecurity_concern';
    subtype?: string;  // e.g., 'fire_ant', 'pothole', 'crocodile', 'hendra_bat'
    coordinates: { lat: number; lng: number };
    reportedBy: string;
    reportedAt: Date;
    photoUri?: string;
    aiClassification?: {
        species?: string;
        confidence: number;
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };

    // Quest mechanics
    questStatus: 'OPEN' | 'REPORTED' | 'VERIFIED' | 'RESOLVED';
    rewardTier: RewardTier;
    daysOutstanding: number;  // For Council Penalty Logic

    // Civic Ledger - accountability tracking
    civicLedger?: {
        assignedTo?: string;  // Council worker ID
        deadline?: Date;
        societalDebt: number;  // Accumulates if unresolved
        resolutionNotes?: string;
    };
}

/**
 * Quest definition for adventure mode
 */
export interface Quest {
    id: string;
    title: string;
    description: string;
    lens: GameLens;
    region: { lat: number; lng: number; radius: number };
    targetType: PointOfDiscovery['type'];
    targetSubtype?: string;
    reward: RewardTier;
    expiresAt?: Date;
    completionCount: number;
    maxCompletions?: number;
}

/**
 * Indigenous community cultural layer
 */
export interface CulturalLayer {
    traditionalOwners: string;
    languageGroup: string;
    seasonalCalendar: 'Wet' | 'Dry' | 'Build-up' | 'Flowering' | 'Cold' | 'Hot';
    restrictedAccessZones: Array<{ lat: number; lng: number }[]>;  // Polygon coordinates
    localTaxonomy: Map<string, string>;  // English → Local Language
    voiceArchive?: {
        recordings: number;
        languages: string[];
        lastUpdated: Date;
    };
}

export type SurveillanceType =
    | 'passive_vet_visits'
    | 'passive_abattoir'
    | 'active_traceback'
    | 'active_sentinel'
    | 'enhanced_door_to_door'
    | 'enhanced_serological';

export type ZoonoticDisease =
    | 'hendra'
    | 'rabies'
    | 'leptospirosis'
    | 'q_fever'
    | 'brucellosis'
    | 'japanese_encephalitis';

export interface ZoonoticRiskProfile {
    disease: ZoonoticDisease;
    transmission_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    exposure_route: string[];
    ppe_required: {
        gloves: boolean;
        mask: 'surgical' | 'n95' | 'p3';
        gown: boolean;
        eye_protection: boolean;
    };
    actions_required: string[];
    personal_protection: {
        vaccination_available: boolean;
        post_exposure_prophylaxis: boolean;
        quarantine_period_days: number;
    };
}

export interface BossBattle {
    id: string;
    title: string;
    type: 'invasive_invasion' | 'disease_outbreak' | 'climate_catastrophe';
    threatSpecies: string;
    targetPostcode: string;
    targetSuburbanReports: number;
    currentSuburbanReports: number;
    rewards: RewardTier;
    expiresAt: Date;
    lore: {
        announcement: string;
        victory: string;
    };
}

export interface MapMode {
    id: 'happy_valley' | 'northern_shield';
    name: string;
    description: string;
    center: { lat: number; lng: number };
    zoom: number;
    style: google.maps.MapTypeStyle[];
}

// ============================================================================
// ZOONOTIC RISK PROFILES DATABASE
// ============================================================================

export const ZOONOTIC_PROFILES: Record<ZoonoticDisease, ZoonoticRiskProfile> = {
    hendra: {
        disease: 'hendra',
        transmission_risk: 'CRITICAL',
        exposure_route: ['direct_contact', 'respiratory'],
        ppe_required: {
            gloves: true,
            mask: 'p3',
            gown: true,
            eye_protection: true
        },
        actions_required: [
            '🚨 CRITICAL: Hendra is a notifiable disease in Australia',
            'Cease examination immediately',
            'Don full P3 respiratory protection',
            'Isolate horse in stable with no human contact',
            'Call emergency biosecurity hotline: 1800 675 888',
            'Quarantine yourself - do not return home',
            'Notify all staff who had contact'
        ],
        personal_protection: {
            vaccination_available: false,
            post_exposure_prophylaxis: false,
            quarantine_period_days: 21
        }
    },
    rabies: {
        disease: 'rabies',
        transmission_risk: 'CRITICAL',
        exposure_route: ['direct_contact', 'bite'],
        ppe_required: {
            gloves: true,
            mask: 'n95',
            gown: true,
            eye_protection: true
        },
        actions_required: [
            'Isolate patient immediately',
            'Don full PPE before further contact',
            'Report to biosecurity authority',
            'Seek immediate post-exposure prophylaxis',
            'Contact veterinary supervisor'
        ],
        personal_protection: {
            vaccination_available: true,
            post_exposure_prophylaxis: true,
            quarantine_period_days: 14
        }
    },
    leptospirosis: {
        disease: 'leptospirosis',
        transmission_risk: 'MEDIUM',
        exposure_route: ['direct_contact', 'urine', 'water'],
        ppe_required: {
            gloves: true,
            mask: 'surgical',
            gown: true,
            eye_protection: true
        },
        actions_required: [
            'Wear waterproof gloves and boots',
            'Avoid contact with animal urine',
            'Wash hands thoroughly after handling',
            'Consider PCR testing'
        ],
        personal_protection: {
            vaccination_available: true,
            post_exposure_prophylaxis: true,
            quarantine_period_days: 0
        }
    },
    q_fever: {
        disease: 'q_fever',
        transmission_risk: 'MEDIUM',
        exposure_route: ['respiratory', 'direct_contact'],
        ppe_required: {
            gloves: true,
            mask: 'n95',
            gown: true,
            eye_protection: false
        },
        actions_required: [
            'Wear N95 respirator around birthing animals',
            'Ensure adequate ventilation',
            'Dispose of placental material safely'
        ],
        personal_protection: {
            vaccination_available: true,
            post_exposure_prophylaxis: false,
            quarantine_period_days: 0
        }
    },
    brucellosis: {
        disease: 'brucellosis',
        transmission_risk: 'MEDIUM',
        exposure_route: ['direct_contact', 'ingestion'],
        ppe_required: {
            gloves: true,
            mask: 'n95',
            gown: true,
            eye_protection: true
        },
        actions_required: [
            'Use protective gloves during examination',
            'Avoid contact with reproductive fluids',
            'Report to state veterinary authority'
        ],
        personal_protection: {
            vaccination_available: false,
            post_exposure_prophylaxis: true,
            quarantine_period_days: 0
        }
    },
    japanese_encephalitis: {
        disease: 'japanese_encephalitis',
        transmission_risk: 'LOW',
        exposure_route: ['vector'],
        ppe_required: {
            gloves: true,
            mask: 'surgical',
            gown: false,
            eye_protection: false
        },
        actions_required: [
            'Use insect repellent in endemic areas',
            'Report to public health authority',
            'Consider vaccination if working in pig/wetland areas'
        ],
        personal_protection: {
            vaccination_available: true,
            post_exposure_prophylaxis: false,
            quarantine_period_days: 0
        }
    }
};

// ============================================================================
// MAP MODES (Happy Valley vs Northern Shield)
// ============================================================================

const happyValleyStyle: google.maps.MapTypeStyle[] = [
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a2daf2' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#c8e6c8' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#a8d8a8' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#f5f5dc' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#666666' }] }
];

const northernShieldStyle: google.maps.MapTypeStyle[] = [
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1a3a4a' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#2d3a2d' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#3a4a3a' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#4a5a4a' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#aaaaaa' }] }
];

export const MAP_MODES: Record<string, MapMode> = {
    happy_valley: {
        id: 'happy_valley',
        name: 'Happy Valley',
        description: 'Consumer game mode - friendly aesthetics',
        center: { lat: -27.4698, lng: 153.0251 }, // Brisbane
        zoom: 10,
        style: happyValleyStyle
    },
    northern_shield: {
        id: 'northern_shield',
        name: 'Northern Shield',
        description: 'Professional biosecurity training mode',
        center: { lat: -19.2590, lng: 146.8169 }, // Townsville
        zoom: 8,
        style: northernShieldStyle
    }
};

// ============================================================================
// GEOSPATIAL ENGINE CLASS
// ============================================================================

export class ValleyVetEngine {
    private map: google.maps.Map | null = null;
    private loader: Loader;
    private outbreakZones: Map<string, google.maps.Circle[]> = new Map();
    private markers: google.maps.Marker[] = [];
    private currentMode: MapMode;

    // Callbacks
    public onZoonoticAlert: ((profile: ZoonoticRiskProfile) => void) | null = null;
    public onModeChange: ((mode: MapMode) => void) | null = null;
    public onOutbreakClick: ((outbreak: BossBattle) => void) | null = null; // Changed OutbreakZone to BossBattle for the new engine
    public onBossEventTriggered: ((event: BossBattle) => void) | null = null;

    constructor(apiKey: string) {
        this.loader = new Loader({
            apiKey,
            version: 'weekly',
            libraries: ['visualization', 'places', 'geometry']
        });
        this.currentMode = MAP_MODES.happy_valley;
    }

    /**
     * Initialize the map in a container element
     */
    async initialize(containerId: string, mode: 'happy_valley' | 'northern_shield' = 'happy_valley'): Promise<void> {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container #${containerId} not found`);
        }

        this.currentMode = MAP_MODES[mode];

        // MOCK MODE CHECK
        // If loader has no API key (we'll check this by catching the load error or pre-check)
        // Actually, we'll rely on the caller to handle the key, but locally:
        if ((this.loader as any).apiKey === "" || (this.loader as any).apiKey === "undefined") {
            console.warn("⚠️ RUNNING IN MOCK MODE: No Google Maps API Key found.");
            container.style.backgroundColor = "#1a3a4a";
            container.style.display = "flex";
            container.style.alignItems = "center";
            container.style.justifyContent = "center";
            container.innerHTML = `
                <div style="text-align: center; color: white; opacity: 0.8;">
                    <h2>🗺️ Mock Map Mode</h2>
                    <p>Google Maps API key missing. Using static background.</p>
                    <div style="margin-top: 20px; border: 1px dashed white; padding: 20px;">
                        [Interactive Map Placeholder]
                    </div>
                </div>
             `;
            return;
        }

        try {
            await this.loader.load();
            this.map = new google.maps.Map(container, {
                center: this.currentMode.center,
                zoom: this.currentMode.zoom,
                styles: this.currentMode.style,
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true
            });
            console.log(`Valley Vet Engine initialized in ${mode} mode`);
        } catch (e) {
            console.error("Failed to load Google Maps, falling back to Mock Mode", e);
            container.innerHTML = `<div style="color:white;text-align:center;padding-top:100px">Map Load Error (Check Console)</div>`;
        }
    }

    /**
     * Switch between Happy Valley and Northern Shield modes
     */
    setMode(modeId: 'happy_valley' | 'northern_shield'): void {
        if (!this.map) return;

        const mode = MAP_MODES[modeId];
        this.currentMode = mode;

        this.map.setOptions({
            center: mode.center,
            zoom: mode.zoom,
            styles: mode.style
        });

        this.onModeChange?.(mode);
        console.log(`Switched to ${mode.name} mode`);
    }

    /**
     * Add an outbreak visualization with AUSVETPLAN containment zones
     */
    addOutbreak(outbreak: OutbreakZone): void {
        if (!this.map) return;

        const circles: google.maps.Circle[] = [];

        // Zone definitions (AUSVETPLAN standard)
        const zones = [
            { radius: 1000, color: '#ff0000', opacity: 0.4, label: 'Infected Premises' },
            { radius: 3000, color: '#ff8800', opacity: 0.3, label: 'Dangerous Contact' },
            { radius: 10000, color: '#ffcc00', opacity: 0.2, label: 'Restricted Area' },
            { radius: 50000, color: '#ffff88', opacity: 0.1, label: 'Control Area' }
        ];

        zones.forEach(zone => {
            const circle = new google.maps.Circle({
                map: this.map!,
                center: outbreak.epicenter,
                radius: zone.radius,
                fillColor: zone.color,
                fillOpacity: zone.opacity,
                strokeColor: zone.color,
                strokeWeight: 2,
                strokeOpacity: 0.8
            });

            circle.addListener('click', () => {
                this.onOutbreakClick?.(outbreak);
            });

            circles.push(circle);
        });

        // Add epicenter marker
        const marker = new google.maps.Marker({
            position: outbreak.epicenter,
            map: this.map,
            title: `${outbreak.disease} Outbreak`,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 15,
                fillColor: '#ff0000',
                fillOpacity: 0.9,
                strokeColor: '#ffffff',
                strokeWeight: 3
            }
        });

        marker.addListener('click', () => {
            this.onOutbreakClick?.(outbreak);
        });

        this.markers.push(marker);
        this.outbreakZones.set(outbreak.id, circles);
    }

    /**
     * Add a VR clinic entry point marker
     */
    addVRClinic(location: { lat: number; lng: number }, name: string, onEnter: () => void): void {
        if (!this.map) return;

        const marker = new google.maps.Marker({
            position: location,
            map: this.map,
            title: name,
            icon: {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 8,
                fillColor: '#4a90d9',
                fillOpacity: 0.9,
                strokeColor: '#ffffff',
                strokeWeight: 2
            },
            animation: google.maps.Animation.DROP
        });

        marker.addListener('click', () => {
            console.log(`Entering VR: ${name}`);
            onEnter();
        });

        this.markers.push(marker);
    }

    /**
     * Check geo-risk for a location (calls VetNotes API)
     */
    async checkGeoRisk(
        lat: number,
        lng: number,
        species: string = 'canine',
        symptoms: string[] = []
    ): Promise<{ hendra_risk: string; lepto_risk: string; fmd_watch: boolean; alerts: string[] }> {
        const apiUrl = import.meta.env.VITE_VETNOTES_API_URL || 'http://localhost:8000';

        try {
            const params = new URLSearchParams({
                lat: lat.toString(),
                lng: lng.toString(),
                species,
                symptoms: symptoms.join(',')
            });

            const response = await fetch(`${apiUrl}/api/v1/vetsorcery/risk?${params}`);
            if (!response.ok) throw new Error('Geo-risk API failed');

            return await response.json();
        } catch (error) {
            console.error('Geo-risk check failed:', error);
            return { hendra_risk: 'unknown', lepto_risk: 'unknown', fmd_watch: false, alerts: [] };
        }
    }

    /**
     * Trigger a suburban boss event (e.g., Smithfield Fire Ant Siege)
     */
    triggerSuburbanBossEvent(event: BossBattle): void {
        console.warn(`🔥 SUBURBAN BOSS TRIGGERED: ${event.title} in ${event.targetPostcode}`);
        this.onBossEventTriggered?.(event);

        // Visualize on map as a high-intensity pulsing zone
        if (this.map) {
            const bossZone = new google.maps.Circle({
                map: this.map,
                center: this.currentMode.center, // Default to center of postcode/mode for demo
                radius: 5000,
                fillColor: '#ef4444',
                fillOpacity: 0.3,
                strokeColor: '#ef4444',
                strokeWeight: 4,
                strokeOpacity: 0.8
            });

            // Pulse animation logic could be added here
        }
    }

    /**
     * Trigger a zoonotic exposure alert
     */
    triggerZoonoticAlert(disease: ZoonoticDisease): void {
        const profile = ZOONOTIC_PROFILES[disease];
        if (profile) {
            console.error(`🚨 ZOONOTIC EXPOSURE: ${disease.toUpperCase()}`);
            this.onZoonoticAlert?.(profile);
        }
    }

    /**
     * Get current map bounds for viewport
     */
    getBounds(): google.maps.LatLngBounds | null {
        return this.map?.getBounds() ?? null;
    }

    /**
     * Pan to a specific location
     */
    panTo(lat: number, lng: number, zoom?: number): void {
        if (!this.map) return;
        this.map.panTo({ lat, lng });
        if (zoom) this.map.setZoom(zoom);
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.markers.forEach(m => m.setMap(null));
        this.outbreakZones.forEach(circles => circles.forEach(c => c.setMap(null)));
        this.markers = [];
        this.outbreakZones.clear();
        this.map = null;
    }
}

// ============================================================================
// DEMO SCENARIO: FAR NORTH QLD HENDRA OUTBREAK
// ============================================================================

export function createDemoScenario(engine: ValleyVetEngine): void {
    // Hendra outbreak near Townsville
    engine.addOutbreak({
        id: 'hendra_fnq_001',
        epicenter: { lat: -19.30, lng: 146.80 },
        disease: 'Hendra Virus',
        declaredDate: new Date('2026-01-10'),
        confirmedCases: 2,
        suspectedCases: 5,
        movementBan: true,
        veterinaryResources: {
            vetsDeployed: 5,
            vetsNeeded: 15
        }
    });

    // JCU Vet School as VR entry point
    engine.addVRClinic(
        { lat: -19.3293, lng: 146.7573 },
        'JCU School of Veterinary Science',
        () => {
            alert('🎮 VR HOLODECK: In production, this would load a 3D clinical environment where you practice PPE donning, patient examination, and biosecurity protocols.');
        }
    );

    // Additional clinics
    engine.addVRClinic(
        { lat: -19.2600, lng: 146.8100 },
        'Townsville Veterinary Clinic',
        () => {
            alert('🏥 Entering Townsville Vet Clinic VR simulation...');
        }
    );
}
