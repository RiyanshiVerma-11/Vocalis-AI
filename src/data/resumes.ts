import { CandidateResume } from '../types';

export const RESUME_PRESETS: CandidateResume[] = [
  {
    id: 'resume-jordan-distributed',
    fullName: 'Jordan Reed',
    headline: 'Senior / Staff Distributed Systems Architect & Infrastructure Engineer',
    yearsOfExperience: 11,
    location: 'San Francisco, CA (Open to Remote / Hybrid)',
    summary: 'Distributed systems engineer with 11+ years of experience architecting high-throughput financial infrastructure, low-latency streaming pipelines, and multi-region consensus systems. Proven track record migrating monoliths to event-driven architectures with zero customer-facing downtime.',
    skills: {
      coreArchitecture: ['Distributed Consensus (Raft/Paxos)', 'Event Sourcing & CQRS', 'Cache Coherency & Partitioning', 'Zero-Downtime Schema Migrations', 'Chaos Engineering'],
      languagesAndFrameworks: ['Go', 'Rust', 'TypeScript', 'Java', 'gRPC', 'Protobuf'],
      cloudAndInfrastructure: ['AWS (EKS, DynamoDB, RDS Aurora, SQS/SNS)', 'Kafka', 'Redis Cluster', 'Kubernetes', 'Terraform', 'eBPF'],
      practicesAndMethodologies: ['DDD (Domain-Driven Design)', 'SLO/SLI Engineering', 'Threat Modeling', 'Blameless Post-Mortems', 'Chaos Testing']
    },
    workExperience: [
      {
        company: 'Stripe / CloudScale Infrastructure',
        role: 'Staff Infrastructure Architect',
        duration: '2021 - Present',
        highlights: [
          'Led the core ledger ledger re-architecture handling 65,000 tx/sec peak with p99 latency under 45ms across 3 cloud regions.',
          'Designed an active-active Kafka & Redis replication protocol with automated split-brain fencing, eliminating 99.8% of reconciliation mismatches during regional AWS outages.',
          'Mentored 14 senior engineers across distributed systems fundamentals, API backward compatibility, and chaos engineering practices.'
        ]
      },
      {
        company: 'Datadog / StreamMetrics Inc.',
        role: 'Senior Distributed Systems Engineer',
        duration: '2017 - 2021',
        highlights: [
          'Built time-series data ingestion engine consuming 2.4B events/day using Go and custom memory-mapped ring buffers, cutting cloud compute costs by 38% ($1.2M annual savings).',
          'Authored high-performance distributed rate limiter using Redis cell token bucket algorithms with fallback local Bloom filters.'
        ]
      },
      {
        company: 'Apex Cloud Platforms',
        role: 'Software Engineer II -> Senior',
        duration: '2014 - 2017',
        highlights: [
          'Migrated monolithic Ruby/Postgres application to modular microservices with transactional outbox pattern.',
          'Implemented automated CI/CD canary deployment pipeline reducing deployment failure rates from 8.2% to 0.4%.'
        ]
      }
    ],
    education: [
      {
        institution: 'University of California, Berkeley',
        degree: 'B.S. in Electrical Engineering & Computer Sciences (EECS)',
        year: '2014'
      }
    ],
    notableProjects: [
      {
        name: 'Global Real-Time Payments Mesh',
        description: 'Multi-region payment authorization pipeline utilizing quorum writes and idempotency tokens to guarantee exactly-once processing.',
        metrics: '65k TPS, 99.999% availability, <45ms p99 latency'
      },
      {
        name: 'Distributed Lock & Lease Coordinator',
        description: 'Lightweight distributed lock manager implemented in Rust with Raft heartbeats for leader leases.',
        metrics: 'Zero split-brain occurrences across 18 months of production chaos testing'
      }
    ]
  },
  {
    id: 'resume-alex-fullstack',
    fullName: 'Alex Rivera',
    headline: 'Lead Full-Stack Product Architect & Engineering Lead',
    yearsOfExperience: 8,
    location: 'New York, NY (Hybrid)',
    summary: 'Product-minded engineering lead with 8 years of experience building mission-critical B2B web applications, collaborative real-time canvases, and high-converting e-commerce checkouts. Expert at balancing rapid product velocity with robust clean architecture.',
    skills: {
      coreArchitecture: ['Micro-frontends & Module Federation', 'Real-time WebSockets & WebRTC', 'GraphQL Federation', 'Optimistic UI & Offline Sync', 'Performance Web Vitals'],
      languagesAndFrameworks: ['TypeScript', 'React', 'Node.js', 'Next.js', 'PostgreSQL', 'GraphQL', 'Tailwind CSS'],
      cloudAndInfrastructure: ['GCP (Cloud Run, Spanner)', 'Vercel Edge', 'Docker', 'Redis', 'Datadog RUM'],
      practicesAndMethodologies: ['Continuous Discovery', 'A/B Experimentation', 'Design System Governance', 'Agile / Shape Up', 'Accessibility WCAG AAA']
    },
    workExperience: [
      {
        company: 'Shopify / Merchant Platform',
        role: 'Staff Full-Stack & UI Architect',
        duration: '2021 - Present',
        highlights: [
          'Architected the modernized checkout engine for 45,000+ top-tier merchants, improving conversion by 3.2% (estimated +$180M GMV annually).',
          'Created real-time collaborative cart synchronization engine using WebSocket state machines with optimistic conflict resolution.',
          'Maintained 99.98% web uptime during Black Friday / Cyber Monday handling peak 120k requests per second.'
        ]
      },
      {
        company: 'Airbnb / Guest Experience',
        role: 'Senior Full-Stack Engineer',
        duration: '2018 - 2021',
        highlights: [
          'Spearheaded guest instant booking redesign, reducing initial page load LCP from 2.8s to 0.9s via server components and streaming SSR.',
          'Built internal A/B experimentation platform running 40 concurrent experiments with statistical significance guardrails.'
        ]
      }
    ],
    education: [
      {
        institution: 'Carnegie Mellon University',
        degree: 'B.S. in Computer Science',
        year: '2017'
      }
    ],
    notableProjects: [
      {
        name: 'Universal Checkout Modernization',
        description: 'Single-page checkout architecture with localized payment SDKs, dynamic form rendering, and sub-100ms client-side validation.',
        metrics: '+3.2% conversion rate uplift, 68% decrease in cart abandonment'
      }
    ]
  },
  {
    id: 'resume-taylor-sre',
    fullName: 'Taylor Brooks',
    headline: 'Principal Site Reliability & Platform Infrastructure Lead',
    yearsOfExperience: 12,
    location: 'Seattle, WA',
    summary: 'Infrastructure and SRE leader with 12 years of experience managing global Kubernetes fleets, automated disaster recovery, and 24/7 incident response for Tier-0 services. Passionate about blameless engineering culture and automated resilience.',
    skills: {
      coreArchitecture: ['Multi-Cluster Kubernetes', 'Service Mesh (Istio/Envoy)', 'Chaos Engineering & Fault Injection', 'Observability (Prometheus, OpenTelemetry, Grafana)', 'Disaster Recovery RTO/RPO'],
      languagesAndFrameworks: ['Go', 'Python', 'Bash', 'Terraform', 'Helm', 'C++'],
      cloudAndInfrastructure: ['AWS', 'GCP', 'Kubernetes', 'Envoy Proxy', 'Cilium eBPF', 'ArgoCD'],
      practicesAndMethodologies: ['Site Reliability Engineering (SRE)', 'Incident Commander Protocol', 'SLO Budgeting & Error Tracking', 'Post-Mortem Facilitation']
    },
    workExperience: [
      {
        company: 'Cloudflare / Edge Platforms',
        role: 'Principal SRE & Incident Commander',
        duration: '2020 - Present',
        highlights: [
          'Commanded incident response for Tier-0 edge routing services across 280+ data centers worldwide.',
          'Implemented automated DDoS traffic shedding and eBPF kernel packet filters that mitigated 4.2 Tbps volumetric attacks without human intervention.',
          'Reduced Mean Time to Resolution (MTTR) across org from 42 minutes to 11 minutes via automated runbooks and game-day simulations.'
        ]
      },
      {
        company: 'Uber / Infrastructure & Compute',
        role: 'Staff Infrastructure Reliability Engineer',
        duration: '2016 - 2020',
        highlights: [
          'Engineered auto-scaling Kubernetes compute cluster across 40,000 nodes running dynamic spot-instance provisioning with 35% infrastructure cost reduction.',
          'Led enterprise chaos engineering program simulating datacenter blackholes, network partitions, and database corruption.'
        ]
      }
    ],
    education: [
      {
        institution: 'University of Washington',
        degree: 'B.S. in Computer Engineering',
        year: '2013'
      }
    ],
    notableProjects: [
      {
        name: 'Automated Global Failover Controller',
        description: 'Multi-region health probe and DNS traffic shifting controller reacting to regional degradation in <8 seconds.',
        metrics: '99.999% SLA sustained for 4 consecutive years'
      }
    ]
  }
];

