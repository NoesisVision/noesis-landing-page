const services = [
    {
        title: "Domain perspective",
        description: "Gain instant visibility into your system's processes and use cases, along with their connections to deeper building blocks such as services, data repositories, Domain-Driven Design (DDD) patterns, and external APIs.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"> <path stroke-linecap="round" stroke-linejoin="round" d="M12 2l9 5v10l-9 5-9-5V7l9-5z" /> </svg>`,
    },
    {
        title: "Technology perspective",
        description: "Explore your system's technical structure across multiple levels—from deployable units like monoliths and microservices to database clusters, packages, and even individual classes. Understand how these elements interconnect with domain building blocks and other perspectives.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"> <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6l-6 6 6 6M13.5 6l6 6-6 6" /> </svg>`,
    },
    {
        title: "People perspective",
        description: "Identify the teams and individuals responsible for different aspects of your system. See exactly who develops specific modules within a monolith or microservice, ensuring clarity in ownership and collaboration.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"> <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9A3.75 3.75 0 1112 5.25 3.75 3.75 0 0115.75 9zM4.5 18.75a8.25 8.25 0 0115 0" /> </svg>`,
    }
];

const useCases = [
    {
        title: "Noesis UI",
        description: "An intuitive web interface that provides developers and non-technical stakeholders with immediate access to system knowledge. The UI offers interactive diagrams with clear descriptions of elements that make complex system architecture accessible to everyone involved in the project.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"> <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 003 5.25m18 0V6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 6V5.25" /> </svg>`,
    },
    {
        title: "Exportable Documentation",
        description: "Automatically generates comprehensive, up-to-date documentation that captures the current state of your system. This feature eliminates the need for manual documentation updates and ensures that technical and non-technical team members always have access to accurate, current system information.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"> <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /> </svg>`,
    },
    {
        title: "AI agents integration (MCP)",
        description: "Model Context Protocol integration enables seamless connection with AI assistants and development tools. This allows developers to leverage AI for system analysis, code generation, and architectural decision-making, while providing non-technical stakeholders with AI-powered insights about system capabilities and dependencies.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"> <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 15.75l.394 1.183a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.183.394a2.25 2.25 0 00-1.423 1.423z" /> </svg>`,
    }
];

export { services, useCases };