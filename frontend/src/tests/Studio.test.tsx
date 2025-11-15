import { render, screen, fireEvent } from "@testing-library/react";
import Studio from "../pages/Studio";

jest.mock("../services/generations", () => ({
  fetchHistory: jest.fn().mockResolvedValue([]),
  createGeneration: jest.fn(),
}));

jest.mock("../context/AuthContext", () => ({
  __esModule: true,
  default: {
    Provider: ({ children }: any) => children,
  },
  useContext: () => ({
    user: { id: 1 },
    signout: jest.fn(),
  }),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

describe("Studio", () => {
  test("renders UI elements", () => {
    render(<Studio />);
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  test("requires prompt before generating", () => {
    render(<Studio />);

    fireEvent.click(screen.getByText("Generate"));

    expect(screen.getByText("Prompt is required")).toBeInTheDocument();
  });
});
