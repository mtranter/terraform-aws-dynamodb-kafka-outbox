import { DynamoDBStreamHandler } from "aws-lambda";
import { IHeaders, Producer, TopicMessages } from "kafkajs";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import log from "./logging";

export type TxOutboxMessage = {
  topic: string;
  key?: string;
  value: string;
  partition?: number;
  headers?: Record<string, string>;
  timestamp?: string;
  isEvent: true;
};

export const _handler =
  (producerP: Promise<Pick<Producer, "sendBatch">>): DynamoDBStreamHandler =>
  async (e) => {
    const batch = e.Records.reduce<{
      [topic: string]: {
        key: Buffer | undefined;
        value: Buffer;
        headers?: IHeaders;
      }[];
    }>((batch, next) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { NewImage } = next.dynamodb!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (NewImage) {
        const object = unmarshall(NewImage as any) as TxOutboxMessage;
        const { topic, key, value, headers } = object;
        if (!topic || !value) {
          log.error("Invalid outbox messages", object);
          throw new Error("Invalid outbox messages: " + JSON.stringify(object));
        }
        const existingBatch = batch[topic] || [];
        const newBatch = {
          ...batch,
          [topic]: [
            ...existingBatch,
            {
              key: key ? Buffer.from(key, "base64") : undefined,
              value: Buffer.from(value, "base64"),
              headers,
            },
          ],
        };
        return newBatch;
      } else {
        return batch;
      }
    }, {});

    const topicMessages: TopicMessages[] = Object.entries(batch).map(
      ([topic, messages]) => ({
        topic,
        messages,
      })
    );
    if (topicMessages.length > 0) {
      const producer = await producerP;
      await producer.sendBatch({ topicMessages, acks: -1 });
    }
  };
