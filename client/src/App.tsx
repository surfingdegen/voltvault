import { useState, useEffect } from 'react';
import { AgeVerification } from './components/AgeVerification';
import { WalletConnect } from './components/WalletConnect';
import { VideoFeed } from './components/VideoFeed';
import { useWallet } from './hooks/useWallet';

function App() {
  const [ageVerified, setAgeVerified] = useState(false);
  const { hasAccess } = useWallet();

  useEffect(() => {
    const verified = localStorage.getItem('age_verified');
    if (verified === 'true') {
      setAgeVerified(true);
    }
  }, []);

  if (!ageVerified) {
    return <AgeVerification onVerify={() => setAgeVerified(true)} />;
  }

  if (!hasAccess) {
    return <WalletConnect />;
  }

  return <VideoFeed />;
}

export default App;
