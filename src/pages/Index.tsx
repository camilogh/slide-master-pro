import { AppProvider } from '@/context/AppContext';
import { Wizard } from '@/components/Wizard';

const Index = () => {
  return (
    <AppProvider>
      <Wizard />
    </AppProvider>
  );
};

export default Index;