export const DEFAULT_RESUME: CandidateResume = RESUME_PRESETS[0];

export function getResumeById(id: string): CandidateResume {
  return RESUME_PRESETS.find((r) => r.id === id) || DEFAULT_RESUME;
}

export function createDefaultCandidateResume(fullName: string, headline?: string): CandidateResume {
  const name = fullName.trim() || 'Candidate User';
  const roleHeadline = headline?.trim() || 'Full-Stack & AI Systems Engineer';
  return {
    id: `user-profile-${name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'default'}`,
    fullName: name,
    headline: roleHeadline,
    yearsOfExperience: 3,
    location: 'Remote / Open to Relocation',
    summary: `Candidate profile for ${name}. Experienced software engineer with expertise in scalable web architectures, AI integration, and core software design patterns.`,
    skills: {
      coreArchitecture: ['System Architecture', 'Microservices', 'RESTful APIs', 'State Management'],
      languagesAndFrameworks: ['TypeScript', 'JavaScript', 'React', 'Node.js', 'Python'],
      cloudAndInfrastructure: ['Cloud Native Services', 'Docker', 'PostgreSQL', 'Redis'],
      practicesAndMethodologies: ['Agile / Scrum', 'CI/CD Pipelines', 'Code Review', 'Clean Architecture'],
    },
    workExperience: [
      {
        company: 'Software Engineering Services',
        role: roleHeadline,
        duration: '2022 - Present',
        highlights: [
          'Architected high-throughput web applications and AI-driven workflow engines.',
          'Optimized database queries and API response times for enhanced end-user experience.',
        ],
      },
    ],
    education: [
      {
        institution: 'University / Institute of Technology',
        degree: 'B.S. in Computer Science / Engineering',
        year: '2022',
      },
    ],
    notableProjects: [
      {
        name: 'AI-Powered Scalable Web Platform',
        description: 'Designed and deployed an end-to-end full-stack web platform with real-time API integrations and cloud infrastructure.',
        metrics: 'Sub-100ms response time, 99.9% availability',
      },
    ],
  };
}

