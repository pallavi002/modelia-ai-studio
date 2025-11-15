import { render, screen, fireEvent } from "@testing-library/react";
import PromptInput from "../components/PromptInput";

describe("PromptInput", () => {
  test("calls onGenerate with prompt and size", () => {
    const mockFn = jest.fn();

    render(<PromptInput onGenerate={mockFn} loading={false} />);

    fireEvent.change(screen.getByPlaceholderText("Enter your prompt..."), {
      target: { value: "hello world" },
    });

    fireEvent.change(screen.getByDisplayValue("1024x1024"), {
      target: { value: "512x512" },
    });

    fireEvent.click(screen.getByText("Generate"));

    expect(mockFn).toHaveBeenCalledWith({
      prompt: "hello world",
      size: "512x512",
    });
  });

  test("does not call onGenerate for empty prompt", () => {
    const mockFn = jest.fn();

    render(<PromptInput onGenerate={mockFn} loading={false} />);

    fireEvent.click(screen.getByText("Generate"));

    expect(mockFn).not.toHaveBeenCalled();
  });

  test("button disabled in loading", () => {
    render(<PromptInput onGenerate={() => {}} loading={true} />);

    expect(screen.getByText("Generating...")).toBeDisabled();
  });
});
