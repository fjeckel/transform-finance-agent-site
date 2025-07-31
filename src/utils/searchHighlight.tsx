import React from 'react';

export const highlightSearchTerms = (text: string, searchQuery: string): React.ReactNode => {
  if (!searchQuery || !text) return text;
  
  const query = searchQuery.toLowerCase();
  const lowerText = text.toLowerCase();
  
  // Find all matches
  const matches: { start: number; end: number }[] = [];
  let startIndex = 0;
  
  while (startIndex < lowerText.length) {
    const index = lowerText.indexOf(query, startIndex);
    if (index === -1) break;
    
    matches.push({ start: index, end: index + query.length });
    startIndex = index + 1;
  }
  
  if (matches.length === 0) return text;
  
  // Build highlighted text
  const parts: React.ReactNode[] = [];
  let lastEnd = 0;
  
  matches.forEach((match, i) => {
    // Add text before match
    if (match.start > lastEnd) {
      parts.push(text.substring(lastEnd, match.start));
    }
    
    // Add highlighted match
    parts.push(
      <mark 
        key={i} 
        className="bg-yellow-200 dark:bg-yellow-700/50 text-foreground px-0.5 rounded"
      >
        {text.substring(match.start, match.end)}
      </mark>
    );
    
    lastEnd = match.end;
  });
  
  // Add remaining text
  if (lastEnd < text.length) {
    parts.push(text.substring(lastEnd));
  }
  
  return <>{parts}</>;
};