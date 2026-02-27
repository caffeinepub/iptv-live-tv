import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChannelBrowser from './pages/ChannelBrowser';

// QueryClient is already provided in main.tsx, but we keep App clean
export default function App() {
    return <ChannelBrowser />;
}
