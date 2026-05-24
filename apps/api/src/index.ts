import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { MongoClient } from 'mongodb';
import { initDb } from './lib/db.js';
import { initWebSocket } from './lib/ws.js';

// Routes
import { authRouter } from './routes/auth.js';
import { nationsRouter } from './routes/nations.js';
import { citizensRouter } from './routes/citizens.js';
import { economyRouter } from './routes/economy.js';
import { lawRouter } from './routes/law.js';
import { companiesRouter } from './routes/companies.js';
import { diplomacyRouter } from './routes/diplomacy.js';
import { passportRouter } from './routes/passport.js';
import { dniRouter } from './routes/dni.js';
import { analyticsRouter } from './routes/analytics.js';
import { prestigeRouter } from './routes/prestige.js';

// Middlewares
import { authMiddleware } from './middleware/auth.js';
import { nationGuard } from './middleware/nationGuard.js';
import { standardLimiter } from './middleware/rateLimiter.js';

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(standardLimiter);

app.use('/api/v1/auth', authRouter);

// Protected routes
app.use('/api/v1/nations/:guildId', authMiddleware, nationGuard);
app.use('/api/v1/nations/:guildId', nationsRouter);
app.use('/api/v1/nations/:guildId/citizens', citizensRouter);
app.use('/api/v1/nations/:guildId/economy', economyRouter);
app.use('/api/v1/nations/:guildId/law', lawRouter);
app.use('/api/v1/nations/:guildId/companies', companiesRouter);
app.use('/api/v1/nations/:guildId/alliances', diplomacyRouter);
app.use('/api/v1/nations/:guildId/dni', dniRouter);
app.use('/api/v1/nations/:guildId/analytics', analyticsRouter);
app.use('/api/v1/nations/:guildId/prestige', prestigeRouter);

// Global routes
app.use('/api/v1/passport', authMiddleware, passportRouter);

async function bootstrap() {
  const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(mongoUrl);
  await client.connect();
  const db = client.db('bloxive');
  initDb(db, client);
  
  initWebSocket(server);

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`[API] Server listening on port ${port}`);
  });
}

bootstrap().catch(console.error);
