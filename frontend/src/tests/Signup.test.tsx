import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Signup from "../pages/SignUp";
import api from "../services/api";

jest.mock("../services/api", () => ({
  post: jest.fn(),
}));

describe("Signup", () => {
  test("renders name, email, password", () => {
    render(<Signup />);
    expect(screen.getByLabelText("Full Name (optional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  test("calls signup API", async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { token: "xyz", user: { id: 2 } },
    });

    render(<Signup />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByText("Create account"));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/auth/signup", {
        email: "a@b.com",
        password: "123456",
        name: "",
      })
    );
  });

  test("shows signup error", async () => {
    (api.post as jest.Mock).mockRejectedValue({
      response: { data: { message: "Signup failed" } },
    });

    render(<Signup />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByText("Create account"));

    await waitFor(() =>
      expect(screen.getByText("Signup failed")).toBeInTheDocument()
    );
  });
});
