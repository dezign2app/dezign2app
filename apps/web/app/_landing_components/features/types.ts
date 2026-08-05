export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const features: FeatureItem[] = [
  {
    id: "design",
    title: "Requirements & System Design",
    description:
      "Start with plain English. Our engine maps out the entire system topology, microservices, and databases.",
    icon: "🏗️",
  },
  {
    id: "simulate",
    title: "Data Flow Simulation",
    description:
      "Run live load tests, simulate traffic spikes, and validate API endpoints before a single line of code is written.",
    icon: "📊",
  },
  {
    id: "code",
    title: "Autonomous Coding Agents",
    description:
      "AI agents execute the system design, writing robust full-stack code adhering to best practices and patterns.",
    icon: "💻",
  },
  {
    id: "deploy",
    title: "CI/CD & Kubernetes Orchestration",
    description:
      "Zero-touch deployments. Agents write Terraform, Dockerfiles, and K8s manifests, deploying straight to your cloud.",
    icon: "☁️",
  },
];
