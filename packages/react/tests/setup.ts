const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const shouldSuppressReactTestNoise = (args: unknown[]) => {
  const combined = args.map((arg) => String(arg)).join(' ');
  return (
    combined.includes('An update to Root inside a test was not wrapped in act(...)') ||
    combined.includes('Attempted to synchronously unmount a root while React was already rendering')
  );
};

console.error = (...args: unknown[]) => {
  if (shouldSuppressReactTestNoise(args)) return;
  originalConsoleError(...args);
};

console.warn = (...args: unknown[]) => {
  if (shouldSuppressReactTestNoise(args)) return;
  originalConsoleWarn(...args);
};
