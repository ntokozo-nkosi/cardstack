import Foundation

enum SeedData {
    private static let didSeedKey = "didSeed.v1"

    // TODO(auth-backend): Remove this local debug seed path after iOS fetches
    // the backend-owned AWS sample decks/cards from GET /v1/decks with a Clerk
    // session token.
    static func runIfNeeded(env: AppEnvironment) {
        #if DEBUG
        guard !UserDefaults.standard.bool(forKey: didSeedKey) else { return }

        do {
            try seedAWSDecks(env: env)
            UserDefaults.standard.set(true, forKey: didSeedKey)
        } catch {
            print("SeedData failed: \(error)")
        }
        #endif
    }

    private static func seedAWSDecks(env: AppEnvironment) throws {
        let serverless = try env.decks.create(
            name: "AWS Serverless and Application Services",
            detail: "Event-driven architectures, messaging patterns, and serverless compute.",
            in: nil
        )
        _ = try env.cards.create(
            front: "What is the AWS recommended VisibilityTimeout relative to Lambda timeout?",
            back: "Set VisibilityTimeout to at least 6× the Lambda function timeout. This covers retries and partial batch processing without messages becoming visible again mid-flight.",
            in: serverless
        )
        _ = try env.cards.create(
            front: "Why use SQS between SNS and Lambda instead of SNS invoking Lambda directly?",
            back: "SQS adds durable buffering, retry, dead-letter queues, and back-pressure. Direct SNS→Lambda has no built-in retry beyond a small async retry window.",
            in: serverless
        )
        _ = try env.cards.create(
            front: "How do you add a new consumer to an SNS + SQS fanout architecture?",
            back: "Subscribe a new SQS queue to the SNS topic. SNS fans out a copy of every message to each subscribed queue, so consumers don't interfere with each other.",
            in: serverless
        )
        _ = try env.cards.create(
            front: "What Lambda setting controls how many SQS messages are processed per invocation?",
            back: "BatchSize on the event source mapping. Max 10 for standard SQS, up to 10,000 for FIFO. Pair with MaximumBatchingWindow to wait for fuller batches.",
            in: serverless
        )
        _ = try env.cards.create(
            front: "For coordinating \"wait for all processors\" without Step Functions, what pattern can you use?",
            back: "A DynamoDB counter incremented atomically by each processor. When the counter hits the expected total, a stream trigger fires the downstream workflow.",
            in: serverless
        )
        _ = try env.cards.create(
            front: "Why doesn't SQS eliminate the need for an ASG at the web tier?",
            back: "SQS smooths bursts to the worker tier, but the web tier still terminates user-facing HTTPS requests directly. Only an ASG can scale that compute capacity.",
            in: serverless
        )

        let ec2Bootstrap = try env.decks.create(
            name: "EC2 Bootstrapping",
            detail: "Flashcards related to bootstrapping EC2 instances.",
            in: nil
        )
        _ = try env.cards.create(
            front: "What's the difference between user data and cloud-init directives on EC2?",
            back: "User data is the raw script/MIME payload you pass at launch. cloud-init is the agent inside the AMI that parses and executes it (shell, cloud-config YAML, etc.).",
            in: ec2Bootstrap
        )
        _ = try env.cards.create(
            front: "How do you make user data re-run on every boot rather than only the first?",
            back: "Either configure cloud-init with `scripts-user: [always]` in /etc/cloud/cloud.cfg, or write a systemd unit that runs the bootstrap script on every start.",
            in: ec2Bootstrap
        )
        _ = try env.cards.create(
            front: "Where do user-data logs land on Amazon Linux 2?",
            back: "/var/log/cloud-init-output.log captures stdout/stderr of the user-data script. /var/log/cloud-init.log has the agent's own lifecycle logs.",
            in: ec2Bootstrap
        )

        let containers = try env.decks.create(
            name: "AWS Containers (ECS, EKS, Fargate)",
            detail: nil,
            in: nil
        )
        _ = try env.cards.create(
            front: "When would you pick ECS over EKS?",
            back: "ECS when you want AWS-native simplicity, IAM-deep integration, and don't need Kubernetes ecosystem features. EKS when you need k8s portability or existing k8s tooling.",
            in: containers
        )
        _ = try env.cards.create(
            front: "What's the practical difference between EC2 launch type and Fargate on ECS?",
            back: "EC2 launch type means you manage the underlying instances and bin-pack tasks. Fargate is serverless containers — AWS provisions the host per task; you pay per vCPU/GB-second.",
            in: containers
        )

        let ec2Storage = try env.decks.create(
            name: "EC2 Storage & Volume Management",
            detail: nil,
            in: nil
        )
        _ = try env.cards.create(
            front: "What happens to an EBS volume when its EC2 instance is terminated?",
            back: "Depends on `DeleteOnTermination`. Root volumes default to true; attached data volumes default to false. Check via DescribeInstances or the console block-device mapping.",
            in: ec2Storage
        )
        _ = try env.cards.create(
            front: "Why is instance-store volume data lost on stop but EBS data is not?",
            back: "Instance store is local SSD on the host. Stop releases the host. EBS is network-attached block storage that persists independently of the instance lifecycle.",
            in: ec2Storage
        )
        _ = try env.cards.create(
            front: "How do you resize an EBS volume without downtime?",
            back: "ModifyVolume (changes size/iops/type) → wait for optimizing state → grow the filesystem in-OS (`growpart` + `resize2fs` or `xfs_growfs`). No detach needed.",
            in: ec2Storage
        )
        _ = try env.cards.create(
            front: "What does the gp3 volume type let you decouple that gp2 didn't?",
            back: "gp3 decouples IOPS and throughput from volume size. With gp2 they scale with capacity; gp3 lets you provision them independently and cheaper at the same baseline.",
            in: ec2Storage
        )

        let awcEc2 = try env.decks.create(
            name: "AWC EC2",
            detail: nil,
            in: nil
        )
        _ = try env.cards.create(
            front: "What's the role of an AMI in launching an EC2 instance?",
            back: "The AMI is the template — root volume snapshot + launch permissions + block-device mapping. Every instance is a hydrated copy of an AMI at launch time.",
            in: awcEc2
        )

        _ = try env.decks.create(
            name: "Functional Programming",
            detail: nil,
            in: nil
        )

        _ = try env.decks.create(
            name: "Monitoring & Operations",
            detail: "Focuses on AWS services such as CloudTrail, CloudWatch, AWS Config etc.",
            in: nil
        )

        _ = try env.decks.create(
            name: "OOP",
            detail: nil,
            in: nil
        )

        let general = try env.decks.create(
            name: "General",
            detail: "General concepts in Programming.",
            in: nil
        )
        _ = try env.cards.create(
            front: "What's the difference between latency and throughput?",
            back: "Latency = time for one request to complete. Throughput = number of requests completed per unit of time. They're independent: you can have low latency and low throughput, or vice versa.",
            in: general
        )
        _ = try env.cards.create(
            front: "What's idempotency and why does it matter for retries?",
            back: "An idempotent operation produces the same result whether called once or many times. Critical for safe retries — non-idempotent retries cause duplicates (charges, emails, etc.).",
            in: general
        )

        let coreFundamentals = try env.decks.create(
            name: "AWS Core Fundamentals",
            detail: nil,
            in: nil
        )
        _ = try env.cards.create(
            front: "What's the difference between an Availability Zone and a Region?",
            back: "A Region is a geographic area (e.g. us-east-1). An AZ is one or more discrete data centres within a Region with redundant power and networking, isolated for fault tolerance.",
            in: coreFundamentals
        )
        _ = try env.cards.create(
            front: "What does the AWS Shared Responsibility Model split?",
            back: "AWS is responsible for security OF the cloud (hardware, hypervisor, facility). The customer is responsible for security IN the cloud (data, IAM, OS patching, network config).",
            in: coreFundamentals
        )
        _ = try env.cards.create(
            front: "Why is the root account considered dangerous?",
            back: "Root has unrestricted, irrevocable access to everything including billing. Best practice: enable MFA, lock it away, and use IAM users/roles for day-to-day work.",
            in: coreFundamentals
        )
    }
}
