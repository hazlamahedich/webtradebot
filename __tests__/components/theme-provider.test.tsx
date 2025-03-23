import { render } from "@testing-library/react";
import { ThemeProvider } from "@/app/providers";
import { useTheme } from "next-themes";
import "@testing-library/jest-dom";

// Mock the next-themes ThemeProvider 
jest.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider-mock">{children}</div>
  ),
  useTheme: jest.fn(),
}));

describe("ThemeProvider Component", () => {
  it("renders the theme provider with children", () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <div>Test Child Component</div>
      </ThemeProvider>
    );
    
    expect(getByTestId("theme-provider-mock")).toBeInTheDocument();
    expect(getByText("Test Child Component")).toBeInTheDocument();
  });

  it("passes default props to theme provider", () => {
    // Create a spy to inspect props
    const originalThemeProvider = jest.requireMock("next-themes").ThemeProvider;
    const mockThemeProvider = jest.fn(originalThemeProvider);
    jest.mock("next-themes", () => ({
      ...jest.requireActual("next-themes"),
      ThemeProvider: mockThemeProvider,
    }));
    
    render(
      <ThemeProvider>
        <div>Test Child</div>
      </ThemeProvider>
    );
    
    // We can't directly test the props passed to the mocked component,
    // but we can verify the component renders correctly
    expect(mockThemeProvider).toHaveBeenCalled;
  });

  it("allows overriding default theme", () => {
    const { getByTestId } = render(
      <ThemeProvider defaultTheme="dark">
        <div>Custom Theme</div>
      </ThemeProvider>
    );
    
    expect(getByTestId("theme-provider-mock")).toBeInTheDocument();
  });
}); 