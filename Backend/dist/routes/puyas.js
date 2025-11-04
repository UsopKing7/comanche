"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const coord_1 = require("../controllers/coord");
const router = (0, express_1.Router)();
router.get('/puyas', coord_1.coordPuyas);
router.get('/puyas_info', coord_1.puyas_info);
router.get('/track', coord_1.tracker);
router.get('/curva20s', coord_1.curva20s);
router.get('/curva5s', coord_1.curva5s);
exports.default = router;
//# sourceMappingURL=puyas.js.map