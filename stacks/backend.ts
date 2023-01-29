import cdk = require('aws-cdk-lib');
import {Construct} from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import {SubnetType} from "aws-cdk-lib/aws-ec2";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import {AdjustmentType, MetricAggregationType} from "aws-cdk-lib/aws-applicationautoscaling";

export class Backend extends cdk.Stack {
  constructor(scope: Construct, id: string, stackProps: cdk.StackProps) {
    super(scope, id, stackProps);

    const vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/21'),
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: 'Public',
          cidrMask: 24,
        },
      ],
      natGateways: 0,
    });

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      enableFargateCapacityProviders: true,
      containerInsights: true,
    });

    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs_patterns-readme.html#application-load-balanced-services
    const loadBalancedFargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster,
      assignPublicIp: true,
      taskSubnets: {
        subnetType: SubnetType.PUBLIC
      },
      memoryLimitMiB: 512,
      cpu: 256,
      taskImageOptions: {
        // image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
        image: ecs.ContainerImage.fromAsset("./src"),
      },
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      circuitBreaker: {
        rollback: true,
      },
      // desiredCount: 1,
      desiredCount: 10,
    });

    const scaling = loadBalancedFargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });
    scaling.scaleOnMetric('AggressiveCpuScaling', {
      metric: loadBalancedFargateService.service.metricCpuUtilization({
        statistic: 'Maximum',
        period: cdk.Duration.seconds(60),
      }),
      adjustmentType: AdjustmentType.CHANGE_IN_CAPACITY,
      scalingSteps: [
        { upper: 15, change: -1 },
        { lower: 40, change: +1 },
        { lower: 60, change: +3 },
      ],
      datapointsToAlarm: 1,
      evaluationPeriods: 1,
      metricAggregationType: MetricAggregationType.MAXIMUM,
      cooldown: cdk.Duration.seconds(60),
    });



    loadBalancedFargateService.targetGroup.configureHealthCheck({
      /* Uncomment to break deployment and test ECS Circuit breaker */
      // path: "/does-not-exist",
      path: "/",
    });
    loadBalancedFargateService.targetGroup.setAttribute("deregistration_delay.timeout_seconds", "30");
  }
}

export default Backend;
