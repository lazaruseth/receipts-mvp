# REMASTER - Agreement Rail MVP

The agreement rail for agent commerce. Capture, parse, and store every agreement AI agents enter on behalf of users.

## Features

- **Agreement Capture**: Intercept and store agreements with cryptographic hash proofs
- **AI Parsing**: GPT-4 powered extraction of key terms from legal documents
- **Risk Detection**: Automatic flagging of problematic clauses (arbitration, chargebacks, auto-renewal)
- **Consumer Dashboard**: Browse, search, and understand all your agent agreements
- **Ask AI Chat**: Natural language questions about any agreement
- **Dispute Center**: Generate evidence packages for agreement violations

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI GPT-4 for document parsing and chat
- **Blockchain**: (Optional) Ethereum L2 for timestamp proofs

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key (optional for demo mode)

### Installation

```bash
# Clone the repository
cd remaster-mvp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and OpenAI API key

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

### Demo Mode

The app includes demo data that works without a database or API key. Just run:

```bash
npm run dev
```

And explore the dashboard with pre-populated agreements from airlines, hotels, and software providers.

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── agreements/   # Agreement CRUD
│   │   ├── chat/         # AI chat endpoint
│   │   ├── disputes/     # Dispute management
│   │   └── parse/        # Document parsing
│   ├── dashboard/        # Dashboard pages
│   │   ├── agreements/   # Agreement list & detail
│   │   ├── chat/         # Ask AI interface
│   │   └── disputes/     # Dispute center
│   └── page.tsx          # Landing page
├── components/           # Reusable components
├── lib/                  # Utilities
│   ├── demo-data.ts      # Sample agreements
│   ├── openai.ts         # OpenAI config
│   └── prisma.ts         # Database client
├── types/                # TypeScript types
└── prisma/
    └── schema.prisma     # Database schema
```

## API Endpoints

### Agreements

- `GET /api/agreements` - List all agreements (with filtering)
- `GET /api/agreements/:id` - Get agreement detail
- `POST /api/agreements` - Create new agreement

### Parsing

- `POST /api/parse` - Parse legal document and extract terms

### Chat

- `POST /api/chat` - Ask AI about an agreement

### Disputes

- `GET /api/disputes` - List all disputes
- `POST /api/disputes` - Create new dispute

## Risk Flags

The system identifies these potential risks in agreements:

| Flag | Severity | Description |
|------|----------|-------------|
| BINDING_ARBITRATION | High | Waives right to sue in court |
| CHARGEBACK_WAIVER | High | Limits payment dispute rights |
| CLASS_ACTION_WAIVER | Medium | Prohibits class action lawsuits |
| AUTO_RENEWAL_HIDDEN | Medium | Unclear auto-renewal terms |
| NON_REFUNDABLE | High | No refunds under any circumstances |
| FOREIGN_JURISDICTION | Medium | Disputes in inconvenient location |
| BROAD_INDEMNIFICATION | High | User liable for merchant issues |
| DATA_SHARING_EXTENSIVE | Medium | Data shared with many third parties |

## Future Roadmap

### Phase 2: Capture Layer
- Browser extension for real-time agreement interception
- Agent SDK for LangChain, OpenAI Assistants, Anthropic Claude

### Phase 3: Blockchain Integration
- Ethereum L2 timestamp proofs (Base/Optimism)
- Immutable agreement storage

### Phase 4: Partnerships
- Mastercard Agent Pay integration
- Payment network dispute submission

## License

Proprietary - REMASTER Inc.
