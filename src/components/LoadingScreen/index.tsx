export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-black border-r-black animate-spin"></div>
        </div>

        {/* Loading Text with Animation */}
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Carregando</h2>
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
          </div>
        </div>
      </div>

      {/* Background Gradient Effect (subtle) */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50 opacity-50 -z-10"></div>
    </div>
  );
}
