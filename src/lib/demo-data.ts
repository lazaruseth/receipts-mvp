import type { Agreement, Dispute, ExtractedTerms, RiskFlag } from '@/types';

// Demo agreements for testing and investor demos
export const DEMO_AGREEMENTS: Omit<Agreement, 'userId'>[] = [
  {
    id: 'demo-1',
    agentId: 'agent-openai-001',
    merchantId: 'united-airlines',
    merchantName: 'United Airlines',
    merchantCategory: 'Travel',
    category: 'travel',
    sourceUrl: 'https://www.united.com/terms',
    documentHash: 'sha256:abc123...',
    blockchainTxId: '0x1234567890abcdef',
    capturedAt: new Date('2024-01-15T10:30:00Z'),
    rawText: `UNITED AIRLINES CONTRACT OF CARRIAGE
Last Updated: January 2024

RULE 24: REFUNDS AND CHANGES

A. 24-Hour Flexible Booking Policy
In compliance with U.S. Department of Transportation regulations, passengers may cancel their reservation within 24 hours of booking and receive a full refund to the original form of payment, provided the booking was made at least seven (7) days prior to the scheduled departure.

B. Changes and Cancellations After 24 Hours
For tickets purchased after the 24-hour window:
- Basic Economy fares: Non-changeable and non-refundable. No changes permitted after booking.
- Economy and above: A change fee of $200 USD per ticket applies for domestic travel. International change fees may vary.
- Elite Status Members: Premier Gold, Platinum, and 1K members may have change fees waived per their membership benefits.

RULE 27: DISPUTE RESOLUTION

A. Binding Arbitration
ANY DISPUTE, CLAIM, OR CONTROVERSY ARISING OUT OF OR RELATING TO THIS CONTRACT OR YOUR TRAVEL, INCLUDING THE ENFORCEABILITY OF THIS ARBITRATION PROVISION, SHALL BE RESOLVED EXCLUSIVELY BY BINDING ARBITRATION administered by the American Arbitration Association in accordance with its Consumer Arbitration Rules. The arbitration shall take place in Chicago, Illinois.

B. Class Action Waiver
YOU AGREE THAT ANY ARBITRATION OR PROCEEDING SHALL BE LIMITED TO THE DISPUTE BETWEEN UNITED AND YOU INDIVIDUALLY. You waive any right to participate in a class action lawsuit or class-wide arbitration.

RULE 25: BAGGAGE LIABILITY

Liability for loss, damage, or delay of baggage is limited as follows:
- Domestic Travel: Maximum liability of $3,800 per passenger
- International Travel: Liability governed by the Montreal Convention (approximately 1,288 SDRs)
United is not liable for consequential damages, including but not limited to missed connections or business losses.

RULE 35: DATA SHARING

United may share your personal information with partner airlines, code-share partners, and travel service providers to facilitate your travel arrangements. Information may also be shared with government authorities as required by law.`,
    documentTitle: 'Contract of Carriage',
    extractedTerms: {
      refundPolicy: {
        type: 'conditional',
        window: '24 hours',
        conditions: ['Full refund within 24 hours of booking', 'After 24 hours, fare rules apply'],
      },
      cancellationPolicy: {
        fee: 200,
        feeType: 'flat',
        window: 'Up to 2 hours before departure',
        conditions: ['Basic Economy tickets non-changeable', 'Elite members may have fee waivers'],
      },
      disputeResolution: {
        method: 'arbitration',
        jurisdiction: 'Illinois, USA',
        classActionWaiver: true,
        chargebackRightsPreserved: false,
      },
      autoRenewal: { enabled: false },
      dataUsage: {
        thirdPartySharing: true,
        retentionPeriod: '7 years',
        purposes: ['Flight operations', 'Marketing', 'Partner airlines'],
      },
      liability: {
        limitations: ['Baggage liability capped at $3,800 domestic', 'Not liable for consequential damages'],
        indemnification: false,
        maxLiability: 'Montreal Convention limits',
      },
      priceTerms: {
        amount: 450,
        currency: 'USD',
        priceGuarantee: false,
        dynamicPricing: true,
      },
    } as ExtractedTerms,
    riskFlags: ['BINDING_ARBITRATION', 'CLASS_ACTION_WAIVER', 'CHARGEBACK_WAIVER'] as RiskFlag[],
    plainSummary:
      'United requires binding arbitration for disputes and waives class action rights. You can cancel within 24 hours for a full refund, but after that a $200 fee may apply. Baggage liability is capped and your data is shared with partner airlines.',
    status: 'active',
    expiresAt: new Date('2024-03-15'),
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
  },
  {
    id: 'demo-2',
    agentId: 'agent-openai-001',
    merchantId: 'marriott-hotels',
    merchantName: 'Marriott International',
    merchantCategory: 'Hospitality',
    category: 'hospitality',
    sourceUrl: 'https://www.marriott.com/terms',
    documentHash: 'sha256:def456...',
    blockchainTxId: '0xabcdef1234567890',
    capturedAt: new Date('2024-01-18T14:00:00Z'),
    rawText: `MARRIOTT INTERNATIONAL HOTEL BOOKING TERMS & CONDITIONS
Effective Date: January 2024

1. RESERVATION AND CANCELLATION POLICY

1.1 Flexible Rate Reservations
Reservations made at flexible rates may be cancelled without penalty up to 48 hours before the scheduled check-in time (6:00 PM local hotel time). Cancellations made within 48 hours of arrival may result in a charge equal to one night's room rate plus applicable taxes.

1.2 Advance Purchase Rates
Reservations made at Advance Purchase or other prepaid rates are NON-REFUNDABLE. Full payment is charged at time of booking and no modifications or cancellations are permitted.

1.3 No-Show Policy
Failure to arrive on your scheduled check-in date without prior cancellation will result in a charge of one night's room rate plus taxes. Your remaining reservation nights may be cancelled.

2. PRICE GUARANTEE

Marriott guarantees the best available rate when you book directly through Marriott.com or the Marriott Bonvoy app. If you find a lower rate for the same room, dates, and conditions within 24 hours of booking, we will match the rate and provide an additional 25% discount.

3. DISPUTE RESOLUTION

Any disputes arising from your stay shall be resolved through the courts of competent jurisdiction in Montgomery County, Maryland, USA. Marriott does not require binding arbitration for consumer disputes and preserves your right to pursue claims through the court system or small claims court.

4. DATA USAGE AND PRIVACY

Your personal information may be used for:
- Processing reservations and facilitating your stay
- Marriott Bonvoy loyalty program administration
- Marketing communications (with your consent)
- Sharing with marketing partners who may contact you with offers

Data is retained for a period of 5 years following your last stay or account activity.

5. LIABILITY

Marriott's liability for loss or damage to guest property stored in in-room safes is limited to $1,000 USD. Marriott is not responsible for theft from guest vehicles parked on hotel property.`,
    documentTitle: 'Hotel Booking Terms & Conditions',
    extractedTerms: {
      refundPolicy: {
        type: 'conditional',
        window: '48 hours before check-in',
        conditions: ['Advance Purchase rates non-refundable', 'Flexible rates: cancel by 6 PM local time'],
      },
      cancellationPolicy: {
        fee: 0,
        window: '48 hours',
        conditions: ['First night charged for no-shows', 'Some rates require 72-hour notice'],
      },
      disputeResolution: {
        method: 'courts',
        jurisdiction: 'Maryland, USA',
        classActionWaiver: false,
        chargebackRightsPreserved: true,
      },
      autoRenewal: { enabled: false },
      dataUsage: {
        thirdPartySharing: true,
        retentionPeriod: '5 years',
        purposes: ['Reservations', 'Loyalty program', 'Marketing partners'],
      },
      liability: {
        limitations: ['Room safe liability: $1,000 max', 'Not liable for theft from vehicles'],
        indemnification: false,
      },
      priceTerms: {
        amount: 289,
        currency: 'USD',
        priceGuarantee: true,
        dynamicPricing: false,
      },
    } as ExtractedTerms,
    riskFlags: ['DATA_SHARING_EXTENSIVE'] as RiskFlag[],
    plainSummary:
      'Marriott offers reasonable cancellation terms with no arbitration requirement. Cancel 48 hours before check-in for flexible rates. Price is guaranteed once booked. Data is shared with marketing partners and loyalty programs.',
    status: 'active',
    expiresAt: new Date('2024-02-20'),
    createdAt: new Date('2024-01-18T14:00:00Z'),
    updatedAt: new Date('2024-01-18T14:00:00Z'),
  },
  {
    id: 'demo-3',
    agentId: 'agent-claude-001',
    merchantId: 'adobe-creative-cloud',
    merchantName: 'Adobe Creative Cloud',
    merchantCategory: 'Software',
    category: 'software',
    sourceUrl: 'https://www.adobe.com/legal/terms',
    documentHash: 'sha256:ghi789...',
    capturedAt: new Date('2024-01-20T09:15:00Z'),
    rawText: `ADOBE CREATIVE CLOUD SUBSCRIPTION AGREEMENT
Version 24.1 | Effective: January 2024

SECTION 4: SUBSCRIPTION TERMS AND BILLING

4.1 Subscription Plans
Creative Cloud subscriptions are offered as:
- Monthly Plan: Billed monthly, cancel anytime without penalty
- Annual Plan (Paid Monthly): 12-month commitment billed monthly
- Annual Plan (Prepaid): 12-month commitment paid upfront

4.2 Refund Policy
New subscribers may cancel within fourteen (14) days of initial purchase for a full refund. After 14 days, refunds are subject to the early termination provisions below.

4.3 Early Termination - Annual Plans
If you cancel your annual plan after 14 days, you will be charged 50% of your remaining contract obligation. For example, if you have 6 months remaining at $54.99/month, an early termination fee of approximately $165 will apply.

SECTION 5: AUTO-RENEWAL

5.1 Automatic Renewal
YOUR SUBSCRIPTION WILL AUTOMATICALLY RENEW at the end of each subscription term unless you cancel. For annual plans, you must cancel at least thirty (30) days before your renewal date to avoid being charged for the next term.

5.2 Price Changes
Adobe may change subscription prices upon renewal. We will notify you at least 30 days in advance of any price increase.

SECTION 12: DISPUTE RESOLUTION AND ARBITRATION

12.1 Binding Arbitration
Any dispute arising from this Agreement shall be resolved through BINDING ARBITRATION administered by JAMS under its Streamlined Arbitration Rules. The arbitration shall be conducted in Santa Clara County, California.

12.2 Class Action Waiver
YOU AND ADOBE AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, and not as a plaintiff or class member in any purported class or representative proceeding.

SECTION 14: CONTENT AND DATA

14.1 Your Content
You retain ownership of content you create using Creative Cloud. However, you grant Adobe a worldwide, royalty-free license to use your content for the limited purpose of operating and improving our services.

14.2 Machine Learning
By using Creative Cloud, you agree that Adobe may use your content to train machine learning and artificial intelligence models to improve Adobe products and services. You may opt out of this in your account settings.

14.3 Indemnification
You agree to indemnify, defend, and hold harmless Adobe from any claims, damages, or expenses arising from your content or your violation of this Agreement.`,
    documentTitle: 'Creative Cloud Subscription Terms',
    extractedTerms: {
      refundPolicy: {
        type: 'conditional',
        window: '14 days',
        conditions: ['Full refund within 14 days of purchase', 'Prorated refund after 14 days with 50% early termination fee'],
      },
      cancellationPolicy: {
        fee: 50,
        feeType: 'percentage',
        window: 'Anytime',
        conditions: ['Annual plan: 50% of remaining months charged', 'Monthly plan: no fee'],
      },
      disputeResolution: {
        method: 'arbitration',
        jurisdiction: 'California, USA',
        classActionWaiver: true,
        chargebackRightsPreserved: true,
      },
      autoRenewal: {
        enabled: true,
        frequency: 'Annual',
        cancellationNotice: '30 days before renewal',
      },
      dataUsage: {
        thirdPartySharing: true,
        retentionPeriod: 'Duration of account + 1 year',
        purposes: ['Product improvement', 'AI training', 'Marketing'],
      },
      liability: {
        limitations: ['Not liable for data loss', 'Maximum liability: 12 months of fees'],
        indemnification: true,
        maxLiability: '12 months subscription fees',
      },
      priceTerms: {
        amount: 54.99,
        currency: 'USD',
        priceGuarantee: false,
        dynamicPricing: false,
      },
    } as ExtractedTerms,
    riskFlags: [
      'BINDING_ARBITRATION',
      'CLASS_ACTION_WAIVER',
      'AUTO_RENEWAL_HIDDEN',
      'BROAD_INDEMNIFICATION',
      'DATA_SHARING_EXTENSIVE',
    ] as RiskFlag[],
    plainSummary:
      'Adobe auto-renews annually and requires 30 days notice to cancel. Early termination of annual plans incurs a 50% fee on remaining months. Binding arbitration required, no class actions. Your content may be used to train AI. You must indemnify Adobe for claims related to your content.',
    status: 'active',
    createdAt: new Date('2024-01-20T09:15:00Z'),
    updatedAt: new Date('2024-01-20T09:15:00Z'),
  },
  {
    id: 'demo-4',
    agentId: 'agent-openai-001',
    merchantId: 'aws',
    merchantName: 'Amazon Web Services',
    merchantCategory: 'Cloud Services',
    category: 'cloud_services',
    sourceUrl: 'https://aws.amazon.com/service-terms',
    documentHash: 'sha256:jkl012...',
    capturedAt: new Date('2024-01-22T16:45:00Z'),
    rawText: `AMAZON WEB SERVICES CUSTOMER AGREEMENT
Last Updated: January 15, 2024

2. PAYMENT AND FEES

2.1 Service Fees
Fees for AWS Services are usage-based and calculated according to the pricing published on the AWS website. All fees are non-refundable except as expressly set forth in the Service Level Agreements.

2.2 Reserved Capacity
Purchases of Reserved Instances, Savings Plans, or other committed capacity are NON-REFUNDABLE and NON-TRANSFERABLE. You remain responsible for all committed payments regardless of actual usage.

2.3 Payment Terms
All fees are due and payable within thirty (30) days from the invoice date. Late payments accrue interest at 1.5% per month or the maximum rate permitted by law.

11. DISPUTE RESOLUTION

11.1 Binding Arbitration
Any dispute arising out of or relating to this Agreement shall be resolved by BINDING ARBITRATION in King County, Washington, USA, administered by the American Arbitration Association under its Commercial Arbitration Rules.

11.2 Class Action Waiver
ALL CLAIMS MUST BE BROUGHT IN THE PARTIES' INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.

11.3 Chargeback Restrictions
You agree not to initiate any chargeback or payment dispute with your financial institution for fees properly charged under this Agreement. Violation of this provision may result in immediate termination of your account.

9. LIMITATION OF LIABILITY

9.1 Liability Cap
IN NO EVENT SHALL AWS'S AGGREGATE LIABILITY ARISING OUT OF THIS AGREEMENT EXCEED THE FEES PAID BY YOU DURING THE TWELVE (12) MONTHS PRECEDING THE CLAIM.

9.2 Exclusion of Damages
AWS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES.

9.3 Service Outages
Liability for service outages is limited exclusively to service credits as specified in the applicable Service Level Agreement.

10. INDEMNIFICATION

You agree to indemnify, defend, and hold harmless AWS from any third-party claims arising from: (a) your use of the Services; (b) your content; (c) your violation of this Agreement; or (d) your violation of any applicable law.

12. DATA

12.1 Your Data
You retain all rights to your data. Upon termination, you may retrieve your data for a period of ninety (90) days. After this period, AWS may delete all stored data.

12.2 Data Use
AWS does not access or use your content except as necessary to provide and maintain the Services, or as required by law. AWS does not share your content with third parties.`,
    documentTitle: 'AWS Customer Agreement',
    extractedTerms: {
      refundPolicy: {
        type: 'non-refundable',
        conditions: ['Usage-based billing', 'Reserved instances non-refundable'],
      },
      cancellationPolicy: {
        window: 'Anytime',
        conditions: ['Responsible for usage until termination', 'Reserved capacity commitments still apply'],
      },
      disputeResolution: {
        method: 'arbitration',
        jurisdiction: 'Washington State, USA',
        classActionWaiver: true,
        chargebackRightsPreserved: false,
      },
      autoRenewal: {
        enabled: true,
        frequency: 'Monthly',
        cancellationNotice: 'None required',
      },
      dataUsage: {
        thirdPartySharing: false,
        retentionPeriod: '90 days after termination',
        purposes: ['Service delivery', 'Support'],
      },
      liability: {
        limitations: [
          'Not liable for data loss',
          'No liability for service outages beyond SLA credits',
          'Consequential damages excluded',
        ],
        indemnification: true,
        maxLiability: 'Fees paid in prior 12 months',
      },
    } as ExtractedTerms,
    riskFlags: [
      'BINDING_ARBITRATION',
      'CLASS_ACTION_WAIVER',
      'NON_REFUNDABLE',
      'CHARGEBACK_WAIVER',
      'BROAD_INDEMNIFICATION',
    ] as RiskFlag[],
    plainSummary:
      'AWS uses binding arbitration, waives class actions, and limits chargebacks. Services are non-refundable and usage-based. You must indemnify AWS against third-party claims. Data is not shared with third parties. Liability is capped at 12 months of fees.',
    status: 'active',
    createdAt: new Date('2024-01-22T16:45:00Z'),
    updatedAt: new Date('2024-01-22T16:45:00Z'),
  },
  {
    id: 'demo-5',
    agentId: 'agent-claude-001',
    merchantId: 'hertz',
    merchantName: 'Hertz Car Rental',
    merchantCategory: 'Travel',
    category: 'travel',
    sourceUrl: 'https://www.hertz.com/terms',
    documentHash: 'sha256:mno345...',
    blockchainTxId: '0x567890abcdef1234',
    capturedAt: new Date('2024-01-25T11:00:00Z'),
    rawText: `HERTZ VEHICLE RENTAL AGREEMENT
Terms and Conditions | United States

SECTION 3: CANCELLATION AND MODIFICATIONS

3.1 Cancellation Policy
Reservations may be cancelled without charge at any time prior to the scheduled pickup time. Cancellations made after pickup or no-shows may result in a charge of up to one day's rental.

3.2 Early Returns
No refunds will be provided for early vehicle returns. You will be charged for the full reserved rental period.

3.3 Prepaid Reservations
"Pay Now" prepaid reservations may have different cancellation terms as disclosed at the time of booking.

SECTION 5: DAMAGE AND LIABILITY

5.1 Renter Responsibility
YOU ARE RESPONSIBLE FOR ALL DAMAGE TO OR LOSS OF THE VEHICLE, regardless of fault or negligence, including damage caused by weather, road conditions, or acts of nature.

5.2 Loss Damage Waiver (LDW)
By purchasing LDW at the time of rental, Hertz agrees to waive or reduce your financial responsibility for covered damage to the vehicle. LDW is not insurance and may not cover all situations.

5.3 Damage Assessment
If the vehicle is returned damaged, you authorize Hertz to charge your payment method for repair costs, loss of use charges, and administrative fees. Damage disputes must be raised within 30 days.

5.4 Indemnification
You agree to indemnify and hold harmless Hertz from all claims, liability, costs, and expenses arising from your use of the vehicle.

SECTION 8: DISPUTE RESOLUTION

8.1 Governing Law
This Agreement shall be governed by the laws of the State of Florida without regard to conflict of law principles.

8.2 Venue
Any legal action arising from this Agreement shall be brought exclusively in the state or federal courts located in Lee County, Florida. Hertz does not require binding arbitration for consumer disputes.

8.3 Payment Disputes
Your right to dispute charges with your credit card issuer (chargeback rights) is preserved under this Agreement, subject to your card issuer's terms and conditions.

SECTION 10: PRIVACY AND DATA SHARING

10.1 Information Collection
Hertz collects personal information including name, driver's license, payment details, and rental history.

10.2 Third-Party Disclosure
Your information may be shared with: insurance companies processing claims, law enforcement when legally required, toll collection agencies, traffic violation authorities, and affiliated Hertz companies for marketing purposes.`,
    documentTitle: 'Vehicle Rental Agreement',
    extractedTerms: {
      refundPolicy: {
        type: 'refundable',
        window: 'Before pickup',
        conditions: ['Full refund if cancelled before pickup', 'No refund for early returns'],
      },
      cancellationPolicy: {
        fee: 0,
        window: 'Before pickup',
        conditions: ['Pay Now rates may have restrictions'],
      },
      disputeResolution: {
        method: 'courts',
        jurisdiction: 'Florida, USA',
        classActionWaiver: false,
        chargebackRightsPreserved: true,
      },
      autoRenewal: { enabled: false },
      dataUsage: {
        thirdPartySharing: true,
        purposes: ['Insurance partners', 'Law enforcement if required', 'Marketing'],
      },
      liability: {
        limitations: ['Renter liable for damage unless protection purchased', 'Loss of use charges may apply'],
        indemnification: true,
      },
      priceTerms: {
        amount: 85,
        currency: 'USD',
        priceGuarantee: true,
        dynamicPricing: false,
      },
    } as ExtractedTerms,
    riskFlags: ['BROAD_INDEMNIFICATION', 'DATA_SHARING_EXTENSIVE'] as RiskFlag[],
    plainSummary:
      "Hertz allows free cancellation before pickup and preserves chargeback rights. You're liable for vehicle damage unless you purchase protection. Data is shared with insurance partners and law enforcement. Price is locked in at booking.",
    status: 'disputed',
    createdAt: new Date('2024-01-25T11:00:00Z'),
    updatedAt: new Date('2024-01-26T09:00:00Z'),
  },
];

