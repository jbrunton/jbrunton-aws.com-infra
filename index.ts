import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { domains } from "./domains";

const stack = pulumi.getStack();
const resourceName = `jbrunton-aws-${stack}`;

const vpc = aws.ec2.getVpcOutput({ default: true });

const subnets = aws.ec2.getSubnetsOutput(
  {
    filters: [
      {
        name: "vpc-id",
        values: [vpc.id],
      },
    ],
  },
);

const securityGroup = new aws.ec2.SecurityGroup(
  resourceName,
  {
    vpcId: vpc.id,
    description: "HTTPS access",
    ingress: [
      {
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ["0.0.0.0/0"],
      },
      {
        protocol: "tcp",
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
    egress: [
      {
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
  },
);

const loadBalancer = new aws.lb.LoadBalancer(
  resourceName,
  {
    internal: false,
    loadBalancerType: "application",
    subnets: subnets.ids,
    securityGroups: [securityGroup.id],
  },
);

const zoneId = aws.route53
  .getZone({ name: "jbrunton-aws.com" })
  .then((zone) => zone.id);

const certificate = new aws.acm.Certificate(
  resourceName,
  {
    domainName: domains.root,
    validationMethod: "DNS",
    subjectAlternativeNames: domains.alernatives,
  },
);

const records = certificate.domainValidationOptions.apply((options) =>
  options.map(
    (option) =>
      new aws.route53.Record(option.resourceRecordName, {
        allowOverwrite: true,
        name: option.resourceRecordName,
        records: [option.resourceRecordValue],
        ttl: 60,
        type: option.resourceRecordType,
        zoneId,
      })
  )
);

new aws.acm.CertificateValidation(
  resourceName,
  {
    certificateArn: certificate.arn,
    validationRecordFqdns: records.apply((record) =>
      record.map((record) => record.fqdn)
    ),
  },
)

const listener = new aws.lb.Listener(
  resourceName,
  {
    loadBalancerArn: loadBalancer.arn,
    port: 443,
    protocol: "HTTPS",
    certificateArn: certificate.arn,
    defaultActions: [
      {
        type: "fixed-response",
        fixedResponse: {
          statusCode: "503",
          contentType: "text/plain",
        },
      },
    ],
  },
);

export const loadBalancerArn = loadBalancer.arn;
export const securityGroupId = securityGroup.id;
export const certificateArn = certificate.arn;
export const listenerArn = listener.arn;
export const vpcId = vpc.id;
