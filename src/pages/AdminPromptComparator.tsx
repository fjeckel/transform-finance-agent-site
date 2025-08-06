import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Zap, 
  ArrowRight, 
  Copy, 
  Download, 
  Save, 
  Trash2, 
  Plus,
  Settings,
  GitCompare,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PromptTest {
  id: string;
  name: string;
  prompt: string;
  response: string;
  rating: number;
  notes: string;
  timestamp: Date;
}

interface ComparisonSet {
  id: string;
  title: string;
  description: string;
  prompts: PromptTest[];
  createdAt: Date;
}

const AdminPromptComparator = () => {
  const [activeComparisonSet, setActiveComparisonSet] = useState<ComparisonSet | null>(null);
  const [comparisonSets, setComparisonSets] = useState<ComparisonSet[]>([]);
  const [newPrompt, setNewPrompt] = useState('');
  const [newPromptName, setNewPromptName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createNewComparisonSet = () => {
    const newSet: ComparisonSet = {
      id: Date.now().toString(),
      title: `Research Set ${comparisonSets.length + 1}`,
      description: 'New prompt research comparison',
      prompts: [],
      createdAt: new Date()
    };
    setComparisonSets(prev => [...prev, newSet]);
    setActiveComparisonSet(newSet);
    toast({
      title: "New Comparison Set Created",
      description: "You can now start adding prompts for comparison.",
    });
  };

  const addPromptToSet = () => {
    if (!activeComparisonSet || !newPrompt.trim() || !newPromptName.trim()) {
      toast({
        title: "Error",
        description: "Please provide both prompt name and content.",
        variant: "destructive",
      });
      return;
    }

    const newPromptTest: PromptTest = {
      id: Date.now().toString(),
      name: newPromptName,
      prompt: newPrompt,
      response: '',
      rating: 0,
      notes: '',
      timestamp: new Date()
    };

    const updatedSet = {
      ...activeComparisonSet,
      prompts: [...activeComparisonSet.prompts, newPromptTest]
    };

    setComparisonSets(prev => 
      prev.map(set => set.id === activeComparisonSet.id ? updatedSet : set)
    );
    setActiveComparisonSet(updatedSet);
    setNewPrompt('');
    setNewPromptName('');

    toast({
      title: "Prompt Added",
      description: `"${newPromptName}" has been added to the comparison set.`,
    });
  };

  const simulateAIResponse = async (promptId: string) => {
    if (!activeComparisonSet) return;
    
    setIsLoading(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockResponses = [
      "This is a comprehensive analysis of the financial markets showing strong growth indicators...",
      "Based on the current market conditions, we recommend a diversified approach to investment...",
      "The quarterly report indicates significant improvements in operational efficiency...",
      "Our research suggests that emerging markets present unique opportunities for growth...",
      "The comparative analysis reveals key insights into industry trends and consumer behavior..."
    ];
    
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    const randomRating = Math.floor(Math.random() * 5) + 1;
    
    const updatedSet = {
      ...activeComparisonSet,
      prompts: activeComparisonSet.prompts.map(p => 
        p.id === promptId 
          ? { ...p, response: randomResponse, rating: randomRating }
          : p
      )
    };
    
    setComparisonSets(prev => 
      prev.map(set => set.id === activeComparisonSet.id ? updatedSet : set)
    );
    setActiveComparisonSet(updatedSet);
    setIsLoading(false);
    
    toast({
      title: "Response Generated",
      description: "AI response has been simulated and added to the prompt test.",
    });
  };

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast({
      title: "Copied to Clipboard",
      description: "Prompt has been copied to your clipboard.",
    });
  };

  const deletePrompt = (promptId: string) => {
    if (!activeComparisonSet) return;
    
    const updatedSet = {
      ...activeComparisonSet,
      prompts: activeComparisonSet.prompts.filter(p => p.id !== promptId)
    };
    
    setComparisonSets(prev => 
      prev.map(set => set.id === activeComparisonSet.id ? updatedSet : set)
    );
    setActiveComparisonSet(updatedSet);
    
    toast({
      title: "Prompt Deleted",
      description: "The prompt has been removed from the comparison set.",
    });
  };

  const exportResults = () => {
    if (!activeComparisonSet) return;
    
    const exportData = {
      title: activeComparisonSet.title,
      description: activeComparisonSet.description,
      createdAt: activeComparisonSet.createdAt,
      prompts: activeComparisonSet.prompts.map(p => ({
        name: p.name,
        prompt: p.prompt,
        response: p.response,
        rating: p.rating,
        notes: p.notes
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-research-${activeComparisonSet.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Research data has been exported as JSON file.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-2xl font-bold text-gray-900 font-cooper">
                Finance Transformers
              </Link>
              <Badge variant="secondary">Admin</Badge>
              <ArrowRight size={16} className="text-gray-400" />
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Sparkles size={12} className="mr-1" />
                Prompt Research Comparator
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="text-sm text-gray-600 hover:text-[#13B87B]">
                ← Back to Admin
              </Link>
              <Link to="/admin/insights" className="text-sm text-gray-600 hover:text-[#13B87B]">
                Insights
              </Link>
              <Link to="/admin/analytics" className="text-sm text-gray-600 hover:text-[#13B87B]">
                Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{comparisonSets.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Prompts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {activeComparisonSet?.prompts.length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {activeComparisonSet?.prompts.filter(p => p.response).length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {activeComparisonSet?.prompts.length ? 
                  (activeComparisonSet.prompts.reduce((sum, p) => sum + p.rating, 0) / activeComparisonSet.prompts.length).toFixed(1) 
                  : '0.0'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Comparison Sets Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Research Sets</CardTitle>
                <Button onClick={createNewComparisonSet} size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Plus size={16} className="mr-1" />
                  New Set
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {comparisonSets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <GitCompare size={48} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No research sets yet.</p>
                    <p className="text-xs text-gray-400">Create your first set to start comparing prompts.</p>
                  </div>
                ) : (
                  comparisonSets.map(set => (
                    <div 
                      key={set.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        activeComparisonSet?.id === set.id 
                          ? 'bg-purple-50 border-purple-200' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setActiveComparisonSet(set)}
                    >
                      <div className="font-medium text-sm">{set.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{set.prompts.length} prompts</div>
                      <div className="text-xs text-gray-400">
                        {set.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Working Area */}
          <div className="lg:col-span-2 space-y-6">
            {!activeComparisonSet ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Sparkles size={48} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Prompt Research Comparator</h3>
                    <p className="text-gray-600 mb-6">
                      Create comparison sets to test and evaluate different prompts side by side.
                    </p>
                    <Button onClick={createNewComparisonSet} className="bg-purple-600 hover:bg-purple-700">
                      <Plus size={16} className="mr-2" />
                      Create Your First Research Set
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Add New Prompt */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus size={20} />
                      Add Prompt to "{activeComparisonSet.title}"
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Prompt name (e.g., 'Market Analysis v1')"
                      value={newPromptName}
                      onChange={(e) => setNewPromptName(e.target.value)}
                    />
                    <Textarea
                      placeholder="Enter your prompt here..."
                      value={newPrompt}
                      onChange={(e) => setNewPrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex gap-2">
                      <Button onClick={addPromptToSet} disabled={!newPrompt.trim() || !newPromptName.trim()}>
                        <Plus size={16} className="mr-2" />
                        Add Prompt
                      </Button>
                      <Button variant="outline" onClick={exportResults} disabled={activeComparisonSet.prompts.length === 0}>
                        <Download size={16} className="mr-2" />
                        Export Results
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Prompts List */}
                <div className="space-y-4">
                  {activeComparisonSet.prompts.map(prompt => (
                    <Card key={prompt.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{prompt.name}</CardTitle>
                            <div className="text-sm text-gray-500">
                              {prompt.timestamp.toLocaleString()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyPrompt(prompt.prompt)}
                            >
                              <Copy size={14} className="mr-1" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => simulateAIResponse(prompt.id)}
                              disabled={isLoading}
                            >
                              <Zap size={14} className="mr-1" />
                              {isLoading ? 'Testing...' : 'Test'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deletePrompt(prompt.id)}
                            >
                              <Trash2 size={14} className="mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Prompt:</h4>
                          <div className="bg-gray-50 p-3 rounded text-sm">{prompt.prompt}</div>
                        </div>
                        
                        {prompt.response && (
                          <>
                            <div>
                              <h4 className="font-medium mb-2">Response:</h4>
                              <div className="bg-blue-50 p-3 rounded text-sm">{prompt.response}</div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div>
                                <span className="text-sm font-medium">Rating: </span>
                                <span className="text-lg font-bold text-yellow-600">
                                  {'★'.repeat(prompt.rating)}{'☆'.repeat(5-prompt.rating)}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {activeComparisonSet.prompts.length === 0 && (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <GitCompare size={48} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-gray-500">No prompts in this research set yet.</p>
                        <p className="text-sm text-gray-400">Add your first prompt above to start comparing.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPromptComparator;