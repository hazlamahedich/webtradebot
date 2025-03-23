import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "next-themes";

// Mock the next-themes module
jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}));

describe("ThemeToggle Component", () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
  });

  it("renders the toggle button", () => {
    // Mock the useTheme hook
    (useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      setTheme: jest.fn(),
    });

    render(<ThemeToggle />);
    
    // Check if the button is rendered
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    
    // Check if both icons are in the document
    expect(screen.getByText("Toggle theme")).toBeInTheDocument();
  });

  it("toggles from light to dark theme when clicked", async () => {
    // Create a mock function
    const setThemeMock = jest.fn();
    
    // Mock the useTheme hook with light theme
    (useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      setTheme: setThemeMock,
    });

    render(<ThemeToggle />);
    
    // Click the toggle button
    const button = screen.getByRole("button");
    await userEvent.click(button);
    
    // Check if setTheme was called with "dark"
    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });

  it("toggles from dark to light theme when clicked", async () => {
    // Create a mock function
    const setThemeMock = jest.fn();
    
    // Mock the useTheme hook with dark theme
    (useTheme as jest.Mock).mockReturnValue({
      theme: "dark",
      setTheme: setThemeMock,
    });

    render(<ThemeToggle />);
    
    // Click the toggle button
    const button = screen.getByRole("button");
    await userEvent.click(button);
    
    // Check if setTheme was called with "light"
    expect(setThemeMock).toHaveBeenCalledWith("light");
  });
});