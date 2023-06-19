
data "archive_file" "tx_outbox" {
  output_path = "${path.module}/tx-outbox-handler.zip"
  source_file = "${path.module}/../dist/tx-outbox-handler.js"
  type        = "zip"
}

module "streams_handler" {
  source       = "github.com/mtranter/platform-in-a-box-aws//modules/terraform-aws-piab-lambda"
  name         = "${var.project_name}-${var.environment}-${var.service_name}-tx-outbox"
  service_name = var.project_name
  runtime      = "nodejs18.x"
  handler      = "tx-outbox-handler.handler"
  filename     = data.archive_file.tx_outbox.output_path

  create_dlq = true
  environment_vars = {
    // kafka broker host. Split by :// to remove the protocol
    KAFKA_BROKERS  = split("://", data.aws_ssm_parameter.kafka_cluster_endpoint.value)[1]
    KAFKA_USERNAME = var.kafka_user_id
    KAFKA_PASSWORD = var.kafka_user_secret
  }
}

resource "aws_iam_role_policy" "events_handler_can_dynamo" {
  name   = "${var.project_name}-${var.environment}-${var.service_name}-tx-outbox"
  role   = module.streams_handler.execution_role.id
  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowLambdaFunctionInvocation",
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": [
                "${module.streams_handler.function.arn}"
            ]
        },
        {
            "Sid": "APIAccessForDynamoDBStreams",
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetRecords",
                "dynamodb:GetShardIterator",
                "dynamodb:DescribeStream",
                "dynamodb:ListStreams"
            ],
            "Resource": "${var.source_table_stream_arn}"
        }
    ]
}
EOF
}


resource "aws_lambda_event_source_mapping" "streams_source" {
  event_source_arn  = var.source_table_stream_arn
  function_name     = module.streams_handler.function.arn
  starting_position = "TRIM_HORIZON"
  filter_criteria {
    filter {
      pattern = jsonencode({
        eventName = ["INSERT"]
        dynamodb = {
          NewImage = {
            isEvent = {
              BOOL = [true]
            }
          }
        }
      })
    }
  }

}