export const DEMO_DISPUTES: Omit<Dispute, 'userId'>[] = [
  {
    id: 'dispute-1',
    agreementId: 'demo-5',
    issueType: 'different_than_agreed',
    description:
      'Was charged $450 for "damage" that was pre-existing. The scratch on the bumper was present when I picked up the vehicle but was not noted on the initial inspection form by the agent.',
    evidencePackage: {
      originalAgreement: 'https://storage.remaster.ai/agreements/demo-5',
      timestampProof: '0x567890abcdef1234',
      extractedTerms: DEMO_AGREEMENTS[4].extractedTerms as ExtractedTerms,
      violationAnalysis:
        "The agreement states renter is liable for damage, but does not address pre-existing damage. The merchant's failure to document existing conditions prior to rental creates ambiguity that should favor the consumer.",
    },
    status: 'submitted',
    submittedTo: 'mastercard',
    createdAt: new Date('2024-01-26T09:00:00Z'),
    updatedAt: new Date('2024-01-26T09:00:00Z'),
  },
];

// Helper to get demo data with user ID
export function getDemoAgreements(userId: string): Agreement[] {
  return DEMO_AGREEMENTS.map((a) => ({ ...a, userId }));
}

export function getDemoDisputes(userId: string): Dispute[] {
  return DEMO_DISPUTES.map((d) => ({ ...d, userId }));
}
