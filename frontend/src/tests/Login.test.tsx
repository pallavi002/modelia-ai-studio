import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../pages/Login";
import api from "../services/api";

describe("Login Component", () => {
  test("renders email and password fields", () => {
    render(<Login />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  test("calls API on submit", async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { token: "abc", user: { id: 1 } },
    });

    render(<Login />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "x@y.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByText("Sign in"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/login", {
        email: "x@y.com",
        password: "123456",
      });
    });
  });

  test("shows error on API failure", async () => {
    (api.post as jest.Mock).mockRejectedValue({
      response: { data: { message: "Login failed" } },
    });

    render(<Login />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "x@y.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByText("Sign in"));

    await waitFor(() => {
      expect(screen.getByText("Login failed")).toBeInTheDocument();
    });
  });
});
