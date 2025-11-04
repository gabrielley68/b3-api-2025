import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken'

import app from '/app.js';
import { User } from '/models';

const STRONG_PASSWORD = "3hW2RdkiAgY4biqNxS/u9Nt40P6qAFUEg9PxMxhPdOE";

describe("register", () => {
    it('needs all mandatory fields', async () => {
        const response = await request(app).post('/auth/register').send({});
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/mandatory/);
    });

    it('needs atleast 8 characters password', async () => {
        const response = await request(app).post('/auth/register').send({
            email: 'gabriel@mailinator.com',
            password: "toto",
            confirmPassword: "toto",
            display_name: "Toto"
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/Password must be atleast 8 characters long/);
    });

    it('validates email format', async () => {
        const response = await request(app).post('/auth/register').send({
            email: "blablabla",
            password: STRONG_PASSWORD,
            confirmPassword: STRONG_PASSWORD,
            display_name: "Toto"
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('The email is not valid');
    });

    it('cant use same email twice', async () => {
        const existingUser = await User.create({
            email: 'gabriel.ley@test.com',
            password: STRONG_PASSWORD,
            display_name: 'Gab'
        });

        const response = await request(app).post('/auth/register').send({
            email: existingUser.email,
            password: STRONG_PASSWORD,
            confirmPassword: STRONG_PASSWORD,
            display_name: "Toto"
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('An account with the provided email already exists');
    
        existingUser.destroy();
    });
});
