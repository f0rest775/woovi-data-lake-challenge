"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const env_1 = require("@data-lake/env");
const ioredis_1 = __importDefault(require("ioredis"));
exports.redis = new ioredis_1.default(env_1.config.REDIS_URL);
//# sourceMappingURL=index.js.map