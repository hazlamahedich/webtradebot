import { PromptTemplate } from "@langchain/core/prompts";

/**
 * Prompts for the documentation generator workflow
 */
export const documentationPrompts = {
  // Prompt for analyzing code structure
  codeAnalysisPrompt: PromptTemplate.fromTemplate(`
    You are an expert code analyzer tasked with understanding the structure and patterns in a codebase.
    Analyze the following code with extreme depth and precision:

    Code:
    {code}

    Components:
    {components}

    Perform a comprehensive analysis considering:
    1. Code structure and organization
    2. Component relationships and dependencies
    3. Design patterns and architectural approaches
    4. Module boundaries and responsibilities
    5. API surfaces and interfaces
    6. Data flow and state management

    For each component, identify:
    - Its purpose and responsibility
    - How it relates to other components
    - Any patterns it implements
    - Potential architectural significance

    Return a structured analysis of the code structure.
  `),

  // Prompt for generating documentation
  documentationGenerationPrompt: PromptTemplate.fromTemplate(`
    You are an expert documentation writer creating clear, comprehensive documentation for a codebase.
    Based on the following code analysis, generate high-quality documentation:

    Code:
    {code}

    Analysis:
    {analysis}

    Create documentation that includes:
    1. A clear overview of the codebase
    2. Detailed documentation for each component, including:
       - Purpose and responsibility
       - Usage examples
       - Parameters and return values
       - Edge cases and limitations
    3. Architectural overview explaining how components fit together
    4. Usage guide for implementing and extending the code
    5. Setup instructions if applicable

    Focus on clarity, accuracy, and usefulness. Explain complex concepts in simple terms.
    Include code examples where helpful.

    Return structured documentation following the required schema.
  `),

  // Enhanced prompt for assessing documentation quality
  qualityAssessmentPrompt: PromptTemplate.fromTemplate(`
    You are a documentation quality assessor tasked with evaluating and improving documentation.
    Assess the following documentation against the codebase analysis:

    Documentation:
    {documentation}

    Analysis:
    {analysis}

    Provide a comprehensive quality assessment considering:
    1. Overall documentation coverage (0-100)
       - Are all components documented?
       - Are all important features covered?
       - Are there any significant gaps in coverage?
    
    2. Clarity of explanations (0-100)
       - Is the documentation easy to understand?
       - Are technical concepts explained appropriately for the audience?
       - Are there confusing explanations that need improvement?
    
    3. Completeness of component documentation (0-100)
       - Do components have all necessary sections (purpose, parameters, returns, examples)?
       - Are edge cases and limitations documented?
       - Are usage patterns clearly explained?
    
    4. Consistency of documentation style (0-100)
       - Is terminology used consistently?
       - Is the format and structure consistent?
       - Is the tone and level of detail consistent?
    
    5. Overall quality score (0-100)
       - A weighted average considering all factors
       - Emphasize coverage and completeness more heavily

    For each component with suboptimal documentation, provide:
    - Specific improvement suggestions with examples
    - Priority level (high/medium/low) with justification
    - Rationale for why this improvement matters to developers

    Be specific in your feedback - instead of "needs better examples," say "Add examples showing error handling for network failures."

    Return a structured quality assessment following the required schema.
  `),

  // Enhanced prompt for identifying missing documentation
  missingDocsPrompt: PromptTemplate.fromTemplate(`
    You are a documentation gap analyzer identifying areas where documentation is missing or insufficient.
    Compare the following documentation against the codebase analysis:

    Documentation:
    {documentation}

    Analysis:
    {analysis}

    Perform a thorough gap analysis with these criteria:
    1. Components completely missing documentation
       - Identify components that exist in the code but have no documentation
       - Prioritize components that are public-facing or widely used
    
    2. Components with incomplete documentation
       - Identify components with partial documentation that's missing crucial information
       - Focus on missing parameters, return values, or usage examples
    
    3. High-priority documentation gaps
       - Identify gaps that would most impact a developer using this code
       - Consider API endpoints, core classes/functions, and error handling
    
    4. Relationships and integration points
       - Identify connections between components that need better explanation
       - Focus on how components should be composed or used together

    For each gap, provide:
    - The specific component or area missing documentation
    - The impact of this missing documentation on developers
    - A detailed template or outline for what should be added
    - A severity rating (critical, high, medium, low) based on developer impact

    Return a structured list of documentation gaps following the required schema.
  `),

  // Prompt for generating architectural diagrams
  diagramGenerationPrompt: PromptTemplate.fromTemplate(`
    You are an expert at creating clear, visual representations of code architecture.
    Based on the following code analysis, generate diagram descriptions:

    Analysis:
    {analysis}

    Create diagrams that visualize:
    1. Component relationships and dependencies
    2. Class/object hierarchies
    3. Data flow through the system
    4. Architectural layers and boundaries

    For each diagram:
    - Use appropriate notation (class diagrams, flow charts, etc.)
    - Focus on clarity and usefulness
    - Include only relevant details
    - Explain what the diagram shows

    Return structured diagram descriptions in the format required.
  `)
}; 