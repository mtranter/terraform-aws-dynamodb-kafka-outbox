terraform {
  backend "s3" {
    key    = "layer/terraform.tfstate"
    bucket = "terraform-aws-dynamodb-kafka-outbox"
    region = "ap-southeast-2"
  }
}

provider "aws" {
  region = "ap-southeast-2"
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
  filename            = data.archive_file.lambda_layer_payload.output_path
  layer_name          = "dynamodb-kakfa-outbox${var.is_beta ? "-beta" : ""}"
  skip_destroy        = true
  source_code_hash    = filebase64sha256(data.archive_file.lambda_layer_payload.output_path)
  compatible_runtimes = ["nodejs18.x"]
}

resource "aws_lambda_layer_version_permission" "lambda_layer_permission" {
  count          = var.is_beta ? 0 : 1
  layer_name     = aws_lambda_layer_version.lambda_layer.id
  version_number = aws_lambda_layer_version.lambda_layer.version
  principal      = "*"
  action         = "lambda:GetLayerVersion"
  statement_id   = "dev-account"

  skip_destroy = true
}
