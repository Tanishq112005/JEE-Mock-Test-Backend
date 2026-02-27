import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`❌ Missing required environment variable: "${key}"`);
    }
    return value;
}

export const {
    PORT,
    JWT_SECRET_ACCESS_TOKEN,
    JWT_TEMP_EXPIRES_IN_ACCESS_TOKEN,
    JWT_ALGORITHM_ACCESS_TOKEN,
    JWT_SECRET_REFERSH_TOKEN,
    JWT_TEMP_EXPIRES_IN_REFERSH_TOKEN,
    JWT_ALGORITHM_REFERSH_TOKEN,
    DATABASE_URL,
    DATABASE_REPICA_URL,
    REDIS_HOST,
    REDIS_PORT,
    EMAIL_ID,
    GOOGLE_AUTH_PASSWORD,
    RABBITMQ_CONNECTION,
    RABBITMQ_PASSWORD,
    RABBITMQ_PORT,
    OTP_EXPIRE_TIME,
    SALT_ROUND,
    MAX_ATTEMENTS,
    WINDOW_SIZE,
    REDIS_PASSWORD,
    REDIS_USERNAME,
    BREVO_KEY_1,
    BREVO_KEY_2,
    GEMINI_API_KEY,
    BACKBLAZE_REGION,
    BACKBLAZE_ENDPOINT,
    BUCKET_NAME,
    IMAGE_EXPIRE_TIME,
    BACKBLAZE_KEY_ID,
    BACKBLAZE_APP_KEY,
    IV_LENGTH,
    ENCRYPTION_KEY,
    BUCKET_ID,
    IMAGE_WORKER_BASE_URL,
    EMAIL_WORKER_PORT,
    UPDATE_WORKER_PORT,
    WATCHDOG_PORT,
    WATCHDOG_INTERVAL,
    WATCHDOG_INACTIVITY_THRESHOLD_SEC,
    EVALUATION_WORKER_PORT,
    STUDENT_TEST_ANALYTICS_WORKER_PORT,
    EMAIL_ADDING_WORKER_PORT,
} = process.env;

// =================================================================
// UPSTASH — validated at startup, throws immediately if missing
// =================================================================


// =================================================================
// ANALYTICS REDIS INSTANCES
// =================================================================
export const ANALYTICS_REDIS_INSTANCES = [
    {
        id:    "analytics_instance_1",
        dbId:  requireEnv("UPSTASH_REDIS_DBID"),
        url:   requireEnv("UPSTASH_REDIS_REST_URL"),
        token: requireEnv("UPSTASH_REDIS_REST_TOKEN"),
    },
];

// =================================================================
// TEST DATA REDIS INSTANCES
// =================================================================
export const TEST_REDIS_INSTANCES = [
    {
        id:    "test_instance_1",
        dbId:  requireEnv("UPSTASH_REDIS_DBID_CACHING"),
        url:   requireEnv("UPSTASH_REDIS_REST_URL_CACHING"),
        token: requireEnv("UPSTASH_REDIS_REST_TOKEN_CACHING"),
    },
];