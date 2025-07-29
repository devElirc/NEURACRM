import React from "react";
import { Loader2 } from "lucide-react"; // optional, using lucide for spinner

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
