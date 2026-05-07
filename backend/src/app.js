import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

const allowedOrigins = new Set(
	[process.env.CORS_ORIGIN, process.env.FRONTEND_URL]
		.filter(Boolean)
		.flatMap((origin) => {
			try {
				const url = new URL(origin);
				const aliases = [origin];

				if (url.hostname === 'localhost') {
					aliases.push(`${url.protocol}//127.0.0.1${url.port ? `:${url.port}` : ''}`);
				}

				if (url.hostname === '127.0.0.1') {
					aliases.push(`${url.protocol}//localhost${url.port ? `:${url.port}` : ''}`);
				}

				return aliases;
			} catch {
				return [origin];
			}
		})
);

app.use(
	cors({
		origin(origin, callback) {
			if (!origin) {
				callback(null, true);
				return;
			}

			if (allowedOrigins.size === 0 || allowedOrigins.has(origin)) {
				callback(null, true);
				return;
			}

			callback(null, false);
		},
	})
);
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', apiRouter);

app.use(errorHandler);

export default app;
