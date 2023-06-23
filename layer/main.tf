terraform {
  backend "s3" {
    key    = "layer/terraform.tfstate"
    bucket = "terraform-aws-dynamodb-kafka-outbox"
  }
}

variable "is_beta" {
  type = bool
}

data "archive_file" "lambda_layer_payload" {
  type        = "zip"
  source_dir  = "${path.module}/../lib/layer"
  output_path = "${path.module}/lambda_layer_payload.zip"
}

resource "aws_lambda_layer_version" "lambda_layer" {
  filename     = data.archive_file.lambda_layer_payload.output_path
  layer_name   = "dynamodb-kakfa-outbox${var.is_beta ? "-beta" : ""}}"
  skip_destroy = true

  compatible_runtimes = ["nodejs18.x"]
}

