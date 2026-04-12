
export interface RedisInstanceConfig {
    username: string ; 
    password : string ; 
    email : string ; 
    host : string ; 
    port : number ; 
}



export interface UpstashStats {
    connection_count: { x: string; y: number }[];
    keyspace:         { x: string; y: number }[];
    throughput:       { x: string; y: number }[];
    diskusage:        { x: string; y: number }[];
    latencymean:      { x: string; y: number }[];
    read_latency_mean:  { x: string; y: number }[];
    write_latency_mean: { x: string; y: number }[];
    read_latency_99:    { x: string; y: number }[];
    write_latency_99:   { x: string; y: number }[];
}