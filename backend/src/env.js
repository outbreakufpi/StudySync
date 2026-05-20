import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the .env file at the repository root.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export default process.env;
