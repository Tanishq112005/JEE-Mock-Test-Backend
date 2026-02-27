// =================================================================
// lib/upstashMonitor.ts
// Fetches REAL command counts directly from Upstash Management API
// =================================================================

const MANAGEMENT_API   = "https://api.upstash.com/v2/redis";
const MANAGEMENT_TOKEN = process.env.UPSTASH_MANAGEMENT_API_TOKEN!;
const REQUEST_LIMIT    = 250_000;

export interface InstanceStats {
    instanceId:      string;
    dbId:            string;
    dailyRequests:   number;
    monthlyRequests: number;
    remaining:       number;
    usagePercent:    string;
    shouldRotate:    boolean;
}

class UpstashMonitor {

    // ── Fetch real command count from Upstash API ─────────────────
    async getInstanceStats(instanceId: string, dbId: string): Promise<InstanceStats> {
        try {
            const response = await fetch(
                `${MANAGEMENT_API}/${dbId}/stats`,
                {
                    method:  "GET",
                    headers: {
                        Authorization: `Bearer ${MANAGEMENT_TOKEN}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Upstash API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // ── Upstash returns total monthly and daily request counts ─
            const monthlyRequests = data.total_monthly_requests ?? 0;
            const dailyRequests   = data.total_daily_requests   ?? 0;

            return {
                instanceId,
                dbId,
                dailyRequests,
                monthlyRequests,
                remaining:    Math.max(0, REQUEST_LIMIT - monthlyRequests),
                usagePercent: `${((monthlyRequests / REQUEST_LIMIT) * 100).toFixed(1)}%`,
                shouldRotate: monthlyRequests >= REQUEST_LIMIT,
            };

        } catch (err: any) {
            console.error(`❌ Failed to fetch stats for instance "${instanceId}": ${err.message}`);

            // ── Return safe defaults so pool keeps running on API failure ─
            return {
                instanceId,
                dbId,
                dailyRequests:   0,
                monthlyRequests: 0,
                remaining:       REQUEST_LIMIT,
                usagePercent:    "0.0%",
                shouldRotate:    false,
            };
        }
    }

    // ── Fetch stats for all instances in parallel ─────────────────
    async getAllInstanceStats(
        instances: { instanceId: string; dbId: string }[]
    ): Promise<InstanceStats[]> {
        return await Promise.all(
            instances.map(({ instanceId, dbId }) =>
                this.getInstanceStats(instanceId, dbId)
            )
        );
    }
}

export const upstashMonitor = new UpstashMonitor();