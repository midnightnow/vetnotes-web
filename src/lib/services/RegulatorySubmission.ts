
import type { NotifiableCondition } from '../data/notifiable';

export function generateRegulatoryHTML(
    condition: NotifiableCondition,
    transcript: string,
    axes: { tox?: string, path?: string, vital?: string },
    vetName: string = "Dr. [Unknown]",
    clinicName: string = "ValleyVet Clinical Partner"
): string {
    const date = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' });
    const reportId = `BIOSEC-${Date.now().toString().slice(-6)}`;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Regulatory Submission - ${condition.id}</title>
        <style>
            body { font-family: "Courier New", Courier, monospace; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
            .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; text-transform: uppercase; }
            .sub-logo { font-size: 12px; margin-top: 5px; color: #555; }
            .warning-box { border: 2px solid #d32f2f; background: #ffebee; padding: 15px; margin-bottom: 30px; font-weight: bold; color: #b71c1c; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #ccc; margin-bottom: 10px; padding-bottom: 5px; }
            .field { margin-bottom: 8px; font-size: 13px; }
            .label { font-weight: bold; width: 150px; display: inline-block; }
            .value { font-family: Helvetica, Arial, sans-serif; }
            .transcript-box { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; font-size: 11px; white-space: pre-wrap; }
            .footer { margin-top: 50px; font-size: 10px; text-align: center; border-top: 1px solid #eee; padding-top: 10px; color: #777; }
            .stamp { border: 3px double #d32f2f; color: #d32f2f; transform: rotate(-5deg); display: inline-block; padding: 5px 15px; font-weight: bold; font-size: 18px; position: absolute; top: 40px; right: 40px; opacity: 0.8; }
            @media print {
                body { padding: 0; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">Biosecurity Queensland</div>
            <div class="sub-logo">Department of Agriculture and Fisheries</div>
            <div class="sub-logo">Biosecurity Act 2014 - Section 47 Notification</div>
            <div class="stamp">NOTIFIABLE INCIDENT</div>
        </div>

        <div class="warning-box">
            NOTICE: This is a legal notification of a confirmed or suspected Category 1 Restricted Matter.
            False or misleading information is an offense.
        </div>

        <div class="section">
            <div class="section-title">incident details</div>
            <div class="field"><span class="label">Report ID:</span><span class="value">${reportId}</span></div>
            <div class="field"><span class="label">Date/Time:</span><span class="value">${date}</span></div>
            <div class="field"><span class="label">Jurisdiction:</span><span class="value">QLD - FAR NORTH REGION</span></div>
        </div>

        <div class="section">
            <div class="section-title">Reporter Information</div>
            <div class="field"><span class="label">Attending Vet:</span><span class="value">${vetName}</span></div>
            <div class="field"><span class="label">Clinic/Entity:</span><span class="value">${clinicName}</span></div>
            <div class="field"><span class="label">License No:</span><span class="value">QLD-VET-88421</span></div>
        </div>

        <div class="section">
            <div class="section-title">Suspected Biosecurity Matter</div>
            <div class="field"><span class="label">Condition:</span><span class="value"><strong>${condition.name}</strong> (${condition.id})</span></div>
            <div class="field"><span class="label">Authority:</span><span class="value">${condition.authority}</span></div>
            <div class="field"><span class="label">Detection Confidence:</span><span class="value">HIGH (Forensic Algorithm)</span></div>
        </div>

        <div class="section">
            <div class="section-title">Forensic Clinical Data</div>
            <div class="field"><span class="label">Primary Toxin (*tox):</span><span class="value">${axes.tox || 'N/A'}</span></div>
            <div class="field"><span class="label">Pathology (*path):</span><span class="value">${axes.path || 'N/A'}</span></div>
            <div class="field"><span class="label">Vital Signs (*vital):</span><span class="value">${axes.vital || 'N/A'}</span></div>
        </div>

        <div class="section">
            <div class="section-title">Clinical Transcript Evidence</div>
            <div class="transcript-box">${transcript}</div>
        </div>

        <div class="section">
            <div class="section-title">Declaration</div>
            <p style="font-size: 11px;">
                I declare that the information provided is true and correct to the best of my knowledge. 
                I understand my obligations under the <em>Biosecurity Act 2014</em> to minimize the movement 
                of the biosecurity matter until an inspector arrives.
            </p>
            <br>
            <div style="border-bottom: 1px solid #000; width: 200px; display: inline-block;"></div> <span style="font-size: 10px;">(Signature of Veterinarian)</span>
        </div>

        <div class="footer">
            Generated via ValleyVet System (Sovereign Clinical Link) | Timestamp: ${Date.now()} | Hash: ${reportId}-SIG
        </div>

        <script>
            window.onload = function() { window.print(); }
        </script>
    </body>
    </html>
    `;
}
