import request from "supertest";
import { app } from "../src/index";
import { prisma } from "../src/index";

beforeAll(async () => {
  await prisma.user.deleteMany();
});

describe("Auth: Signup & Login", () => {
  const email = "test@example.com";
  const password = "password123";

  test("Signup → success", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email, password });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(email);
  });

  test("Signup → fail (duplicate email)", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email, password });

    expect(res.status).toBe(409);
  });

  test("Login → success", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test("Login → fail (wrong password)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "wrong" });

    expect(res.status).toBe(401);
  });

  test("Login → fail (missing fields)", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });
});
