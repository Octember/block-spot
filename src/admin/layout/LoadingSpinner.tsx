const LoadingSpinner = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>
  );
};

export const LoadingSpinnerSmall = () => {
  return (
    <div className="flex py-12 items-center justify-center bg-white">
      <div className="size-16 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></div>
    </div>
  );
};

export default LoadingSpinner;
