import { buildHandler } from "../src/handler";
import { marshall } from "@aws-sdk/util-dynamodb";
import { SchemaRegistry } from "@kafkajs/confluent-schema-registry";
import { TxOutboxMessageFactory } from "../src/tx-outbox-message-factory";
import { Kafka } from "kafkajs";
import { Consumer } from "kafkajs";
import waitForExpect from "wait-for-expect";

jest.setTimeout(20000);

// https://github.com/kafkajs/confluent-schema-registry/issues/157
const registerSchemaWithNativeFetch = (schema: string, subject: string) => {
  return fetch("http://localhost:8081/subjects/" + subject + "/versions", {
    method: "POST",
    headers: {
      "Content-Type": "application/vnd.schemaregistry.v1+json",
    },
    body: JSON.stringify({ schema }),
  })
    .then((res) => res.json())
    .then((res) => (res as any).id as number);
};

describe("integration test", () => {
  let keySchemaId = 0;
  let valueSchemaId = 0;
  let consumer: Consumer | undefined = undefined;
  const handler = buildHandler({
    brokers: ["localhost:9092"],
    username: "test-user",
    password: "test-password",
    authMechanism: "scram-sha-256",
    useSsl: false,
  });
  const schemaRegistry = new SchemaRegistry({
    host: "http://localhost:8081",
  });
  beforeAll(async () => {
    // https://github.com/kafkajs/confluent-schema-registry/issues/157
    keySchemaId = await registerSchemaWithNativeFetch(
      '"string"',
      "test-topic-key"
    );
    valueSchemaId = (
      await schemaRegistry.register(
        {
          type: "record",
          name: "TestTopicValue",
          fields: [{ name: "name", type: "string" }],
        },
        { subject: "test-topic-value" }
      )
    ).id;

    consumer = new Kafka({
      clientId: "test-client",
      brokers: ["localhost:9092"],
      ssl: false,
      sasl: {
        mechanism: "scram-sha-256",
        username: "test-user",
        password: "test-password",
      },
    }).consumer({ groupId: "test-group" });
    await consumer.subscribe({ topic: "test-topic", fromBeginning: true });
  });
  afterAll(async () => {
    await consumer?.stop();
    await consumer?.disconnect();
  });
  it("should send data to kafka", async () => {
    const value = { name: "fred" };
    const key = "1";
    const msgFactory = TxOutboxMessageFactory({ registry: schemaRegistry });
    const msg = await msgFactory.createOutboxMessage({
      key,
      value,
      topic: "test-topic",
      keySchemaId,
      valueSchemaId,
    });
    await handler(
      {
        Records: [
          {
            dynamodb: {
              NewImage: marshall(msg, { removeUndefinedValues: true }) as any,
            },
          },
        ],
      },
      null as any,
      null as any
    );
    const messages: { key?: string; value: unknown }[] = [];
    const runP = consumer?.run({
      eachMessage: async ({ message }) => {
        messages.push({
          key: message.key
            ? await schemaRegistry.decode(message.key)
            : undefined,
          value: message.value
            ? await schemaRegistry.decode(message.value)
            : undefined,
        });
      },
    });
    await waitForExpect(
      () => {
        expect(messages).toContainEqual({ key, value });
      },
      10000,
      500
    );
    return runP
  });
});
