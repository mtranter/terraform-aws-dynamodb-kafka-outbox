variable "instance_name" {
  type = string
}

variable "source_table_stream_arn" {
  type = string
}

variable "kafka_brokers" {
  type = list(string)
}

variable "kafka_user_id" {
  type = string
}

variable "kafka_user_secret" {
  type = string
}

variable "kafka_auth_mechanism" {
  type    = string
  default = "plain"
}

variable "handler_layer" {
  type    = string
  default = "arn:aws:lambda:ap-southeast-2:340502884936:layer:dynamodb-kakfa-outbox:2"
}

variable "kafka_use_ssl" {
  type    = bool
  default = true
}
