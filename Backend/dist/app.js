"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const env_1 = require("./config/env");
const db_1 = require("./config/db");
(0, db_1.connectionDB)();
server_1.app.listen(env_1.PORT, () => {
    console.table({
        URL: `http://localhost:${env_1.PORT}`
    });
});
//# sourceMappingURL=app.js.map