import { z } from 'zod';

const envVariablesSchema = z.object({
    OPEN_AI_API_KEY: z.string(),
    CLOUDFLARE_ACCOUNT_ID: z.string(),
    CLOUDFLARE_TOKEN: z.string(),
    CLOUDFLARE_ACCESS_KEY: z.string(),
    CLOUDFLARE_SECRET_KEY: z.string(),
    CLOUDFLARE_R2_BUCKET_NAME: z.string(),
    SPEARLY_ACCOUNT_SERVER: z.string(),
    SPEARLY_AUTH_API_SERVER: z.string(),
    SPEARLY_CMS_API_SERVER: z.string(),
});

const envVariables = envVariablesSchema.parse(process.env);

declare global {
    namespace NodeJS {
        interface ProcessEnv extends z.infer<typeof envVariablesSchema> {}
    }
}
