import { Redirect } from 'expo-router';

// Environments are selected or created inside attendance session setup.
export default function LegacyEnvironmentRoute() {
  return <Redirect href="/instructor/facial" />;
}
