import * as React from "react";
import { Play, Eye, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResearchWizard } from "./ResearchWizard";
import ResearchErrorBoundary from "./ResearchErrorBoundary";
import { mockResearchSession, sampleTopics, getRandomTopic } from "@/lib/research-mock-data";
import { ResearchResults } from "@/types/research";

interface ResearchDemoProps {
  className?: string;
}

const ResearchDemo: React.FC<ResearchDemoProps> = ({ className }) => {
  const [showWizard, setShowWizard] = React.useState(false);
  const [demoTopic, setDemoTopic] = React.useState("");
  const [demoMode, setDemoMode] = React.useState<'new' | 'existing' | null>(null);

  const handleNewResearch = React.useCallback(() => {
    setDemoTopic("");
    setDemoMode('new');
    setShowWizard(true);
  }, []);

  const handleDemoWithSample = React.useCallback(() => {
    const randomTopic = getRandomTopic();
    setDemoTopic(randomTopic.prompt);
    setDemoMode('new');
    setShowWizard(true);
  }, []);

  const handleViewExisting = React.useCallback(() => {
    setDemoTopic(mockResearchSession.topic);
    setDemoMode('existing');
    setShowWizard(true);
  }, []);

  const handleComplete = React.useCallback((results: ResearchResults) => {
    console.log('Research completed:', results);
    setShowWizard(false);
    // In a real app, this would save results or navigate to results page
  }, []);

  const handleCancel = React.useCallback(() => {
    setShowWizard(false);
    setDemoMode(null);
  }, []);

  return (
    <ResearchErrorBoundary>
      <div className={className}>
        {!showWizard ? (
          <div className="space-y-6">
            {/* Demo Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Zap className="w-6 h-6 text-blue-600" />
                  AI Research Comparator Demo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Experience the power of dual AI analysis with our research comparison tool. 
                  Get insights from both Claude and OpenAI on any topic, compare their approaches, 
                  and export comprehensive research reports.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-sm">Define Topic</p>
                      <p className="text-xs text-muted-foreground">Enter your research question</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-sm">AI Processing</p>
                      <p className="text-xs text-muted-foreground">Dual AI analysis in parallel</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-sm">Compare Results</p>
                      <p className="text-xs text-muted-foreground">Side-by-side analysis</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Demo Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* New Research */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg group-hover:text-blue-600 transition-colors">
                    <Play className="w-5 h-5" />
                    Start New Research
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Begin a fresh research session with your own topic. Experience the full 
                    3-step wizard from setup to results.
                  </p>

                  <div className="space-y-2">
                    <Button onClick={handleNewResearch} className="w-full">
                      Custom Topic Research
                    </Button>
                    <Button 
                      onClick={handleDemoWithSample} 
                      variant="outline" 
                      className="w-full"
                    >
                      Try Sample Topic
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Estimated cost: ~$0.05</span>
                    <Badge variant="outline" className="text-xs">
                      ~2 min processing
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* View Existing Results */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg group-hover:text-green-600 transition-colors">
                    <Eye className="w-5 h-5" />
                    View Sample Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Explore completed research results with full comparison analysis. 
                    Perfect for understanding the final output format.
                  </p>

                  <Button onClick={handleViewExisting} variant="outline" className="w-full">
                    View AI in Finance Research
                  </Button>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-700 font-medium mb-1">Sample Topic:</p>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      AI applications in financial services including trading, fraud detection, 
                      and regulatory compliance analysis
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Cost: $0.060</span>
                    <Badge variant="secondary" className="text-xs">
                      Completed
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sample Topics Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Research Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sampleTopics.slice(0, 6).map((topic) => (
                    <div 
                      key={topic.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setDemoTopic(topic.prompt);
                        setDemoMode('new');
                        setShowWizard(true);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm line-clamp-1">{topic.title}</h4>
                        <Badge variant="outline" className="text-xs capitalize">
                          {topic.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {topic.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          ~${topic.estimatedCost.toFixed(3)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {topic.complexity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Technical Notes */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-base">Demo Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Mock Implementation:</strong> This demo uses simulated AI responses and processing 
                  to showcase the user experience. In production, it would connect to real Claude and OpenAI APIs.
                </p>
                <p>
                  <strong>Features Demonstrated:</strong> 3-step wizard, mobile-responsive design, 
                  real-time progress tracking, cost estimation, result comparison, and export functionality.
                </p>
                <p>
                  <strong>Technical Stack:</strong> React + TypeScript, Tailwind CSS, Radix UI components, 
                  and follows the existing Finance Transformers codebase patterns.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <ResearchWizard
            initialTopic={demoTopic}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        )}
      </div>
    </ResearchErrorBoundary>
  );
};

ResearchDemo.displayName = "ResearchDemo";

export { ResearchDemo };