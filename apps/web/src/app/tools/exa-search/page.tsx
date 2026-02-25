import ToolShell from '@/components/tools/ToolShell';
import ExaSearchTool from '@/components/tools/ExaSearchTool';

export default function ExaSearchPage() {
  return (
    <ToolShell
      id="exa-search"
      label="Exa Semantic Search"
      description="Neural web search that understands meaning, not just keywords. Find recent research, articles, and content with natural language queries."
      icon="Exa"
    >
      <ExaSearchTool />
    </ToolShell>
  );
}
