import request from "supertest";
import { app } from "../src/index";
import { prisma } from "../src/index";
import jwt from "jsonwebtoken";

const token = jwt.sign({ userId: 1 }, "devsecret");

describe("Generations", () => {
  test("Unauthorized access", async () => {
    const res = await request(app).post("/api/generate").send({});
    expect(res.status).toBe(401);
  });

  test("Success generation", async () => {
    const res = await request(app)
      .post("/api/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({ prompt: "cat" });

    expect(res.status).toBe(200);
    expect(res.body.url).toBeDefined();
  });

  test("Simulated overload error", async () => {
    const originalRandom = Math.random;
    Math.random = () => 0.99; // force overload case

    const res = await request(app)
      .post("/api/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({ prompt: "cat" });

    expect(res.status).toBe(503);
    expect(res.body.message).toBe("Server overloaded, try again");
  });
});
