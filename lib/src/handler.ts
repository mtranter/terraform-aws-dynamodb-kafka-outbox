import { Kafka, Producer } from "kafkajs";
import { _handler } from "./tx-outbox";
import { envOrThrow } from "./env";

let producer: Producer | undefined;
const getProducer = async (
  brokers: string[],
  username: string,
  password: string,
  authMechanism: "plain" | "scram-sha-256" | "scram-sha-512" = "plain",
  useSsl = false
) => {
  if (!producer) {
    producer = new Kafka({
      clientId: "members-service",
      brokers,
      ssl: useSsl,
      sasl: {
        mechanism: authMechanism as any,
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
  authMechanism,
  useSsl
}: {
  brokers: string[];
  username: string;
  password: string;
  authMechanism: "plain" | "scram-sha-256" | "scram-sha-512";
  useSsl: boolean;
}) => _handler(getProducer(brokers, username, password, authMechanism, useSsl));

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const handler = process.env.NODE_ENV === "test" ? (() => {}) as any : buildHandler({
  brokers: envOrThrow("KAFKA_BROKERS").split(","),
  username: envOrThrow("KAFKA_USERNAME"),
  password: envOrThrow("KAFKA_PASSWORD"),
  authMechanism: envOrThrow("KAFKA_AUTH_MECHANISM") as any,
  useSsl: envOrThrow("KAFKA_USE_SSL").toLowerCase() === "true",
});
