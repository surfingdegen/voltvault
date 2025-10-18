import { useState } from 'react';

interface AgeVerificationProps {
  onVerify: () => void;
}

export const AgeVerification = ({ onVerify }: AgeVerificationProps) => {
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = () => {
    if (agreed) {
      localStorage.setItem('age_verified', 'true');
      onVerify();
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Age Verification</h2>
        <p className="text-gray-300 mb-6">
          This content is intended for adults only. You must be 18 years or older to access this site.
        </p>
        
        <label className="flex items-start space-x-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-300">
            I confirm that I am 18 years of age or older
          </span>
        </label>

        <button
          onClick={handleSubmit}
          disabled={!agreed}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            agreed
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Enter Site
        </button>
      </div>
    </div>
  );
};
