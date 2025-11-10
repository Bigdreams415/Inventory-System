import React, { useEffect, useState } from 'react';

declare global {
  interface Window {
    electronAPI: {
      onUpdateAvailable: (callback: () => void) => void;
      onUpdateDownloaded: (callback: () => void) => void;
      restartApp: () => Promise<void>;
    };
  }
}

const UpdateChecker: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onUpdateAvailable(() => {
        setUpdateAvailable(true);
      });

      window.electronAPI.onUpdateDownloaded(() => {
        setUpdateDownloaded(true);
      });
    }
  }, []);

  const handleRestart = async () => {
    if (window.electronAPI) {
      await window.electronAPI.restartApp();
    }
  };

  if (!updateAvailable && !updateDownloaded) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      {updateAvailable && !updateDownloaded && (
        <div className="bg-blue-500 text-white p-4 rounded-lg shadow-lg">
          ⬇️ Downloading update...
        </div>
      )}
      
      {updateDownloaded && (
        <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg">
          <p>✅ Update downloaded!</p>
          <button 
            onClick={handleRestart}
            className="mt-2 bg-white text-green-600 px-4 py-2 rounded font-semibold hover:bg-gray-100"
          >
            Restart to Update
          </button>
        </div>
      )}
    </div>
  );
};

export default UpdateChecker;