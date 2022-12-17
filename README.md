# jbrunton-aws.com-infra

This repository uses Pulumi to provision shared infrastructure for applications I run on AWS, using the jbrunton-aws.com domain.

## Provided resources

* One ELB load balancer
* An https listener configured for the following domains:
  * `*.jbrunton-aws.com`
  * `*.staging.jbrunton-aws.com`
  * `*.dev.jbrunton-aws.com`
* The following resource resource identifiers are exported as Stack outputs:
  * `certificateArn`
  * `listenerArn`
  * `loadBalancerArn`
  * `securityGroupId`
  * `vpcId`
