"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const node_path_1 = __importDefault(require("node:path"));
const dotenv_safe_1 = __importDefault(require("dotenv-safe"));
const cwd = process.cwd();
const root = node_path_1.default.join.bind(cwd);
dotenv_safe_1.default.config({
    path: root('../../.env'),
    sample: root('../../.env.example'),
});
const ENV = process.env;
const config = {
    PORT: ENV.PORT ?? 3333,
    NODE_ENV: ENV.NODE_ENV ?? 'development',
    REDIS_URL: ENV.REDIS_URL || 'redis://:redis@localhost:6379',
    MONGO_URL: ENV.MONGO_URL || 'mongodb://localhost:27017?authSource=admin',
    CLICKHOUSE_URL: ENV.CLICKHOUSE_URL || 'http://localhost:8123',
    CLICKHOUSE_USERNAME: ENV.CLICKHOUSE_USERNAME || 'clickhouse',
    CLICKHOUSE_PASSWORD: ENV.CLICKHOUSE_PASSWORD || 'clickhouse123',
    CLICKHOUSE_DB: ENV.CLICKHOUSE_DB || 'pix_analytics',
};
exports.config = config;
//# sourceMappingURL=index.js.map