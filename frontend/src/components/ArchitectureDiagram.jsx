import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position
} from "reactflow";

import "reactflow/dist/style.css";

/* =========================================================
   CUSTOM AWS SERVICE NODE
   ========================================================= */

function AWSNode({ data }) {
  return (
    <div className={`aws-node aws-${data.category || "service"}`}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0 }}
      />

      <div className="aws-node-icon">
        {data.icon}
      </div>

      <div className="aws-node-content">
        <strong>{data.label}</strong>
        <span>{data.description}</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0 }}
      />
    </div>
  );
}

const nodeTypes = {
  awsNode: AWSNode
};

/* =========================================================
   ARCHITECTURE DEFINITIONS
   ========================================================= */

function getArchitectureDiagram(architecture) {
  if (!architecture) {
    return {
      nodes: [],
      edges: []
    };
  }

  /* =======================================================
     A — TRADITIONAL / EC2
     ======================================================= */

  if (architecture.id === "A") {
    const nodes = [
      {
        id: "users",
        type: "awsNode",
        position: { x: 40, y: 220 },
        data: {
          label: "Users",
          description: "Application users",
          icon: "👥",
          category: "users"
        }
      },

      {
        id: "cloudfront",
        type: "awsNode",
        position: { x: 280, y: 220 },
        data: {
          label: "CloudFront",
          description: "Content delivery",
          icon: "☁",
          category: "network"
        }
      },

      {
        id: "alb",
        type: "awsNode",
        position: { x: 520, y: 220 },
        data: {
          label: "Application Load Balancer",
          description: "Traffic distribution",
          icon: "⚖",
          category: "network"
        }
      },

      {
        id: "ec2-1",
        type: "awsNode",
        position: { x: 770, y: 130 },
        data: {
          label: "EC2 Instance",
          description: "Application server",
          icon: "▣",
          category: "compute"
        }
      },

      {
        id: "ec2-2",
        type: "awsNode",
        position: { x: 770, y: 310 },
        data: {
          label: "EC2 Instance",
          description: "Application server",
          icon: "▣",
          category: "compute"
        }
      },

      {
        id: "rds",
        type: "awsNode",
        position: { x: 1030, y: 220 },
        data: {
          label: "Amazon RDS",
          description: "Relational database",
          icon: "▤",
          category: "database"
        }
      }
    ];

    const edges = [
      {
        id: "a-1",
        source: "users",
        target: "cloudfront"
      },

      {
        id: "a-2",
        source: "cloudfront",
        target: "alb"
      },

      {
        id: "a-3",
        source: "alb",
        target: "ec2-1"
      },

      {
        id: "a-4",
        source: "alb",
        target: "ec2-2"
      },

      {
        id: "a-5",
        source: "ec2-1",
        target: "rds"
      },

      {
        id: "a-6",
        source: "ec2-2",
        target: "rds"
      }
    ];

    return { nodes, edges };
  }

  /* =======================================================
     B — CONTAINERIZED / ECS
     ======================================================= */

  if (architecture.id === "B") {
    const nodes = [
      {
        id: "users",
        type: "awsNode",
        position: { x: 40, y: 220 },
        data: {
          label: "Users",
          description: "Application users",
          icon: "👥",
          category: "users"
        }
      },

      {
        id: "cloudfront",
        type: "awsNode",
        position: { x: 280, y: 220 },
        data: {
          label: "CloudFront",
          description: "Content delivery",
          icon: "☁",
          category: "network"
        }
      },

      {
        id: "alb",
        type: "awsNode",
        position: { x: 520, y: 220 },
        data: {
          label: "Application Load Balancer",
          description: "Traffic distribution",
          icon: "⚖",
          category: "network"
        }
      },

      {
        id: "ecs-1",
        type: "awsNode",
        position: { x: 770, y: 130 },
        data: {
          label: "ECS Container",
          description: "Application container",
          icon: "▦",
          category: "compute"
        }
      },

      {
        id: "ecs-2",
        type: "awsNode",
        position: { x: 770, y: 310 },
        data: {
          label: "ECS Container",
          description: "Application container",
          icon: "▦",
          category: "compute"
        }
      },

      {
        id: "rds",
        type: "awsNode",
        position: { x: 1030, y: 220 },
        data: {
          label: "Amazon RDS",
          description: "Relational database",
          icon: "▤",
          category: "database"
        }
      }
    ];

    const edges = [
      {
        id: "b-1",
        source: "users",
        target: "cloudfront"
      },

      {
        id: "b-2",
        source: "cloudfront",
        target: "alb"
      },

      {
        id: "b-3",
        source: "alb",
        target: "ecs-1"
      },

      {
        id: "b-4",
        source: "alb",
        target: "ecs-2"
      },

      {
        id: "b-5",
        source: "ecs-1",
        target: "rds"
      },

      {
        id: "b-6",
        source: "ecs-2",
        target: "rds"
      }
    ];

    return { nodes, edges };
  }

  /* =======================================================
     C — SERVERLESS
     ======================================================= */

  if (architecture.id === "C") {
    const nodes = [
      {
        id: "users",
        type: "awsNode",
        position: { x: 40, y: 220 },
        data: {
          label: "Users",
          description: "Application users",
          icon: "👥",
          category: "users"
        }
      },

      {
        id: "cloudfront",
        type: "awsNode",
        position: { x: 280, y: 220 },
        data: {
          label: "CloudFront",
          description: "Content delivery",
          icon: "☁",
          category: "network"
        }
      },

      {
        id: "api-gateway",
        type: "awsNode",
        position: { x: 520, y: 220 },
        data: {
          label: "API Gateway",
          description: "API entry point",
          icon: "⇄",
          category: "network"
        }
      },

      {
        id: "lambda",
        type: "awsNode",
        position: { x: 760, y: 220 },
        data: {
          label: "AWS Lambda",
          description: "Serverless compute",
          icon: "λ",
          category: "compute"
        }
      },

      {
        id: "dynamodb",
        type: "awsNode",
        position: { x: 1000, y: 220 },
        data: {
          label: "DynamoDB",
          description: "NoSQL database",
          icon: "▤",
          category: "database"
        }
      }
    ];

    const edges = [
      {
        id: "c-1",
        source: "users",
        target: "cloudfront"
      },

      {
        id: "c-2",
        source: "cloudfront",
        target: "api-gateway"
      },

      {
        id: "c-3",
        source: "api-gateway",
        target: "lambda"
      },

      {
        id: "c-4",
        source: "lambda",
        target: "dynamodb"
      }
    ];

    return { nodes, edges };
  }

  return {
    nodes: [],
    edges: []
  };
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

function ArchitectureDiagram({ architecture }) {
  if (!architecture) return null;

  const { nodes, edges } =
    getArchitectureDiagram(architecture);

  return (
    <div className="architecture-diagram">

      <div className="architecture-diagram-header">

        <div>
          <span className="section-label">
            AWS ARCHITECTURE
          </span>

          <h3>
            {architecture.name}
          </h3>

          <p>
            {architecture.type} architecture
            selected for the current workload.
          </p>
        </div>

        <div className="architecture-score-badge">

          <span>
            Overall Score
          </span>

          <strong>
            {Number(
              architecture.overall_score || 0
            ).toFixed(2)}
          </strong>

        </div>

      </div>

      <div className="architecture-flow">

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.15
          }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >

          <Background />

          <Controls />

          <MiniMap />

        </ReactFlow>

      </div>

    </div>
  );
}

export default ArchitectureDiagram;