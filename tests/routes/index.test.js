import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';

import app from '/app.js';

describe("Index route", () => {
    it("Should return 'home'", async () => {
        // Lance le serveur express
        // Fais une requête  sur "/"
        const response = await request(app).get('/');

        // Vérifie que ça donne "home"
        expect(response.statusCode).toBe(200);
    });

    it("Should return 404 on unknown pages", async () => {
        const response = await request(app).get('/qsdfqsdfff');

        expect(response.statusCode).toBe(404);
    });

})