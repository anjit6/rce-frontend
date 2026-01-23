import { useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import RulesList from '../../components/rules/RulesList';

export default function RulesPage() {
  useEffect(() => {
    document.title = 'All Rules - RCE';
  }, []);

  return (
    <Layout>
      <RulesList />
    </Layout>
  );
}
