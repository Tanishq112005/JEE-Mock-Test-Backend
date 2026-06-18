"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashRingService = void 0;
const crypto = __importStar(require("crypto"));
// ==========================================
// 1. HASH RING HELPER CLASS (Reusable)
// ==========================================
class HashRingService {
    hashRing = [];
    ringMap = new Map();
    instanceMap = new Map();
    VIRTUAL_NODES = 100;
    generateHash(key) {
        const hash = crypto.createHash("md5").update(key).digest("hex");
        return parseInt(hash.substring(0, 8), 16);
    }
    // Node add karna Hash Ring mein
    addNode(config, client) {
        this.instanceMap.set(config, client);
        for (let i = 0; i < this.VIRTUAL_NODES; i++) {
            const identifier = config.type === 2 ? config.url : `${config.host}:${config.port}`;
            const nodeKey = identifier + "-VNODE-" + i;
            const hash = this.generateHash(nodeKey);
            this.hashRing.push(hash);
            this.ringMap.set(hash, config);
        }
        // Sort ascending for clockwise traversal
        this.hashRing.sort(function (a, b) {
            return a - b;
        });
    }
    // Node remove karna Hash Ring se
    removeNode(config) {
        this.instanceMap.delete(config);
        for (let i = 0; i < this.VIRTUAL_NODES; i++) {
            const identifier = config.type === 2 ? config.url : `${config.host}:${config.port}`;
            const nodeKey = identifier + "-VNODE-" + i;
            const hash = this.generateHash(nodeKey);
            const index = this.hashRing.indexOf(hash);
            if (index > -1) {
                this.hashRing.splice(index, 1);
            }
            this.ringMap.delete(hash);
        }
    }
    // User ke liye connection (Client) laana
    getNodeClient(userId) {
        if (this.hashRing.length === 0)
            return undefined;
        const userHash = this.generateHash(userId);
        let targetNodeHash = this.hashRing[0];
        for (let i = 0; i < this.hashRing.length; i++) {
            if (this.hashRing[i] >= userHash) {
                targetNodeHash = this.hashRing[i];
                break;
            }
        }
        const targetConfig = this.ringMap.get(targetNodeHash);
        if (targetConfig) {
            return this.instanceMap.get(targetConfig);
        }
        return undefined;
    }
    // Observability: Check karna ki user kis Redis server par map hua hai
    getNodeConfig(userId) {
        if (this.hashRing.length === 0)
            return undefined;
        const userHash = this.generateHash(userId);
        let targetNodeHash = this.hashRing[0];
        for (let i = 0; i < this.hashRing.length; i++) {
            if (this.hashRing[i] >= userHash) {
                targetNodeHash = this.hashRing[i];
                break;
            }
        }
        return this.ringMap.get(targetNodeHash);
    }
    // Shutdown logic
    async disconnectAll() {
        for (let [config, client] of this.instanceMap) {
            await client.disconnect();
        }
        this.instanceMap.clear();
        this.hashRing = [];
        this.ringMap.clear();
    }
    getActiveNodes() {
        return Array.from(this.instanceMap.keys());
    }
    // NAYA: Internal Getters for Key Migration / Rebalancing
    getClient(config) {
        return this.instanceMap.get(config);
    }
    getConfigByIdentifier(configData) {
        for (let config of this.instanceMap.keys()) {
            if (configData.type === 2) {
                if (config.type === 2 && config.url === configData.url)
                    return config;
            }
            else {
                if (config.type === 1 && config.host === configData.host && config.port === configData.port)
                    return config;
            }
        }
        return undefined;
    }
}
exports.HashRingService = HashRingService;
