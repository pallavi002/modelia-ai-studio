import request from "supertest";
import { app } from "../src/index";

describe("Validation Structure", () => {
  test("Signup invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "bad", password: "123456" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test("Missing prompt for generation", async () => {
    const res = await request(app)
      .post("/api/generate")
      .set("Authorization", "Bearer xxx")
      .send({});

    expect(res.status).toBe(400);
  });
});
