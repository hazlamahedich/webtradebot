import { PromptTemplate } from "@langchain/core/prompts";

export const codeAnalysisPrompt = PromptTemplate.fromTemplate(`
You are an expert code reviewer tasked with analyzing code changes in a pull request.
Analyze the following code changes with extreme depth and precision:

Pull Request: {pullRequest}

Code Changes:
{codeChanges}

Perform a comprehensive analysis considering:
1. Code quality and readability
2. Potential bugs or edge cases
3. Security vulnerabilities
4. Performance implications
5. Architectural coherence
6. Test coverage adequacy
7. Compliance with best practices
8. Maintainability concerns

For each file, identify patterns, potential issues, and strengths. Look for subtle bugs that might not be immediately obvious.
Consider how these changes integrate with the existing codebase and evaluate potential unintended consequences.

Return a structured analysis of the code changes.
`);

export const improvementSuggestionPrompt = PromptTemplate.fromTemplate(`
You are an expert software engineer providing actionable suggestions for code improvements.
Based on the following code analysis, provide specific, concrete recommendations:

Code Analysis:
{analysis}

Pull Request:
{pullRequest}

Code Changes:
{codeChanges}

For each issue identified, provide:
1. A clear explanation of why it's an issue (with severity level)
2. An actionable recommendation with a specific code example
3. The benefits of implementing the suggestion
4. Any potential trade-offs to consider

Focus on high-impact improvements that would meaningfully enhance the code quality, security, performance, or maintainability.
Prioritize suggestions based on their importance and impact.

Return a structured list of improvement suggestions.
`);

export const explanationPrompt = PromptTemplate.fromTemplate(`
You are an expert software developer explaining complex code changes in clear, simple language.
Explain the following code changes to a product manager or non-technical stakeholder:

Pull Request: {pullRequest}

Code Changes:
{codeChanges}

Code Analysis:
{analysis}

Your explanation should:
1. Summarize the overall purpose of these changes
2. Explain the business impact or feature enhancement
3. Highlight key technical changes in non-technical terms
4. Connect technical implementation to business requirements
5. Explain potential user-facing impacts

Use clear, concise language without technical jargon. If technical terms are necessary, briefly explain them.
Focus on explaining "what" and "why" rather than "how" in implementation details.

Return a structured, easy-to-understand explanation of these code changes.
`);

export const summaryPrompt = PromptTemplate.fromTemplate(`
You are creating a comprehensive summary of a code review for a pull request.
Synthesize the following information:

Pull Request: {pullRequest}
Code Analysis: {analysis}
Improvement Suggestions: {suggestions}
Non-Technical Explanation: {explanation}

Create a detailed executive summary that includes:
1. Overall quality assessment with confidence level
2. Key strengths of the implementation
3. Critical issues requiring attention (if any)
4. A prioritized list of recommendations
5. Clear verdict: Approve, Request Changes, or Comment

The summary should be balanced, highlighting both positives and areas for improvement.
Be specific about what's working well and precise about what needs attention.

Return a structured summary of this code review.
`); 