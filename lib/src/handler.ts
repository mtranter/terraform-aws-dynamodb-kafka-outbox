import { Kafka, Producer } from "kafkajs";
import { _handler } from "./tx-outbox";
import { envOrThrow } from "./env";

let producer: Producer | undefined;
const getProducer = async (
  brokers: string[],
  username: string,
  password: string
) => {
  if (!producer) {
    producer = new Kafka({
      clientId: "members-service",
      brokers,
      ssl: true,
      sasl: {
        mechanism: "plain",
        username: username,
        password: password,
      },
    }).producer();
    await producer.connect();
  }
  return producer;
};

export const buildHandler = ({
  brokers,
  username,
  password,
}: {
  brokers: string[];
  username: string;
  password: string;
}) => _handler(getProducer(brokers, username, password));


export const handler = buildHandler({
  brokers: envOrThrow("KAFKA_BROKERS").split(","),
  username: envOrThrow("KAFKA_USERNAME"),
  password: envOrThrow("KAFKA_PASSWORD"),
});
