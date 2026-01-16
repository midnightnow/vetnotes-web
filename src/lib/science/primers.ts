export interface PrimerSet {
    gene: string;
    forward: string;
    reverse: string;
    ampliconSize: number;
    reference: string;
}

export function suggestPrimers(species: string): PrimerSet {
    const primers: Record<string, PrimerSet> = {
        'Crocodylus porosus': {
            gene: 'COI',
            forward: "5'-GGTCAACAAATCATAAAGATATTGGA-3'",
            reverse: "5'-TAAACTTCAGGGTGACCAAAAAATCA-3'",
            ampliconSize: 658,
            reference: 'Folmer et al. 1994'
        },
        'Solenopsis invicta': {
            gene: 'ITS2',
            forward: "5'-TGTGAACTGCAGGACACATG-3'",
            reverse: "5'-GACGGAAGTACCAGTCTTG-3'",
            ampliconSize: 420,
            reference: 'Valles et al. 2008'
        },
        'Pteropus spp.': {
            gene: 'HeV-L',
            forward: "5'-TGACATCGTTCCTCATGYYT-3'",
            reverse: "5'-GGRTCIACIARYTCAATCAT-3'",
            ampliconSize: 182,
            reference: 'Fogarty et al. 2008'
        }
    };

    return primers[species] || {
        gene: '16S rRNA',
        forward: "5'-CGGTTGGATCACCTCCTTAC-3'",
        reverse: "5'-GTGTTAGCCGGTGCTTCTTC-3'",
        ampliconSize: 550,
        reference: 'Standard Bacterial'
    };
}
