import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Textarea } from "@/components/ui/textarea";
import "@testing-library/jest-dom";

describe("Textarea Component", () => {
  it("renders a textarea element", () => {
    render(<Textarea placeholder="Enter text here" />);
    
    const textarea = screen.getByPlaceholderText("Enter text here");
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("allows text input", async () => {
    render(<Textarea placeholder="Enter text here" />);
    
    const textarea = screen.getByPlaceholderText("Enter text here");
    await userEvent.type(textarea, "Hello, world!");
    
    expect(textarea).toHaveValue("Hello, world!");
  });

  it("applies custom className", () => {
    render(
      <Textarea 
        placeholder="Enter text here" 
        className="custom-class"
      />
    );
    
    const textarea = screen.getByPlaceholderText("Enter text here");
    expect(textarea).toHaveClass("custom-class");
  });

  it("forwards ref correctly", () => {
    const ref = jest.fn();
    render(<Textarea ref={ref} />);
    
    expect(ref).toHaveBeenCalled();
  });

  it("can be disabled", () => {
    render(<Textarea disabled placeholder="Disabled textarea" />);
    
    const textarea = screen.getByPlaceholderText("Disabled textarea");
    expect(textarea).toBeDisabled();
  });
}); 