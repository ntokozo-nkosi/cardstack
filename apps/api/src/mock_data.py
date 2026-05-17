from .schemas import Deck


MOCK_DECKS: list[Deck] = [
    Deck(
        id="aws-serverless-and-application-services",
        name="AWS Serverless and Application Services",
        detail="Event-driven architectures, messaging patterns, and serverless compute.",
        cards=[
            {
                "id": "aws-serverless-visibility-timeout",
                "front": "What is the AWS recommended VisibilityTimeout relative to Lambda timeout?",
                "back": "Set VisibilityTimeout to at least 6x the Lambda function timeout. This covers retries and partial batch processing without messages becoming visible again mid-flight.",
                "order": 0,
            },
            {
                "id": "aws-serverless-sns-sqs-lambda",
                "front": "Why use SQS between SNS and Lambda instead of SNS invoking Lambda directly?",
                "back": "SQS adds durable buffering, retry, dead-letter queues, and back-pressure. Direct SNS->Lambda has no built-in retry beyond a small async retry window.",
                "order": 1,
            },
            {
                "id": "aws-serverless-fanout-consumer",
                "front": "How do you add a new consumer to an SNS + SQS fanout architecture?",
                "back": "Subscribe a new SQS queue to the SNS topic. SNS fans out a copy of every message to each subscribed queue, so consumers don't interfere with each other.",
                "order": 2,
            },
            {
                "id": "aws-serverless-sqs-batch-size",
                "front": "What Lambda setting controls how many SQS messages are processed per invocation?",
                "back": "BatchSize on the event source mapping. Max 10 for standard SQS, up to 10,000 for FIFO. Pair with MaximumBatchingWindow to wait for fuller batches.",
                "order": 3,
            },
            {
                "id": "aws-serverless-wait-for-all-processors",
                "front": 'For coordinating "wait for all processors" without Step Functions, what pattern can you use?',
                "back": "A DynamoDB counter incremented atomically by each processor. When the counter hits the expected total, a stream trigger fires the downstream workflow.",
                "order": 4,
            },
            {
                "id": "aws-serverless-sqs-asg-web-tier",
                "front": "Why doesn't SQS eliminate the need for an ASG at the web tier?",
                "back": "SQS smooths bursts to the worker tier, but the web tier still terminates user-facing HTTPS requests directly. Only an ASG can scale that compute capacity.",
                "order": 5,
            },
        ],
    ),
    Deck(
        id="ec2-bootstrapping",
        name="EC2 Bootstrapping",
        detail="Flashcards related to bootstrapping EC2 instances.",
        cards=[
            {
                "id": "ec2-bootstrapping-user-data-cloud-init",
                "front": "What's the difference between user data and cloud-init directives on EC2?",
                "back": "User data is the raw script/MIME payload you pass at launch. cloud-init is the agent inside the AMI that parses and executes it (shell, cloud-config YAML, etc.).",
                "order": 0,
            },
            {
                "id": "ec2-bootstrapping-rerun-user-data",
                "front": "How do you make user data re-run on every boot rather than only the first?",
                "back": "Either configure cloud-init with `scripts-user: [always]` in /etc/cloud/cloud.cfg, or write a systemd unit that runs the bootstrap script on every start.",
                "order": 1,
            },
            {
                "id": "ec2-bootstrapping-user-data-logs",
                "front": "Where do user-data logs land on Amazon Linux 2?",
                "back": "/var/log/cloud-init-output.log captures stdout/stderr of the user-data script. /var/log/cloud-init.log has the agent's own lifecycle logs.",
                "order": 2,
            },
        ],
    ),
    Deck(
        id="aws-containers-ecs-eks-fargate",
        name="AWS Containers (ECS, EKS, Fargate)",
        cards=[
            {
                "id": "aws-containers-ecs-over-eks",
                "front": "When would you pick ECS over EKS?",
                "back": "ECS when you want AWS-native simplicity, IAM-deep integration, and don't need Kubernetes ecosystem features. EKS when you need k8s portability or existing k8s tooling.",
                "order": 0,
            },
            {
                "id": "aws-containers-ec2-vs-fargate",
                "front": "What's the practical difference between EC2 launch type and Fargate on ECS?",
                "back": "EC2 launch type means you manage the underlying instances and bin-pack tasks. Fargate is serverless containers; AWS provisions the host per task; you pay per vCPU/GB-second.",
                "order": 1,
            },
        ],
    ),
    Deck(
        id="ec2-storage-volume-management",
        name="EC2 Storage & Volume Management",
        cards=[
            {
                "id": "ec2-storage-ebs-termination",
                "front": "What happens to an EBS volume when its EC2 instance is terminated?",
                "back": "Depends on `DeleteOnTermination`. Root volumes default to true; attached data volumes default to false. Check via DescribeInstances or the console block-device mapping.",
                "order": 0,
            },
            {
                "id": "ec2-storage-instance-store-vs-ebs",
                "front": "Why is instance-store volume data lost on stop but EBS data is not?",
                "back": "Instance store is local SSD on the host. Stop releases the host. EBS is network-attached block storage that persists independently of the instance lifecycle.",
                "order": 1,
            },
            {
                "id": "ec2-storage-resize-ebs",
                "front": "How do you resize an EBS volume without downtime?",
                "back": "ModifyVolume (changes size/iops/type) -> wait for optimizing state -> grow the filesystem in-OS (`growpart` + `resize2fs` or `xfs_growfs`). No detach needed.",
                "order": 2,
            },
            {
                "id": "ec2-storage-gp3-decoupling",
                "front": "What does the gp3 volume type let you decouple that gp2 didn't?",
                "back": "gp3 decouples IOPS and throughput from volume size. With gp2 they scale with capacity; gp3 lets you provision them independently and cheaper at the same baseline.",
                "order": 3,
            },
        ],
    ),
    Deck(
        id="awc-ec2",
        name="AWC EC2",
        cards=[
            {
                "id": "awc-ec2-ami-role",
                "front": "What's the role of an AMI in launching an EC2 instance?",
                "back": "The AMI is the template: root volume snapshot + launch permissions + block-device mapping. Every instance is a hydrated copy of an AMI at launch time.",
                "order": 0,
            },
        ],
    ),
    Deck(id="functional-programming", name="Functional Programming", cards=[]),
    Deck(
        id="monitoring-operations",
        name="Monitoring & Operations",
        detail="Focuses on AWS services such as CloudTrail, CloudWatch, AWS Config etc.",
        cards=[],
    ),
    Deck(id="oop", name="OOP", cards=[]),
    Deck(
        id="general",
        name="General",
        detail="General concepts in Programming.",
        cards=[
            {
                "id": "general-latency-throughput",
                "front": "What's the difference between latency and throughput?",
                "back": "Latency = time for one request to complete. Throughput = number of requests completed per unit of time. They're independent: you can have low latency and low throughput, or vice versa.",
                "order": 0,
            },
            {
                "id": "general-idempotency-retries",
                "front": "What's idempotency and why does it matter for retries?",
                "back": "An idempotent operation produces the same result whether called once or many times. Critical for safe retries: non-idempotent retries cause duplicates (charges, emails, etc.).",
                "order": 1,
            },
        ],
    ),
    Deck(
        id="aws-core-fundamentals",
        name="AWS Core Fundamentals",
        cards=[
            {
                "id": "aws-core-region-az",
                "front": "What's the difference between an Availability Zone and a Region?",
                "back": "A Region is a geographic area (e.g. us-east-1). An AZ is one or more discrete data centres within a Region with redundant power and networking, isolated for fault tolerance.",
                "order": 0,
            },
            {
                "id": "aws-core-shared-responsibility",
                "front": "What does the AWS Shared Responsibility Model split?",
                "back": "AWS is responsible for security OF the cloud (hardware, hypervisor, facility). The customer is responsible for security IN the cloud (data, IAM, OS patching, network config).",
                "order": 1,
            },
            {
                "id": "aws-core-root-account-danger",
                "front": "Why is the root account considered dangerous?",
                "back": "Root has unrestricted, irrevocable access to everything including billing. Best practice: enable MFA, lock it away, and use IAM users/roles for day-to-day work.",
                "order": 2,
            },
        ],
    ),
]
