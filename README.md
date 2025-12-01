# AI LaTeX Book Generator v2.0

An AI-powered system for automatically generating university-level LaTeX textbooks with interactive outline editing and customizable LaTeX headers.

## 🚀 Features

- **Interactive Outline Editor**: Drag-and-drop interface for managing chapter hierarchy
- **Custom LaTeX Headers**: Full control over LaTeX preamble and custom commands
- **AI Content Generation**: Multi-role AI collaboration using Claude and OpenAI APIs
- **Enhanced Exercise Format**: Support for `\ex{}` and `\sol{}` commands
- **Real-time Collaboration**: WebSocket-based live updates
- **Cloudflare Full-Stack**: Deployed on Cloudflare Pages and Workers

## 📋 Tech Stack

### Frontend
- React 18 + TypeScript
- Zustand (State Management)
- Tailwind CSS + Headless UI
- @dnd-kit/core (Drag & Drop)
- Socket.io-client (Real-time)
- Vite (Build Tool)

### Backend
- Node.js + Express
- Cloudflare Workers
- Cloudflare D1 (Database)
- Cloudflare R2 (Storage)
- Bull Queue (Task Queue)
- Socket.io (WebSocket)

## 🛠️ Installation

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Wrangler CLI (Cloudflare)
- Claude API Key and/or OpenAI API Key

### Quick Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd physics-book-writer
```

2. Install dependencies:
```bash
npm install
```

3. Run the automated setup script:
```bash
./scripts/setup-cloudflare.sh
```

This script will:
- Verify Wrangler CLI installation
- Run database migrations
- Set up API secrets
- Optionally deploy to Cloudflare

### Manual Setup

For detailed manual setup instructions, see:
- 📖 [Quick Start Guide](docs/QUICKSTART.md)
- 🚀 [GitHub Auto-Deploy Setup](docs/GITHUB_SETUP.md)
- 🔧 [Deployment Guide](docs/DEPLOYMENT.md)

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Initialize database:
```bash
npm run db:migrate
```

## 🏃 Development

Start both frontend and backend:
```bash
npm run dev
```

Or start individually:
```bash
npm run dev:frontend  # Frontend on http://localhost:5173
npm run dev:backend   # Backend on http://localhost:8787
```

## 📦 Build

Build all packages:
```bash
npm run build
```

## 🚀 Deployment

### Automated Deployment (GitHub Actions)

This project is configured for automatic deployment to Cloudflare via GitHub Actions.

**Setup Steps:**

1. Set GitHub Secrets (required):
   - `CLOUDFLARE_API_TOKEN` - Your Cloudflare API Token
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare Account ID

2. Push to main branch or any `claude/**` branch:
   ```bash
   git push origin main
   ```

3. GitHub Actions will automatically:
   - Build and test the code
   - Deploy backend to Cloudflare Workers
   - Deploy frontend to Cloudflare Pages
   - Run database migrations (main branch only)

📖 **Detailed Instructions**: See [GitHub Setup Guide](docs/GITHUB_SETUP.md)

### Manual Deployment

```bash
# One-time setup
./scripts/setup-cloudflare.sh

# Deploy manually
npm run deploy
```

### Current Cloudflare Configuration

- **Worker**: `physicsbookwriter`
- **D1 Database**: `physics-book-writer-d1`
- **R2 Storage**: `physics-book-writer`
- **Pages Project**: `physics-book-writer`

### Deployment URLs

After deployment, your application will be available at:
- **Frontend**: https://physics-book-writer.pages.dev
- **Backend API**: https://physicsbookwriter.workers.dev/api

## 📂 Project Structure

```
latex-book-generator/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── stores/       # Zustand stores
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utilities
│   └── package.json
├── backend/              # Node.js backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── models/       # Database models
│   │   └── workers/      # Cloudflare Workers
│   └── package.json
├── migrations/           # Database migrations
├── scripts/             # Deployment scripts
└── package.json
```

## 🔧 Configuration

### Cloudflare Workers

Configure in `backend/wrangler.toml`:
- D1 Database binding
- R2 Bucket binding
- Environment variables

### Cloudflare Pages

Configure in `frontend/wrangler.toml`:
- Build command
- Output directory
- Environment variables

## 📖 Usage

1. **Create a Project**: Start with a title and optional LaTeX header
2. **Edit Outline**: Use drag-and-drop to organize chapters, sections, and subsections
3. **Customize LaTeX**: Add custom commands and packages in the header editor
4. **Generate Content**: AI generates content based on your outline
5. **Review & Export**: Download the complete LaTeX source or compiled PDF

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

## 📄 License

MIT License - see LICENSE file for details

## 🐛 Known Issues

- LaTeX compilation requires TeX Live installation
- Real-time collaboration limited to 100 concurrent users per project

## 📞 Support

For issues and questions, please open a GitHub issue.
